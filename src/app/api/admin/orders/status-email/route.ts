import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number, customer_name, customer_email, status, total_amount, notes')
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
    const status = escapeHtml(order.status);
    const cancellationNote =
      order.status === 'Cancelled' && order.notes
        ? `<p style="margin:16px 0;color:#6b7280;"><strong>Note:</strong> ${escapeHtml(order.notes)}</p>`
        : '';

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'Feast & Fête <onboarding@resend.dev>',
      to: [order.customer_email],
      subject: `Order #${order.order_number} update: ${order.status}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;color:#29211d;">
          <h1 style="color:#8B1E2D;">Feast &amp; Fête</h1>
          <p>Hi ${customerName},</p>
          <p>The status of your order <strong>#${orderNumber}</strong> has been updated to:</p>
          <p style="font-size:22px;font-weight:bold;color:#8B1E2D;">${status}</p>
          ${cancellationNote}
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
        { error: 'The order was updated, but the customer email could not be sent.' },
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
