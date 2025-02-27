'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Pacifico } from 'next/font/google';
import styles from './TranslationUI.module.css';
import ReactMarkdown from 'react-markdown';

// Initialize the font
const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
});

// Custom renderer for adding extra spacing between sections
const formatTranslationOutput = (text: string): string => {
  // Add extra line breaks before section headers and table
  return text
    .replace(/### \*\*(.*?)\*\*/g, '\n\n### **$1**\n')
    .replace(/\| \*\*English\*\*/g, '\n\n| **English**')
    .replace(/---/g, '\n---\n')
    .replace(/Write your best attempt/g, '\n\nWrite your best attempt')
    .replace(/Once you get it right/g, '\n\nOnce you get it right');
};

// Extract score from translation result (e.g., 85/100)
const extractScore = (text: string): number | null => {
  const scoreMatch = text.match(/(\d+)\/100/);
  return scoreMatch ? parseInt(scoreMatch[1]) : null;
};

// Extract vocabulary table from translation result
const extractVocabulary = (text: string): Array<{english: string, spanish: string, notes: string}> => {
  const vocabularyData = [];
  const tableRegex = /\| \*\*English\*\* \| \*\*Spanish\*\* \| \*\*Notes\*\* \|[\s\S]*?(?=---|$)/;
  const tableMatch = text.match(tableRegex);
  
  if (tableMatch) {
    const rows = tableMatch[0].split('\n').filter(row => row.includes('|'));
    // Skip the header row
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split('|').filter(cell => cell.trim());
      if (cells.length >= 3) {
        vocabularyData.push({
          english: cells[0].trim().replace(/\*/g, ''),
          spanish: cells[1].trim().replace(/\*/g, ''),
          notes: cells[2].trim()
        });
      }
    }
  }
  
  return vocabularyData;
};

// Extract structure clues from translation result
const extractStructureClues = (text: string): string[] => {
  const cluesSection = text.match(/### \*\*Sentence Structure Clues:\*\*[\s\S]*?(?=---|$)/);
  if (!cluesSection) return [];
  
  const clues = cluesSection[0].split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().substring(2).trim());
  
  return clues;
};

// Extract example sentences from translation result
const extractExampleSentences = (text: string): string[] => {
  const sentences = [];
  const regex = /\d+\.\s+\*\*"([^"]+)"\*\*\s+[_(]([^)]+)[)_]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    sentences.push(`**"${match[1]}"** _(${match[2]})_`);
  }
  
  return sentences;
};

