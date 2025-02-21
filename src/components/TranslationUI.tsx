'use client';

import React, { useState } from 'react';

const TranslationUI = () => {
  const [leftFocused, setLeftFocused] = useState(false);
  const [rightFocused, setRightFocused] = useState(false);

  const handleTranslate = () => {
    console.log('Translating...'); // We'll implement this later
  };

  return (
    <div className="min-h-screen bg-black p-6 flex items-center justify-center">
      <div className="w-full max-w-6xl flex flex-col items-center gap-8">
        {/* Title */}
        <h1 className="text-7xl font-bold tracking-wider"
          style={{
            color: '#5fe6c4',
            textShadow: `
              0 0 5px #5fe6c4,
              0 0 15px #5fe6c4,
              0 0 25px rgba(0, 255, 255, 0.7),
              0 0 45px rgba(0, 255, 255, 0.4)
            `,
          }}>
          LANG-IFY
        </h1>

        {/* Translation containers */}
        <div className="w-full flex gap-6 items-stretch">
          {/* Left input container */}
          <div className="flex-1 relative group">
            <div className={`absolute inset-0 bg-gradient-to-t from-transparent to-blue-500/5 rounded-xl z-0
              ${leftFocused ? 'animate-pulse' : ''}`} />
            <textarea
              placeholder="Enter English text..."
              onFocus={() => setLeftFocused(true)}
              onBlur={() => setLeftFocused(false)}
              className="w-full h-[300px] bg-neutral-900/50 backdrop-blur-sm rounded-xl p-4 text-gray-100 
              border border-neutral-800 focus:border-blue-500/30 focus:outline-none resize-none
              placeholder-gray-500 transition-all duration-300 relative z-10"
            />
            <div className="absolute bottom-4 right-4 z-20">
              <button 
                onClick={handleTranslate}
                className="px-4 py-2 bg-[#5fe6c4]/10 hover:bg-[#5fe6c4]/20 text-[#5fe6c4] 
                rounded-lg transition-colors border border-[#5fe6c4]/30 flex items-center gap-2
                hover:border-[#5fe6c4]/50 active:transform active:scale-95"
              >
                <span>Translate</span>
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right output container */}
          <div className="flex-1 relative group">
            <div className={`absolute inset-0 bg-gradient-to-t from-transparent to-blue-500/5 rounded-xl z-0
              ${rightFocused ? 'animate-pulse' : ''}`} />
            <textarea
              placeholder="Translation will appear here..."
              readOnly
              onFocus={() => setRightFocused(true)}
              onBlur={() => setRightFocused(false)}
              className="w-full h-[300px] bg-neutral-900/50 backdrop-blur-sm rounded-xl p-4 text-gray-100 
              border border-neutral-800 focus:border-blue-500/30 focus:outline-none resize-none
              placeholder-gray-500 relative z-10"
            />
            <div className="absolute bottom-4 right-4 z-20">
              <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationUI; 