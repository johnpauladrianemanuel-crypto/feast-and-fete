import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getOrderStatusLabel } from '@/lib/orderWorkflow';
import { createGuestLinkToken } from '@/lib/guestLink';
import { darkButton, darkEmailLayout, escapeHtml, formatPeso, orderSlipHtml } from '@/lib/emailTemplates';

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
        'order_number, created_at, event_date, delivery_address, customer_name, customer_email, customer_phone, guest_profile_id, status, delivery_method, payment_method, subtotal, delivery_fee, total_amount, notes, order_items(menu_item_name, quantity, unit_price, subtotal)'
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

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(
      /\/+$/,
      ''
    );
    const baseTrackingUrl = `${baseUrl}/order-status?order=${encodeURIComponent(order.order_number)}`;
    const guestToken = order.guest_profile_id ? createGuestLinkToken(order.guest_profile_id) : null;
    const trackingUrl = guestToken ? `${baseTrackingUrl}&g=${guestToken}` : baseTrackingUrl;
    const smsTrackingUrl = trackingUrl;

    // Guests who signed in with a phone number get the update by SMS.
    let smsSent = false;
    let smsError: string | null = null;
    if (order.guest_profile_id && process.env.SEMAPHORE_API_KEY) {
      const { data: guest } = await supabase
        .from('guest_profiles')
        .select('contact_type, contact_value')
        .eq('id', order.guest_profile_id)
        .maybeSingle();
      if (guest?.contact_type === 'phone') {
        let number = String(guest.contact_value || order.customer_phone || '').replace(/\D/g, '');
        if (number.startsWith('63')) number = `0${number.slice(2)}`;
        else if (number.length === 10 && number.startsWith('9')) number = `0${number}`;
        if (number) {
          const label = getOrderStatusLabel(order.delivery_method, order.status);
          const body = new URLSearchParams({
            apikey: process.env.SEMAPHORE_API_KEY,
            number,
            message: `Feast & Fete: Order #${order.order_number} is now ${label}. Track your order: ${smsTrackingUrl}`,
          });
          if (process.env.SEMAPHORE_SENDER_NAME) {
            body.set('sendername', process.env.SEMAPHORE_SENDER_NAME);
          }
          try {
            const smsResp = await fetch('https://api.semaphore.co/api/v4/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body,
            });
            const smsResult = await smsResp.json().catch(() => null);
            if (smsResp.ok && Array.isArray(smsResult)) {
              smsSent = true;
            } else {
              smsError = `SMS could not be sent: ${JSON.stringify(smsResult)}`;
              console.error('Semaphore order SMS failed:', smsResp.status, smsResult);
            }
          } catch (smsErr) {
            smsError = 'SMS service could not be reached.';
            console.error('Semaphore order SMS error:', smsErr);
          }
        }
      }
    }

    if (!order.customer_email) {
      if (smsSent) return NextResponse.json({ success: true, sms: true });
      return NextResponse.json(
        { error: smsError || 'The order has no customer email address.' },
        { status: smsError ? 502 : 400 }
      );
    }

    const customerName = escapeHtml(order.customer_name || 'Customer');
    const orderNumber = escapeHtml(order.order_number);
    const status = escapeHtml(getOrderStatusLabel(order.delivery_method, order.status));
    const cancellationNote =
      order.status === 'Cancelled' && order.notes
        ? `<p style="margin:16px 0;color:#c8a99a;"><strong>Note:</strong> ${escapeHtml(order.notes)}</p>`
        : '';

    const resend = new Resend(process.env.RESEND_API_KEY);
    const sender = fromEmail || 'Feast & F?te <orders@feastandfete.shop>';
    const { data, error } = await resend.emails.send({
      from: sender,
      to: [order.customer_email],
      subject: `Order #${order.order_number} update: ${order.status}`,
      html: darkEmailLayout({
        siteUrl: baseUrl,
        subtitle: 'Order Status Update',
        content: `
          <p style="margin:0 0 12px;">Hi ${customerName},</p>
          <p style="margin:0 0 8px;">The status of your order <strong>#${orderNumber}</strong> has been updated to:</p>
          <p style="font-size:24px;font-weight:bold;color:#f59e0b;margin:8px 0 16px;">${status}</p>
          ${cancellationNote}
          <p style="margin:0 0 20px;">Tap the button below to view your latest order status.</p>
          <p style="margin:0 0 24px;text-align:center;">${darkButton(trackingUrl, 'View Order Status')}</p>
          <p style="color:#c8a99a;font-size:13px;margin:0;">Order total: ${formatPeso(order.total_amount)}</p>
          <p style="color:#8a7266;font-size:11px;margin:12px 0 0;word-break:break-all;">If the button does not work, copy this link into your browser: ${trackingUrl}</p>
        `,
      }),
    });

    // The receipt is sent as its own email once the order is confirmed.
    if (!error && order.status === 'Confirmed') {
      const { error: receiptError } = await resend.emails.send({
        from: sender,
        to: [order.customer_email],
        subject: `Order Slip ? Order #${order.order_number}`,
        html: orderSlipHtml(order, baseUrl),
      });
      if (receiptError) console.error('Resend failed to send order slip:', receiptError);
    }

    if (error) {
      console.error('Resend failed to send order status email:', error);
      return NextResponse.json(
        {
          error: `Order status was updated, but Resend could not send the email: ${error.message}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, emailId: data?.id, sms: smsSent });
  } catch (error) {
    console.error('Unexpected order status email error:', error);
    return NextResponse.json(
      { error: 'Unable to send the customer order update email.' },
      { status: 500 }
    );
  }
}