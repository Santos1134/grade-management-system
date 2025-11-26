import { useState } from 'react';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => void;
  maintenanceMessage?: string | null;
}

export default function Login({ onLogin, maintenanceMessage }: LoginProps) {
  const [userType, setUserType] = useState<'student' | 'sponsor' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Trim whitespace from email and password before submitting
    await onLogin({ email: email.trim(), password: password.trim() });

    setIsLoading(false);
  };

  const handleBack = () => {
    setUserType(null);
    setEmail('');
    setPassword('');
  };

  const handleForgotPassword = () => {
    if (!resetEmail) {
      setNotification({ message: 'Please enter your email address', type: 'error' });
      return;
    }

    // Note: Password reset in Supabase requires using the built-in auth.resetPasswordForEmail()
    // This is handled by Supabase's authentication system
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

      {/* Maintenance Mode Modal */}
      {maintenanceMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md">
            <div className="text-center">
              {/* Lock Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Student Access Temporarily Unavailable
              </h3>

              {/* Message */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 text-left">
                      {maintenanceMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <p className="text-sm text-gray-600 mb-6">
                Our administrators are currently updating grades. Please try logging in again in a few minutes.
              </p>

              {/* OK Button */}
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition min-h-[48px]"
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

            <button
              onClick={() => setUserType('admin')}
              className="w-full bg-gray-700 text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2 min-h-[48px] text-sm sm:text-base"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Login
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
                  userType === 'sponsor' ? 'bg-green-700 hover:bg-green-800' :
                  'bg-gray-700 hover:bg-gray-800'
                } text-white py-2.5 sm:py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm sm:text-base`}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            {/* Forgot Password Link (Only for Admin) */}
            {userType === 'admin' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>
        )}

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
