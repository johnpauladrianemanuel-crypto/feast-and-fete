import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Missing email or otp' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('--------------------------------------------------');
      console.log(`[MOCK EMAIL SERVICE] Sending OTP to ${email}`);
      console.log(`[MOCK EMAIL SERVICE] Verification Code: ${otp}`);
      console.log('--------------------------------------------------');

      return NextResponse.json({
        success: true,
        message: 'Mock OTP sent (check terminal console)',
        debugOtp: otp,
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // PAALALA: Palitan ang "updates.yourdomain.com" o "feastandfete.com" kapag na-verify mo na ang domain mo sa Resend dashboard.
    // Kapag 'onboarding@resend.dev', sa sarili mong Resend account email lang ito makakapag-send.
    const { data, error } = await resend.emails.send({
      from: 'Feast & Fête <onboarding@resend.dev>', // Palitan ng verified domain halimbawa: 'Feast & Fête <noreply@yourdomain.com>'
      to: [email],
      subject: 'Your Verification Code — Feast & Fête',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Feast & Fête Guest Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #800020;">${otp}</h1>
          <p>This code will expire shortly. Do not share this code with anyone.</p>
        </div>
      `,
    });

    // Sinusuri kung nag-return ng error ang Resend (e.g. Domain restrictions)
    if (error) {
      console.error('[RESEND ERROR]:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}