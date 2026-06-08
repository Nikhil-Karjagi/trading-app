"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-gray-800 text-gray-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand / Meta Column */}
          <div className="space-y-3">
            <span className="text-emerald-400 font-bold tracking-wider text-lg">
              ALGO<span className="text-gray-100">TRADING</span>
            </span>
            <p className="text-xs text-gray-500 max-w-sm">
              An educational sandbox built to simulate high-frequency mechanics, technical indicators, and complex fiscal tax tracking.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-2">
            <h4 className="text-gray-200 font-medium text-xs uppercase tracking-wider">Platform Links</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/" className="hover:text-emerald-400 transition-colors">Sandbox</Link>
              <Link href="/learn" className="hover:text-emerald-400 transition-colors">Learning Modules</Link>
              <Link href="/about" className="hover:text-emerald-400 transition-colors">About App</Link>
              <Link href="/glossary" className="hover:text-emerald-400 transition-colors">A-Z Glossary</Link>
              <Link href="/leaderboard" className="hover:text-emerald-400 transition-colors">Leaderboard</Link>
              <Link href="/settings" className="hover:text-emerald-400 transition-colors">Settings</Link>
            </div>
          </div>

          {/* Explicit Legal Standout */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex gap-3 items-start">
            <ShieldAlert className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Legal Framework</h5>
              <p className="text-[11px] leading-relaxed text-gray-400">
                This platform is strictly for **educational purposes only**. We are **not SEBI registered** investment advisors. Content does not constitute investment or execution advice. All assets utilize **virtual paper money** simulation parameters.
              </p>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-900 pt-6 text-center text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} Educational Algorithmic Trading Platform. Built for academic optimization.</p>
          <div className="flex gap-4">
            <span className="text-[11px] text-gray-500">Restricted Access: @bmsce.ac.in domain only</span>
          </div>
        </div>
      </div>
    </footer>
  );
}