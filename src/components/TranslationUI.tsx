'use client';

import React, { useState } from 'react';
import { Pacifico } from 'next/font/google';
import styles from './TranslationUI.module.css';

// Initialize the font
const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
});

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
        <div className="relative">
          <h1 className={`${pacifico.className} text-7xl tracking-wider relative z-10`}
            style={{
              color: '#4DEEEA',
              textShadow: `
                0 0 3.75px #4DEEEA,
                0 0 11.25px #4DEEEA,
                0 0 18.75px rgba(77, 238, 234, 0.5),
                0 0 33.75px rgba(77, 238, 234, 0.3)
              `,
            }}>
            Langu-ify
          </h1>
          <svg
            className="absolute -bottom-4 left-0 w-full"
            viewBox="0 0 400 50"
            preserveAspectRatio="none"
            style={{ 
              filter: `drop-shadow(0 0 3.75px #4DEEEA)
                      drop-shadow(0 0 11.25px rgba(77, 238, 234, 0.5))` 
            }}
          >
            <path
              d="M 0,25 
                 C 100,25 100,12 200,12 
                 C 300,12 300,25 400,25 
                 C 300,25 300,38 200,38 
                 C 100,38 100,25 0,25 
                 Z"
              fill="none"
              stroke="#4DEEEA"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Translation containers */}
        <div className="w-full flex gap-6 items-stretch">
          {/* Left input container */}
          <div className={`flex-1 relative group ${styles.inputContainer}`}>
            <div className={`absolute inset-0 bg-gradient-to-t from-transparent to-[#4DEEEA]/5 rounded-xl z-0
              ${leftFocused ? 'animate-pulse' : ''}`} />
            <textarea
              placeholder="Enter English text..."
              onFocus={() => setLeftFocused(true)}
              onBlur={() => setLeftFocused(false)}
              className="w-full h-[300px] bg-neutral-900/50 backdrop-blur-sm rounded-xl p-4 text-gray-100 
              border border-neutral-800 focus:border-[#4DEEEA]/30 focus:outline-none resize-none
              placeholder-gray-500 transition-all duration-300 relative z-10"
            />
            <div className="absolute bottom-4 right-4 z-20">
              <button 
                onClick={handleTranslate}
                className={`${styles.translateButton} px-6 py-3 bg-[#4DEEEA]/5 text-[#4DEEEA] 
                rounded-lg flex items-center gap-3 font-medium relative overflow-hidden
                transition-transform active:scale-95`}
              >
                <span className="relative z-10">Translate</span>
                <svg 
                  className="w-5 h-5 relative z-10" 
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
          <div className={`flex-1 relative group ${styles.inputContainer}`}>
            <div className={`absolute inset-0 bg-gradient-to-t from-transparent to-[#4DEEEA]/5 rounded-xl z-0
              ${rightFocused ? 'animate-pulse' : ''}`} />
            <textarea
              placeholder="Translation will appear here..."
              readOnly
              onFocus={() => setRightFocused(true)}
              onBlur={() => setRightFocused(false)}
              className="w-full h-[300px] bg-neutral-900/50 backdrop-blur-sm rounded-xl p-4 text-gray-100 
              border border-neutral-800 focus:border-[#4DEEEA]/30 focus:outline-none resize-none
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