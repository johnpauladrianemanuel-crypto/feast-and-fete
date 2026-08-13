import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    // Require phone and otp
    if (!phone || !otp) return NextResponse.json({ success: false, error: 'Missing phone or otp' }, { status: 400 });

    const SID = process.env.TWILIO_ACCOUNT_SID;
    const TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const FROM = process.env.TWILIO_FROM;

    if (!SID || !TOKEN || !FROM) {
      // Not configured — return 501 so client can fallback to demo mode
      return NextResponse.json({ success: false, error: 'SMS provider not configured' }, { status: 501 });
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;
    const body = new URLSearchParams();
    body.append('To', phone);
    body.append('From', FROM);
    body.append('Body', `Your Feast & Fête verification code is ${otp}`);

    const auth = Buffer.from(`${SID}:${TOKEN}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message || String(err) }, { status: 500 });
  }
}
