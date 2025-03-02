'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { FiSend, FiPlus, FiMessageSquare, FiTrash2, FiSun, FiMoon, FiSquare, FiImage, FiMic, FiMicOff } from 'react-icons/fi';
import { ChatMessage, streamChat, initializeGemini } from '../utils/gemini';
import Auth from './Auth';
import { useTheme } from '../context/ThemeContext';

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

interface User {
  email: string;
  name: string;
}

export default function Chat() {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentTypingMessage, setCurrentTypingMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const typingRef = useRef({ shouldStop: false });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'image' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    const initModel = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('Please set your Gemini API key in the .env.local file');
        }

        const initializedModel = await initializeGemini(apiKey);
        setModel(initializedModel);
        
        // Add a welcome message with typing effect
        setIsTyping(true);
        typingRef.current.shouldStop = false;
        const welcomeMessage = 'Hello! I\'m NexG AI, your AI assistant powered by Next Generation. How can I help you today?';
        let currentText = '';
        
        for (let i = 0; i < welcomeMessage.length; i++) {
          if (typingRef.current.shouldStop) {
            currentText = welcomeMessage;
            setCurrentTypingMessage(welcomeMessage);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 5));
          currentText += welcomeMessage[i];
          setCurrentTypingMessage(currentText);
        }
        
        setMessages([
          {
            role: 'assistant',
            content: currentText
          }
        ]);
        setIsTyping(false);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize the Gemini model');
      } finally {
        setIsInitializing(false);
      }
    };

    initModel();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTypingMessage]);

  const simulateTyping = async (text: string) => {
    setIsTyping(true);
    typingRef.current.shouldStop = false;
    let currentText = '';
    
    for (let i = 0; i < text.length; i++) {
      if (typingRef.current.shouldStop) {
        setCurrentTypingMessage('');
        setIsTyping(false);
        return text;
      }
      await new Promise(resolve => setTimeout(resolve, 5));
      currentText += text[i];
      setCurrentTypingMessage(currentText);
    }
    
    setCurrentTypingMessage('');
    setIsTyping(false);
    return text;
  };

  const handleStopTyping = () => {
    typingRef.current.shouldStop = true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !model || isLoading) return;

    const userMessage: ChatMessage = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      let responseText = '';
      const stream = streamChat(model, [...messages, userMessage], (partial) => {
        if (!isTyping) {
          setIsTyping(true);
        }
        setCurrentTypingMessage(partial);
      });

      for await (const chunk of stream) {
        responseText += chunk;
      }

      if (!responseText.trim()) {
        throw new Error('Empty response received');
      }

      // Important: Clear typing state BEFORE adding the final message
      setIsTyping(false);
      setCurrentTypingMessage('');

      // Wait for state updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now add the final message
      const assistantMessage: ChatMessage = { 
        role: 'assistant' as const, 
        content: responseText.trim()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update chat session
      setChatSessions(prev =>
        prev.map(session =>
          session.id === currentSessionId
            ? { ...session, messages: [...session.messages, userMessage, assistantMessage] }
            : session
        )
      );

    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message || 'Failed to get a response');
      
      const errorMessage: ChatMessage = { 
        role: 'assistant' as const, 
        content: 'I apologize, but I encountered an error. Please try again.' 
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setCurrentTypingMessage('');
    }
  };

  useEffect(() => {
    // Initialize with a new chat session
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    setChatSessions([{
      id: newSessionId,
      title: 'New Chat',
      timestamp: new Date(),
      messages: []
    }]);
  }, []);

  const createNewChat = () => {
    const newSessionId = Date.now().toString();
    setChatSessions(prev => [{
      id: newSessionId,
      title: 'New Chat',
      timestamp: new Date(),
      messages: []
    }, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setError(null);
  };

  const deleteChat = (sessionId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    if (sessionId === currentSessionId) {
      // If there are other chats, switch to the most recent one
      setChatSessions(prev => {
        const remainingSessions = prev.filter(session => session.id !== sessionId);
        if (remainingSessions.length > 0) {
          // Switch to the first remaining session
          const nextSession = remainingSessions[0];
          setCurrentSessionId(nextSession.id);
          setMessages(nextSession.messages);
          return remainingSessions;
        } else {
          // Create a new chat if no sessions remain
          const newSessionId = Date.now().toString();
          const newSession = {
            id: newSessionId,
            title: 'New Chat',
            timestamp: new Date(),
            messages: []
          };
          setCurrentSessionId(newSession.id);
          setMessages([]);
          return [newSession];
        }
      });
    }
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setMessages([]);
    setChatSessions([]);
    setCurrentSessionId('');
  };

  // When switching between chats
  const switchChat = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Create object URL for immediate display
    const objectUrl = URL.createObjectURL(file);
    
    // Add file message to chat
    const fileMessage: ChatMessage = {
      role: 'user' as const,
      content: file.name,
      type: uploadType || undefined,
      mediaUrl: objectUrl
    };

    setMessages(prev => [...prev, fileMessage]);
    
    // Update chat session
    setChatSessions(prev =>
      prev.map(session =>
        session.id === currentSessionId
          ? { ...session, messages: [...session.messages, fileMessage] }
          : session
      )
    );

    // Reset file state
    setSelectedFile(null);
    setUploadType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = (type: 'image') => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('Speech recognition is not supported in this browser');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
          }
          if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Please allow microphone access in your browser settings. Click the camera icon in the address bar and refresh the page.');
          } else if (event.error === 'no-speech') {
            setError('No speech was detected. Please try again.');
          }
          setIsRecording(false);
          setMicPermission('denied');
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setTranscript('');
        };
      }
    }
  }, []);

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setTranscript('');
    } else {
      try {
        // First check if permission is already granted
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'denied') {
          setError('Microphone access is blocked. Please allow access in your browser settings and refresh the page.');
          return;
        }

        // Request microphone access
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            // Clear any previous errors
            setError(null);
            setInput('');
            recognitionRef.current?.start();
            setIsRecording(true);
            setMicPermission('granted');
          })
          .catch(err => {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please check your browser settings and ensure you have a working microphone.');
            setMicPermission('denied');
          });
      } catch (err) {
        console.error('Error in toggleRecording:', err);
        setError('Could not start speech recognition. Please try again.');
      }
    }
  };

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className={`flex h-screen overflow-hidden ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white border-r border-gray-200'
      } transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0`}>
        <button
          onClick={createNewChat}
          className="flex-shrink-0 flex items-center justify-center w-full gap-2 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> New Chat
        </button>
        <div className="flex-1 overflow-y-auto">
          {chatSessions.map(session => (
            <div
              key={session.id}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                theme === 'dark'
                  ? `hover:bg-gray-700 ${session.id === currentSessionId ? 'bg-gray-700' : ''}`
                  : `hover:bg-gray-100 ${session.id === currentSessionId ? 'bg-gray-100' : ''}`
              }`}
              onClick={() => switchChat(session.id)}
            >
              <div className={`flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FiMessageSquare />
                <span className="truncate">{session.title}</span>
              </div>
              {session.id === currentSessionId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(session.id);
                  }}
                  className={`${
                    theme === 'dark' ? 'text-gray-400 hover:text-red-500' : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header with Toggle Sidebar, Theme Toggle, and Logout */}
        <div className={`flex-shrink-0 flex items-center justify-between p-4 ${
          theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-md ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ☰
            </button>
            <div className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              <p className="font-medium">{user.name}</p>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-md transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="flex-shrink-0 bg-red-500/10 border border-red-500 text-red-500 p-4 m-4 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            {error.includes('API key') && (
              <p className="mt-2 text-sm">
                Make sure you have:
                <br />1. Added your API key to .env.local
                <br />2. Restarted the development server
                <br />3. Verified your API key is correct
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          {messages.length === 0 && !error && (
            <div className={`text-center mt-10 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isInitializing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p>Initializing NexG AI...</p>
                </div>
              ) : (
                <>
                  <p>👋 Send a message to start chatting with NexG AI</p>
                  <p className="text-sm mt-2">Try asking something like:</p>
                  <ul className="mt-2 space-y-2">
                    <li>"What can you help me with?"</li>
                    <li>"Tell me a fun fact about space"</li>
                    <li>"How do I make a chocolate cake?"</li>
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Show completed messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-800 text-gray-100'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.type === 'image' && message.mediaUrl && (
                  <img 
                    src={message.mediaUrl} 
                    alt={message.content}
                    className="max-w-full rounded-lg mb-2"
                  />
                )}
                {message.type === 'audio' && message.mediaUrl && (
                  <audio 
                    controls 
                    src={message.mediaUrl}
                    className="w-full mb-2"
                  >
                    Your browser does not support the audio element.
                  </audio>
                )}
                {(!message.type || message.type === 'text') && (
                  <ReactMarkdown
                    components={{
                      code({ className, children }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {/* Show typing message only if we're actively typing */}
          {isTyping && currentTypingMessage && !messages.find(m => m.content === currentTypingMessage) && (
            <div className="flex justify-start mb-4">
              <div className={`max-w-[80%] rounded-lg p-4 ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-100'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <ReactMarkdown
                  components={{
                    code({ className, children }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {currentTypingMessage}
                </ReactMarkdown>
                <div className="mt-2 flex space-x-1">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                  }`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                  }`} style={{ animationDelay: '150ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                  }`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className={`flex-shrink-0 border-t p-4 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex space-x-4 max-w-screen-xl mx-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => triggerFileUpload('image')}
                className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title="Upload image"
              >
                <FiImage className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-lg ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
              </button>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isRecording 
                  ? 'Listening...' 
                  : isLoading 
                  ? 'Waiting for response...' 
                  : 'Type your message...'
              }
              className={`flex-1 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${isRecording ? 'border-2 border-red-500' : ''}`}
              disabled={isLoading || !!error || isInitializing}
            />
            {isTyping ? (
              <button
                type="button"
                onClick={handleStopTyping}
                className="bg-red-600 text-white rounded-lg px-6 py-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
              >
                <FiSquare className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !!error || isInitializing}
                className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 