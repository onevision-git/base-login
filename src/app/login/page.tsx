'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/auth/send-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage('Magic link sent to your email');
    } else {
      setMessage(data.error || 'Login failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Login</h1>

        {message && (
          <div className="bg-blue-100 text-blue-700 p-2 rounded">{message}</div>
        )}

        <input
          type="email"
          required
          placeholder="Your email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded hover:bg-gray-800 transition"
        >
          Send Magic Link
        </button>
      </form>
    </main>
  );
}
