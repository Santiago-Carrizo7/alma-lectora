import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex-1 flex flex-col bg-paper">
      {/* Content wrapper */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-dark/60 bg-paper py-8 px-4 text-center mt-auto">
        <div className="max-w-6xl mx-auto space-y-2.5">
          <p className="text-xs text-ink-muted">
            &copy; {new Date().getFullYear()} Alma Lectora. Reservados todos los derechos.
          </p>
        </div>
      </footer>
    </div>
  );
}
export default PageShell;
