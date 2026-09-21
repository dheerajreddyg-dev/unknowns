import React from 'react';
import { Shield, Sparkles, Activity } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      {/* Top utility header */}
      <div className="border-b border-gray-100 bg-gray-50/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] text-gray-500 sm:px-6 lg:px-8 sm:text-xs">
          <span className="font-medium text-gray-700">Accessibility Scanner</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>WCAG 2.2 AA · Local analysis</span>
          </span>
        </div>
      </div>

      {/* Main banner */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700">
              <Sparkles className="h-3 w-3" />
              <span>Smart accessibility monitoring</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
                  Accessibility Scanner
                </h1>
                <p className="text-sm text-gray-500">Track, scan, and export WCAG-ready reports.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 md:text-base md:leading-relaxed">
              Monitor your websites for accessibility issues, run on-demand or automated scans,
              and share clear remediation-ready reports with your teams.
            </p>
          </div>

          <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-6 lg:max-w-xs">
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-sm text-gray-500">System status</p>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">All systems operational</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Scans today</p>
                  <p className="text-lg font-semibold text-gray-900">24</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Avg. score</p>
                  <p className="text-lg font-semibold text-gray-900">87</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;