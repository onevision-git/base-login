'use client';

export default function Footer() {
  return (
    <footer className="bg-base-200 text-center py-4">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Base Login - Public Footer. All rights
        reserved.
      </p>
    </footer>
  );
}
