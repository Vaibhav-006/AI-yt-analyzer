import { useState } from 'react';
import { FiMail, FiLock, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

interface AuthProps {
  onAuthSuccess: (user: { email: string; name: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Here you would typically make an API call to your backend
      // For now, we'll simulate authentication
      if (isLogin) {
        // Simulate login delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation
        if (email === 'test@example.com' && password === 'password') {
          onAuthSuccess({ email, name: 'Test User' });
        } else {
          throw new Error('Invalid credentials');
        }
      } else {
        // Simulate signup delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation
        if (!name || !email || !password) {
          throw new Error('All fields are required');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        onAuthSuccess({ email, name });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <button
            onClick={toggleTheme}
            className={`mb-4 p-2 rounded-full ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {theme === 'dark' ? <FiSun size={24} /> : <FiMoon size={24} />}
          </button>
          <h2 className={`text-center text-3xl font-extrabold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {isLogin ? 'Sign in to NexG AI' : 'Create your NexG AI account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <div className="flex items-center relative">
                  <FiUser className={`absolute left-3 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`appearance-none rounded-none relative block w-full px-10 py-3 border ${
                      theme === 'dark'
                        ? 'border-gray-700 bg-gray-800 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Name"
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="flex items-center relative">
                <FiMail className={`absolute left-3 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none rounded-none relative block w-full px-10 py-3 border ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } ${isLogin ? 'rounded-t-md' : ''} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="flex items-center relative">
                <FiLock className={`absolute left-3 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none rounded-none relative block w-full px-10 py-3 border ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500 p-4">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign in' : 'Sign up'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:text-blue-400 text-sm"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 