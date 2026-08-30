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

    const data = await resend.emails.send({
      from: 'Feast & Fête <onboarding@resend.dev>',
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

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}