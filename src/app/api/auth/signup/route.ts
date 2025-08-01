import { NextResponse } from 'next/server';
import { createUserAndCompany } from '@auth/service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgName, email } = body;

    if (!orgName || !email) {
      return NextResponse.json(
        { error: 'Missing orgName or email' },
        { status: 400 },
      );
    }

    const result = await createUserAndCompany(orgName, email);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Signup error:', error.message);

      if (error.message === 'User already exists') {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
