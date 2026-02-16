'use client'

import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">AGS Courier</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Professional Logistics</span>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>

          {/* Right: Copyright */}
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} AGS Courier. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;