'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) router.push('/dashboard');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };
    checkAuth();
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, orgName }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? 'Signed up successfully — check your email!'
        : data.error || 'Signup failed',
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md mx-auto bg-base-100 shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
        {message && (
          <div className="alert alert-info mb-4">
            <span>{message}</span>
          </div>
        )}
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Organisation Name"
            className="input input-bordered w-full"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <input
            type="email"
            required
            placeholder="Your email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
