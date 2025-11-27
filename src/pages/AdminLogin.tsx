import { useState } from 'react';
import { securityService } from '../services/security.service';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AdminLoginProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // Sanitize inputs
    const sanitizedEmail = securityService.sanitizeInput(email.trim().toLowerCase());
    const sanitizedPassword = password.trim();

    // Validate email format
    if (!securityService.isValidEmail(sanitizedEmail)) {
      setNotification({ message: 'Invalid email format', type: 'error' });
      return;
    }

    // Check if account is locked
    if (await securityService.isLockedOut(sanitizedEmail)) {
      const minutes = await securityService.getLockoutTimeRemaining(sanitizedEmail);
      setNotification({
        message: `Account temporarily locked. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        type: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      await onLogin({ email: sanitizedEmail, password: sanitizedPassword });
      await securityService.recordLoginAttempt(sanitizedEmail, true);
    } catch (error) {
      await securityService.recordLoginAttempt(sanitizedEmail, false);
      await securityService.applyProgressiveDelay(sanitizedEmail);

      if (await securityService.isLockedOut(sanitizedEmail)) {
        const minutes = await securityService.getLockoutTimeRemaining(sanitizedEmail);
        setNotification({
          message: `Account locked due to multiple failed attempts. Try again in ${minutes} minutes.`,
          type: 'error'
        });
      } else {
        const remaining = await securityService.getRemainingAttempts(sanitizedEmail);
        if (remaining > 0) {
          setNotification({
            message: `Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
            type: 'error'
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!resetEmail) {
      setNotification({ message: 'Please enter your email address', type: 'error' });
      return;
    }

    setNotification({
      message: 'Password reset must be done through Supabase Dashboard: Authentication > Users',
      type: 'error'
    });

    setTimeout(() => {
      setShowForgotPassword(false);
      setResetEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white text-sm sm:text-base`}>
          <div className="flex items-center gap-2">
            <span className="flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 font-bold text-xl flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2">×</button>
          </div>
        </div>
      )}

      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}stpeter.jpg)` }}
      >
        <div className="absolute inset-0 bg-gray-900/70"></div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 leading-tight">
            St. Peter Claver Catholic High School
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-semibold">
            Administrator Login
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition min-h-[44px]"
              placeholder="admin@school.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition min-h-[44px]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm sm:text-base"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md mx-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Reset Admin Password</h3>
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                Enter your admin email address to receive a password reset token.
              </p>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@school.com"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3 sm:mb-4 min-h-[44px]"
              />
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition min-h-[48px] text-sm sm:text-base font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition min-h-[48px] text-sm sm:text-base font-semibold"
                >
                  Send Reset Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
