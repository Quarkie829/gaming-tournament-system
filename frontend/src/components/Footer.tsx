import React from 'react';
import { Trophy, Github, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080b12] border-t border-slate-800/80 text-slate-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Project Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="font-heading text-lg font-bold tracking-wider text-white">
                ArenaHQ — Gaming Tournament Management System
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-4">
              A high-integrity competitive esports tournament platform backed by a normalized 3NF MySQL 8.0 database
              featuring unified registrations, exclusive-arc integrity checks, and real-time team and bracket management.
            </p>
            <div className="text-xs text-slate-500 font-mono">
              Course: Database Management Systems (DBMS)
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Explore Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Module 1: User & Profile Management
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Module 2: Game & Tournament Management
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Module 3: Team Management & Rosters
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Module 4: Unified Registration System
                </span>
              </li>
            </ul>
          </div>

          {/* Contributors & Authors */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Project Authors
            </h4>
            <div className="space-y-1.5 text-xs text-slate-400 font-mono">
              <p className="text-slate-200 font-semibold">Priyanshu (2025UCS1582)</p>
              <p>Dixsant Kumar (2025UCS1612)</p>
              <p>Ridham (2025UCS1609)</p>
              <p>Arpit Gahlawat (2025UCS1623)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Gaming Tournament Management System. All rights reserved.</p>
          <div className="flex items-center space-x-1 mt-2 md:mt-0">
            <span>Powered by MySQL 8.0, Node.js, Express & React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
