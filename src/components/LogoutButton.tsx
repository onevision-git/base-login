// File: src/components/LogoutButton.tsx
'use client';

import React from 'react';

export default function LogoutButton() {
  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (res.redirected) window.location.href = res.url;
  };

  return (
    <button onClick={handleLogout} className="btn btn-primary btn-sm">
      Logout
    </button>
  );
}
