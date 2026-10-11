import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { darkButton, darkEmailLayout, escapeHtml, getSiteUrl } from '@/lib/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { orderId, customerName, total, items } = await request.json();

    const siteUrl = getSiteUrl(new URL(request.url).origin);
    const adminUrl = `${siteUrl}/admin-signin?next=/admin-orders`;

    const row = (label: string, value: string, valueStyle = '') => `
      <tr>
        <td style="padding:8px 0;color:#c8a99a;width:130px;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;color:#f5ede0;${valueStyle}">${value}</td>
      </tr>`;

    const data = await resend.emails.send({
      from: 'Feast & F?te <orders@feastandfete.shop>',
      to: ['johnpauladrianemanuel@gmail.com'],
      subject: `New Order Received! #${orderId}`,
      html: darkEmailLayout({
        siteUrl,
        subtitle: 'New Order Notification',
        content: `
          <h2 style="margin:0 0 16px;font-size:18px;color:#f59e0b;">You have a new order!</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            ${row('Order ID:', escapeHtml(orderId), 'font-weight:bold;')}
            ${row('Customer:', escapeHtml(customerName))}
            ${row('Items:', escapeHtml(items))}
          </table>
          <div style="background:#1b110e;border:1px solid #5a3a22;border-radius:12px;padding:14px 18px;margin-bottom:24px;">
            <span style="color:#c8a99a;">Total Amount:</span>
            <span style="float:right;color:#f59e0b;font-size:20px;font-weight:bold;">PHP ${escapeHtml(total)}</span>
          </div>
          <p style="text-align:center;margin:0 0 8px;">${darkButton(adminUrl, 'View in Admin Panel')}</p>
          <p style="color:#8a7266;font-size:11px;text-align:center;margin:12px 0 0;">You will be asked to sign in as an admin first.</p>
        `,
      }),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
