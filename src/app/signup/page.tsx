'use client';
import { useState } from 'react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, orgName }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Signed up successfully — check your email to confirm!');
    } else {
      setMessage(data.error || 'Signup failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSignup} className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign Up</h1>

        {message && (
          <div className="bg-blue-100 text-blue-700 p-2 rounded">{message}</div>
        )}

        <input
          type="text"
          required
          placeholder="Organisation Name"
          className="w-full p-2 border rounded"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />

        <input
          type="email"
          required
          placeholder="Your email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          required
          placeholder="Create a password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded hover:bg-gray-800 transition"
        >
          Sign Up
        </button>
      </form>
    </main>
  );
}
