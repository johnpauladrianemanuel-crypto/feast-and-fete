import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('--------------------------------------------------');
  console.log('>>> [RESEND ROUTE HIT] Sending receipt...');

  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');
    const body = await req.json();
    const { order } = body;

    if (!order || !order.customer_email) {
      console.error('>>> [ERROR]: Order or customer_email is missing in body!');
      return NextResponse.json(
        { error: 'Missing order details or recipient email' },
        { status: 400 }
      );
    }

    console.log(`>>> Recipient Email: ${order.customer_email}`);
    console.log(`>>> Order Number: ${order.order_number}`);

    // Send email via Resend
    const response = await resend.emails.send({
      from: 'Feast & Fete <onboarding@resend.dev>',
      to: [order.customer_email],
      subject: `Official Receipt — Order #${order.order_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Feast & Fête - Official Receipt</h2>
          <p>Hi <strong>${order.customer_name || 'Customer'}</strong>,</p>
          <p>Your order <strong>#${order.order_number}</strong> has been marked as <strong>Completed</strong>!</p>
          <hr />
          <p><strong>Total Amount Paid:</strong> ₱${Number(order.total_amount || 0).toLocaleString()}</p>
        </div>
      `,
    });

    console.log('>>> [RESEND RAW RESPONSE]:', JSON.stringify(response, null, 2));

    if (response.error) {
      console.error('>>> [RESEND REJECTED]:', response.error);
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    console.log('>>> [SUCCESS] Sent email ID:', response.data?.id);
    return NextResponse.json({ success: true, id: response.data?.id });

  } catch (err: any) {
    console.error('>>> [CATCH BLOCK ERROR]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}