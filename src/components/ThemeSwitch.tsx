'use client';

import { useEffect, useState } from 'react';

const LIGHT = 'app'; // our custom theme (defined in globals.css)
const DARK = 'business'; // the dark fallback we set with --prefersdark

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<string>(LIGHT);

  // On mount, read current theme off <html>
  useEffect(() => {
    const current =
      document.documentElement.getAttribute('data-theme') || LIGHT;
    setTheme(current);
  }, []);

  // Apply theme to <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === LIGHT ? DARK : LIGHT));

  return (
    <button className="btn btn-sm btn-primary" onClick={toggle}>
      Toggle Theme ({theme})
    </button>
  );
}
