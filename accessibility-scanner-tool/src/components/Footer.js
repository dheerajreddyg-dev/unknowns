import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-8 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:text-sm">
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} Accessibility Scanner. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>Built for WCAG 2.2 AA monitoring</span>
          <span className="hidden h-3 w-px bg-gray-300 sm:inline-block" aria-hidden="true" />
          <span className="text-gray-400">Local-only demo tool – no data is sent to servers.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
