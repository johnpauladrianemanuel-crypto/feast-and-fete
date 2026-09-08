import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { orderId, customerName, total, items } = await request.json();

    // Palitan ito ng iyong tamang production domain kapag naka-deploy na (hal. https://yourdomain.com)
    const adminUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const data = await resend.emails.send({
      from: 'Feast & Fête <onboarding@resend.dev>',
      to: ['johnpauladrianemanuel@gmail.com'],
      subject: `New Order Received! #${orderId}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 30px; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 24px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Feast & Fête</h1>
              <p style="color: #fecdd3; margin: 5px 0 0 0; font-size: 13px;">New Order Notification</p>
            </div>

            <!-- Body Content -->
            <div style="padding: 30px;">
              <h2 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
                🎉 May Bagong Order!
              </h2>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;"><strong>Order ID:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Customer:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;"><strong>Mga Inorder:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; line-height: 1.5;">${items}</td>
                </tr>
              </table>

              <!-- Total Box -->
              <div style="background-color: #fdf2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <span style="color: #991b1b; font-size: 14px; font-weight: 600;">Kabuuang Bayarin:</span>
                <span style="color: #e11d48; font-size: 20px; font-weight: 700;">₱${total}</span>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="${adminUrl}/admin" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(225, 29, 72, 0.3);">
                  Tignan sa Admin Panel
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              
              <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0; text-align: center;">
                Pakitingnan ang iyong Supabase dashboard para sa kumpletong detalye ng delivery at customer.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 11px; color: #9ca3af; margin: 0;">Automated notification from Feast & Fête System</p>
            </div>

          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}