import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { Company } from '@auth/models/Company';
import { User } from '@auth/models/User';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export async function POST(req: Request) {
  try {
    const { orgName, email } = await req.json();

    if (!orgName || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing orgName or email' }),
        { status: 400 },
      );
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
    console.log('✅ Connected to MongoDB');

    // Extract domain from email
    const domain = email.split('@')[1];

    // Find or create company
    let company = await Company.findOne({ domain });
    if (!company) {
      company = new Company({
        name: orgName,
        domain,
        maxUsers: 3,
      });
      await company.save();
      console.log('✅ Company created:', company._id);
    } else {
      console.log('ℹ️ Company exists:', company._id);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 400,
      });
    }

    // Create user with placeholder passwordHash
    let user;
    try {
      user = new User({
        companyId: company._id,
        email,
        isMaster: true,
        role: 'admin',
        emailVerified: false,
        passwordHash: 'magic-link', // placeholder for magic link accounts
      });
      await user.save();
      console.log('✅ User created in DB:', user._id);
    } catch (userErr) {
      console.error('❌ User creation error:', userErr);
      return new Response(JSON.stringify({ error: 'User creation failed' }), {
        status: 500,
      });
    }

    // Generate magic link token
    const token = jwt.sign({ userId: user._id.toString(), email }, JWT_SECRET, {
      expiresIn: '24h',
    });
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/confirm?token=${token}`;
    console.log('ℹ️ Magic link generated:', magicLink);

    // Send email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailRes = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Confirm your email',
        html: `<p>Welcome to ${orgName}!</p>
               <p>Click the link below to confirm your email:</p>
               <p><a href="${magicLink}">${magicLink}</a></p>`,
      });
      console.log('✅ Email sent:', emailRes);
    } catch (emailErr) {
      console.error('❌ Email send error:', emailErr);
      // Still return success so user isn't blocked
    }

    return new Response(
      JSON.stringify({ message: 'Signed up successfully — check your email!' }),
      { status: 200 },
    );
  } catch (err) {
    console.error('❌ Signup error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
