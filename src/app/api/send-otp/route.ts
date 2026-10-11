import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Missing phone or otp' },
        { status: 400 }
      );
    }

    const missingTwilioConfig =
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER;

    if (missingTwilioConfig) {
      console.log('--------------------------------------------------');
      console.log(`[MOCK SMS SERVICE] Sending OTP to ${phone}`);
      console.log(`[MOCK SMS SERVICE] Verification Code: ${otp}`);
      console.log('--------------------------------------------------');

      return NextResponse.json({
        success: true,
        message: 'Mock SMS OTP sent (check terminal console)',
        debugOtp: otp,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'SMS OTP sent successfully.',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
