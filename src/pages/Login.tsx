import { useState } from 'react';
import { securityService } from '../services/security.service';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  maintenanceMessage?: string | null;
}

export default function Login({ onLogin, maintenanceMessage }: LoginProps) {
  const [userType, setUserType] = useState<'student' | 'sponsor' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);

    // Sanitize inputs
    const sanitizedEmail = securityService.sanitizeInput(email.trim().toLowerCase());
    const sanitizedPassword = password.trim();

    // Validate email format
    if (!securityService.isValidEmail(sanitizedEmail)) {
      setSecurityError('Invalid email format');
      return;
    }

    // Check if account is locked
    if (await securityService.isLockedOut(sanitizedEmail)) {
      const minutes = await securityService.getLockoutTimeRemaining(sanitizedEmail);
      setSecurityError(
        `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
      );
      return;
    }

    // Check remaining attempts
    const remainingAttempts = await securityService.getRemainingAttempts(sanitizedEmail);
    if (remainingAttempts <= 2 && remainingAttempts > 0) {
      console.warn(`[Security] ${remainingAttempts} login attempts remaining`);
    }

    setIsLoading(true);

    try {
      await onLogin({ email: sanitizedEmail, password: sanitizedPassword });
      // Success - record successful login
      await securityService.recordLoginAttempt(sanitizedEmail, true);
    } catch (error) {
      // Failure - record failed attempt
      await securityService.recordLoginAttempt(sanitizedEmail, false);

      // Apply progressive delay
      await securityService.applyProgressiveDelay(sanitizedEmail);

      // Check if now locked out
      if (await securityService.isLockedOut(sanitizedEmail)) {
        const minutes = await securityService.getLockoutTimeRemaining(sanitizedEmail);
        setSecurityError(
          `Account locked due to too many failed attempts. Please try again in ${minutes} minutes.`
        );
      } else {
        const remaining = await securityService.getRemainingAttempts(sanitizedEmail);
        if (remaining > 0) {
          setSecurityError(
            `Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before account lockout.`
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setUserType(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Security Error Alert */}
      {securityError && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg bg-red-600 text-white text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="flex-1">{securityError}</span>
            <button onClick={() => setSecurityError(null)} className="ml-2 font-bold text-xl flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2">×</button>
          </div>
        </div>
      )}

      {/* Maintenance Mode Modal */}
      {maintenanceMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-md relative">
              <div className="text-center">
                {/* Lock Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-3 sm:mb-4">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">
                  Student Access Temporarily Unavailable
                </h3>

                {/* Message */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm text-yellow-700 text-left">
                        {maintenanceMessage}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-2">
                  Our administrators are currently updating grades. Please try logging in again in a few minutes.
                </p>

                {/* OK Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-green-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition min-h-[48px] text-sm sm:text-base"
                >
                  OK, I'll Try Again Later
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}stpeter.jpg)` }}
      >
        <div className="absolute inset-0 bg-green-900/70"></div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800 mb-2 leading-tight">
            St. Peter Claver Catholic High School
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Login` : 'Joyfully striving for a better tomorrow'}
          </p>
        </div>

        {!userType ? (
          /* Role Selection */
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => setUserType('student')}
              className="w-full bg-green-600 text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 min-h-[48px] text-sm sm:text-base"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Login as Student
            </button>

            <button
              onClick={() => setUserType('sponsor')}
              className="w-full bg-green-700 text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-800 transition flex items-center justify-center gap-2 min-h-[48px] text-sm sm:text-base"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Login as Sponsor
            </button>
          </div>
        ) : (
          /* Login Form */
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
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition min-h-[44px]"
                placeholder={`${userType}@school.com`}
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition min-h-[44px]"
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

            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-300 transition min-h-[48px] text-sm sm:text-base"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 ${
                  userType === 'student' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-green-700 hover:bg-green-800'
                } text-white py-2.5 sm:py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm sm:text-base`}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
