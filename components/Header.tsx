
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-emerald-400">ADK</span> & <span className="text-sky-400">Chainlit</span> Agent Builder
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};