const TranslationUI = () => {
  const [leftFocused, setLeftFocused] = useState(false);
  const [rightFocused, setRightFocused] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translationResult, setTranslationResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('vocabulary');
  const [originalText, setOriginalText] = useState('');
  const [targetTranslation, setTargetTranslation] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [vocabularyData, setVocabularyData] = useState<Array<{english: string, spanish: string, notes: string}>>([]);
  const [structureClues, setStructureClues] = useState<string[]>([]);
  const [exampleSentences, setExampleSentences] = useState<string[]>([]);
  
  const prevInputRef = useRef('');

  const handleTranslate = async () => {
    if (!inputText.trim() || isTranslating) return;
    
    setIsTranslating(true);
    setTranslationResult(''); // Clear previous result
    setOriginalText(inputText); // Save the original input
    
    try {
      // Prepare messages for the API
      const messages = [];
      
      // If we had a previous translation, include it as context
      if (hasTranslated && prevInputRef.current) {
        messages.push({ 
          role: 'user', 
          content: prevInputRef.current 
        });
        
        // Also include the previous result as assistant message for context
        messages.push({ 
          role: 'assistant', 
          content: translationResult 
        });
      }
      
      // Add the current message
      messages.push({ 
        role: 'user', 
        content: inputText 
      });
      
      // Call our Gemini API endpoint
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      // Parse the JSON response
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Set the translation result with enhanced formatting
      if (data.text) {
        const formattedResult = formatTranslationOutput(data.text);
        setTranslationResult(formattedResult);
        
        // Extract data for tabbed interface
        setScore(extractScore(formattedResult));
        setVocabularyData(extractVocabulary(formattedResult));
        setStructureClues(extractStructureClues(formattedResult));
        setExampleSentences(extractExampleSentences(formattedResult));
        
        // Try to extract the target translation if available
        const targetMatch = formattedResult.match(/[""]([^""]+)[""]/);
        if (targetMatch) {
          setTargetTranslation(targetMatch[1]);
        }
      } else {
        throw new Error('No translation result received');
      }
      
      // Remember this input for context in future requests
      prevInputRef.current = inputText;
      setHasTranslated(true);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationResult('Error: Could not complete translation. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle key press events in the textarea
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If Enter is pressed without Shift, trigger translation
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      handleTranslate();
    }
    // Shift+Enter will still add a newline normally
  };

  const handleClearInput = () => {
    setInputText('');
    setOriginalText('');
    setTranslationResult('');
    setHasTranslated(false);
    setVocabularyData([]);
    setStructureClues([]);
    setExampleSentences([]);
    setScore(null);
    setTargetTranslation('');
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
              placeholder="Enter English text... (Press Enter to translate)"
              onFocus={() => setLeftFocused(true)}
              onBlur={() => setLeftFocused(false)}
              className="w-full h-[300px] bg-neutral-900/50 backdrop-blur-sm rounded-xl p-4 text-gray-100 
              border border-neutral-800 focus:border-[#4DEEEA]/30 focus:outline-none resize-none
              placeholder-gray-500 transition-all duration-300 relative z-10"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
              {inputText && (
                <button
                  onClick={handleClearInput}
                  className="px-3 py-2 bg-neutral-800 text-gray-300 rounded-lg hover:bg-neutral-700"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={handleTranslate}
                disabled={isTranslating || !inputText.trim()}
                className={`${styles.translateButton} px-6 py-3 bg-[#4DEEEA]/5 text-[#4DEEEA] 
                rounded-lg flex items-center gap-3 font-medium relative overflow-hidden
                transition-transform active:scale-95 ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="relative z-10">{isTranslating ? 'Translating...' : 'Translate'}</span>
                <svg 
                  className={`w-5 h-5 relative z-10 ${isTranslating ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {isTranslating ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Right output container */}
          <div className={`flex-1 relative group ${styles.inputContainer}`}>
            <div className={`absolute inset-0 bg-gradient-to-t from-transparent to-[#4DEEEA]/5 rounded-xl z-0
              ${rightFocused ? 'animate-pulse' : ''}`} />
              
            {translationResult ? (
              <div className="w-full h-[300px] bg-neutral-900/50 backdrop-blur-sm rounded-xl overflow-y-auto relative z-10">
                <div className="p-4">
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#4DEEEA]">Translation Result</h2>
                    <button 
                      onClick={() => setExpanded(!expanded)}
                      className="text-[#4DEEEA] hover:text-[#4DEEEA]/80 flex items-center text-sm"
                    >
                      {expanded ? "Collapse" : "Expand"} Details
                      <svg 
                        className={`ml-1 transform ${expanded ? 'rotate-180' : ''} w-4 h-4`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg shadow-inner">
                    <div className="flex items-start space-x-4">
                      <div className="w-1/2 border-r border-gray-700 pr-4">
                        <p className="text-gray-400 text-sm mb-1">Your input:</p>
                        <p className="text-white">{originalText}</p>
                      </div>
                      <div className="w-1/2 pl-4">
                        <p className="text-gray-400 text-sm mb-1">Target translation:</p>
                        <p className="text-[#4DEEEA] font-medium">{targetTranslation}</p>
                      </div>
                    </div>
                  </div>
                  
                  {expanded && (
                    <div className="transition-all duration-300">
                      <div className="border-b border-gray-700 mb-3">
                        <div className="flex space-x-2">
                          <button 
                            className={`py-2 px-3 ${activeTab === 'vocabulary' ? 'border-b-2 border-[#4DEEEA] text-[#4DEEEA]' : 'text-gray-400'}`}
                            onClick={() => setActiveTab('vocabulary')}
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              Vocabulary
                            </span>
                          </button>
                          <button 
                            className={`py-2 px-3 ${activeTab === 'structure' ? 'border-b-2 border-[#4DEEEA] text-[#4DEEEA]' : 'text-gray-400'}`}
                            onClick={() => setActiveTab('structure')}
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Structure Clues
                            </span>
                          </button>
                          <button 
                            className={`py-2 px-3 ${activeTab === 'examples' ? 'border-b-2 border-[#4DEEEA] text-[#4DEEEA]' : 'text-gray-400'}`}
                            onClick={() => setActiveTab('examples')}
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Examples
                            </span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Tab content */}
                      <div className="bg-gray-800 rounded-lg p-3 mb-3">
                        {activeTab === 'vocabulary' && (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-gray-700">
                                  <th className="text-left py-2 px-3 text-gray-400 text-sm">English</th>
                                  <th className="text-left py-2 px-3 text-gray-400 text-sm">Spanish</th>
                                  <th className="text-left py-2 px-3 text-gray-400 text-sm">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vocabularyData.map((item, index) => (
                                  <tr key={index} className="border-b border-gray-700 last:border-0">
                                    <td className="py-2 px-3">{item.english}</td>
                                    <td className="py-2 px-3 text-[#4DEEEA]">{item.spanish}</td>
                                    <td className="py-2 px-3 text-gray-400">{item.notes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {activeTab === 'structure' && (
                          <ul className="space-y-3">
                            {structureClues.map((clue, index) => (
                              <li key={index} className="flex">
                                <span className="mr-2 text-[#4DEEEA]">•</span>
                                <span dangerouslySetInnerHTML={{ 
                                  __html: clue.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#4DEEEA]">$1</strong>') 
                                }} />
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        {activeTab === 'examples' && (
                          <div>
                            <p className="mb-3 text-gray-300">More sentences using these words:</p>
                            <ul className="space-y-3">
                              {exampleSentences.map((sentence, index) => (
                                <li key={index} className="flex">
                                  <svg className="text-[#4DEEEA] mr-2 mt-1 shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span dangerouslySetInnerHTML={{ 
                                    __html: sentence
                                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#4DEEEA]">$1</strong>')
                                      .replace(/\_(.*?)\_/g, '<span class="text-gray-400">$1</span>') 
                                  }} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {score !== null && (
                        <div className="bg-gray-800 rounded-lg p-3 mt-2">
                          <h3 className="font-medium mb-2 flex items-center text-gray-200">
                            <svg className="w-4 h-4 mr-2 text-[#4DEEEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Your Performance
                          </h3>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                              <div className="bg-[#4DEEEA] h-2.5 rounded-full" style={{ width: `${score}%` }}></div>
                            </div>
                            <span className="ml-3 text-[#4DEEEA] font-medium">{score}/100</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
                    <button 
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm"
                      onClick={handleClearInput}
                    >
                      New Translation
                    </button>
                    <button 
                      className="bg-[#4DEEEA]/10 hover:bg-[#4DEEEA]/20 text-[#4DEEEA] px-3 py-1.5 rounded text-sm border border-[#4DEEEA]/30"
                      onClick={() => {
                        if (translationResult) {
                          navigator.clipboard.writeText(translationResult);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-full h-[300px] bg-neutral-900/50 backdrop-blur-sm rounded-xl p-4 text-gray-100 
                border border-neutral-800 focus:border-[#4DEEEA]/30 focus:outline-none overflow-y-auto
                placeholder-gray-500 relative z-10 flex items-center justify-center"
                tabIndex={0}
                onFocus={() => setRightFocused(true)}
                onBlur={() => setRightFocused(false)}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="text-gray-500 block">Translation will appear here...</span>
                  <span className="text-gray-600 text-sm mt-1 block">Type in English and click Translate</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden div for accessing markdown styles */}
        <div className={styles.markdownOutput} style={{ display: 'none' }}></div>
      </div>
    </div>
  );
};

export default TranslationUI; 