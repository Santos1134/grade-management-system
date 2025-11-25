import { useState } from 'react';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => void;
}

export default function Login({ onLogin }: LoginProps) {
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

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === resetEmail && u.role === 'admin');

    if (!user) {
      setNotification({ message: 'No admin account found with this email', type: 'error' });
      return;
    }

    // Generate a simple reset token (in production, this should be more secure)
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetTokens = JSON.parse(localStorage.getItem('resetTokens') || '[]');
    resetTokens.push({
      email: resetEmail,
      token: resetToken,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('resetTokens', JSON.stringify(resetTokens));

    setNotification({
      message: `Password reset link sent! Use token: ${resetToken}`,
      type: 'success'
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
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 font-bold">×</button>
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
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            St. Peter Claver Catholic High School
          </h1>
          <p className="text-gray-600">
            {userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Login` : 'Joyfully striving for a better tomorrow'}
          </p>
        </div>

        {!userType ? (
          /* Role Selection */
          <div className="space-y-4">
            <button
              onClick={() => setUserType('student')}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Login as Student
            </button>

            <button
              onClick={() => setUserType('sponsor')}
              className="w-full bg-green-700 text-white py-4 rounded-lg font-semibold hover:bg-green-800 transition flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Login as Sponsor
            </button>

            <button
              onClick={() => setUserType('admin')}
              className="w-full bg-gray-700 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Login
            </button>

            {/* Demo accounts info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2 font-medium">Demo Accounts:</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Student: student@school.com / password123</p>
                <p>Sponsor: sponsor@school.com / password123</p>
                <p>Admin: admin@school.com / admin123</p>
              </div>
            </div>
          </div>
        ) : (
          /* Login Form */
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
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
                } text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            {/* Demo account hint */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                Demo {userType}: {userType}@school.com / {userType === 'admin' ? 'admin123' : 'password123'}
              </p>
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
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reset Admin Password</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter your admin email address to receive a password reset token.
              </p>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@school.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
