import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getOrderStatusLabel } from '@/lib/orderWorkflow';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export async function POST(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId?: string };
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'A valid order ID is required.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service is not configured.' }, { status: 503 });
    }

    // The browser stores the admin session under a custom cookie prefix, so
    // prefer the bearer token sent by the client and fall back to cookies.
    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const supabase = bearerToken
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${bearerToken}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          }
        )
      : await createClient();
    const {
      data: { user },
      error: authError,
    } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sign in as an admin to send order updates.' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Unable to verify admin role for order email:', profileError.message);
      return NextResponse.json({ error: 'Unable to verify admin access.' }, { status: 500 });
    }
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!fromEmail && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error:
            'Order status was updated, but email is not configured. Verify a sending domain in Resend and set RESEND_FROM_EMAIL in the deployment environment.',
        },
        { status: 503 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        'order_number, customer_name, customer_email, status, delivery_method, payment_method, subtotal, delivery_fee, total_amount, notes, order_items(menu_item_name, quantity, unit_price, subtotal)'
      )
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Unable to load order for status email:', orderError.message);
      return NextResponse.json({ error: 'Unable to load the updated order.' }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    if (!order.customer_email) {
      return NextResponse.json(
        { error: 'The order has no customer email address.' },
        { status: 400 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(
      /\/+$/,
      ''
    );
    const trackingUrl = `${baseUrl}/order-status?order=${encodeURIComponent(order.order_number)}`;
    const customerName = escapeHtml(order.customer_name || 'Customer');
    const orderNumber = escapeHtml(order.order_number);
    const status = escapeHtml(getOrderStatusLabel(order.delivery_method, order.status));
    const cancellationNote =
      order.status === 'Cancelled' && order.notes
        ? `<p style="margin:16px 0;color:#6b7280;"><strong>Note:</strong> ${escapeHtml(order.notes)}</p>`
        : '';

    const formatPeso = (value: unknown) =>
      `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    const receiptSection =
      order.status === 'Confirmed'
        ? `
          <h3 style="margin:28px 0 8px;color:#29211d;">Order List &amp; Receipt</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f9f5f3;text-align:left;">
                <th style="padding:8px;border-bottom:1px solid #e5e7eb;">Item</th>
                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">Qty</th>
                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">Price</th>
                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems
                .map(
                  (item) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${escapeHtml(String(item.menu_item_name))}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:center;">${Number(item.quantity)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:right;">${formatPeso(item.unit_price)}</td>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:right;">${formatPeso(item.subtotal)}</td>
              </tr>`
                )
                .join('')}
            </tbody>
          </table>
          <table style="width:100%;margin-top:12px;font-size:14px;">
            <tr><td style="text-align:right;color:#6b7280;">Subtotal</td><td style="text-align:right;width:120px;">${formatPeso(order.subtotal)}</td></tr>
            <tr><td style="text-align:right;color:#6b7280;">Delivery Fee</td><td style="text-align:right;">${formatPeso(order.delivery_fee)}</td></tr>
            <tr><td style="text-align:right;font-weight:bold;">Total</td><td style="text-align:right;font-weight:bold;color:#8B1E2D;">${formatPeso(order.total_amount)}</td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px;">Payment method: ${escapeHtml(String(order.payment_method || 'N/A'))} &bull; ${escapeHtml(String(order.delivery_method || ''))}</p>`
        : '';

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: fromEmail || 'Feast & Fête <orders@feastandfete.shop>',
      to: [order.customer_email],
      subject:
        order.status === 'Confirmed'
          ? `Order #${order.order_number} confirmed — your receipt`
          : `Order #${order.order_number} update: ${order.status}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;color:#29211d;">
          <h1 style="color:#8B1E2D;">Feast &amp; Fête</h1>
          <p>Hi ${customerName},</p>
          <p>The status of your order <strong>#${orderNumber}</strong> has been updated to:</p>
          <p style="font-size:22px;font-weight:bold;color:#8B1E2D;">${status}</p>
          ${cancellationNote}
          ${receiptSection}
          <p>You can open the button below to view your latest order status:</p>
          <p style="margin:28px 0;">
            <a href="${trackingUrl}" style="background:#8B1E2D;color:#fff;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">
              View Order Status
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">Order total: ₱${Number(order.total_amount || 0).toLocaleString('en-PH')}</p>
          <p style="color:#9ca3af;font-size:12px;">If the button does not work, copy this link into your browser: ${trackingUrl}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend failed to send order status email:', error);
      return NextResponse.json(
        {
          error: `Order status was updated, but Resend could not send the email: ${error.message}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('Unexpected order status email error:', error);
    return NextResponse.json(
      { error: 'Unable to send the customer order update email.' },
      { status: 500 }
    );
  }
}