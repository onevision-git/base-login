import { Resend } from 'resend';

export async function POST(req: Request) {
  const body = await req.json();

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is missing in environment');
    return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), {
      status: 500,
    });
  }

  try {
    const resend = new Resend(apiKey); // ✅ safely scoped inside try block

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: body.email,
      subject: 'Hello world',
      html: '<strong>It works!</strong>',
    });

    return Response.json(data);
  } catch (error) {
    console.error('❌ Resend error:', error);
    return Response.json({ error }, { status: 500 });
  }
}
