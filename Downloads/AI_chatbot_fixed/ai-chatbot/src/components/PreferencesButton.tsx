'use client';

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PreferencesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg"
        aria-label="Open preferences"
      >
        <img
          src="/logo.svg"
          alt="NexG Logo"
          className="w-8 h-8"
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-48">
          <div className="space-y-3">
            <button
              onClick={toggleTheme}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-800 dark:text-gray-200"
            >
              <span className="text-sm">{theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}</span>
            </button>
            <button
              onClick={() => {}}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-800 dark:text-gray-200"
            >
              <span className="text-sm">⚙️ Settings</span>
            </button>
            <button
              onClick={() => {}}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-800 dark:text-gray-200"
            >
              <span className="text-sm">❓ Help</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 