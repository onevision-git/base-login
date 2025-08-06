import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { User } from '@auth/models/User';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
      });
    }

    if (
      !process.env.MONGODB_URI ||
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM
    ) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500 },
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    // Generate magic link token
    const token = jwt.sign({ userId: user._id.toString(), email }, JWT_SECRET, {
      expiresIn: '24h',
    });
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/confirm?token=${token}`;

    // Send magic link email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailRes = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Your login link',
        html: `<p>Click the link below to sign in:</p>
               <p><a href="${magicLink}">${magicLink}</a></p>`,
      });
      console.log('✅ Magic link sent to:', email, emailRes);
    } catch (emailErr) {
      console.error('❌ Email send error:', emailErr);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: 'Magic link sent — check your email!' }),
      { status: 200 },
    );
  } catch (err) {
    console.error('❌ Signin error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
