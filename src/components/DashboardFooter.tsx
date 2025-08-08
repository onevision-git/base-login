// src/components/DashboardFooter.tsx

export default function DashboardFooter() {
  return (
    <footer className="bg-base-300 text-center py-4 mt-auto">
      <p className="text-xs text-base-content/70">
        &copy; {new Date().getFullYear()} Base Login – LoggedIn. All rights
        reserved.
      </p>
    </footer>
  );
}
