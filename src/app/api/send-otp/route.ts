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

    const apiKey = process.env.SEMAPHORE_API_KEY;

    if (!apiKey) {
      console.log(`[MOCK SMS] OTP for ${phone}: ${otp} (set SEMAPHORE_API_KEY to send real SMS)`);
      return NextResponse.json({
        success: true,
        message: 'Mock SMS OTP sent (check terminal console)',
        debugOtp: otp,
      });
    }

    let number = String(phone).replace(/\D/g, '');
    if (number.startsWith('63')) number = `0${number.slice(2)}`;
    else if (number.length === 10 && number.startsWith('9')) number = `0${number}`;
    const body = new URLSearchParams({
      apikey: apiKey,
      number,
      message: `Your Feast & Fete verification code is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
    });
    if (process.env.SEMAPHORE_SENDER_NAME) {
      body.set('sendername', process.env.SEMAPHORE_SENDER_NAME);
    }

    const resp = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const result = await resp.json().catch(() => null);

    if (!resp.ok || (result && !Array.isArray(result))) {
      console.error('Semaphore error:', resp.status, result);
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS', details: result },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: 'SMS OTP sent successfully.' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
