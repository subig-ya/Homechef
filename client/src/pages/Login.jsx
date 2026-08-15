import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Heart, Loader2, LogIn } from 'lucide-react';
import API from '../api/axios';
import { saveAuth, getToken, getUser, clearAuth } from '../auth/storage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const redirectToDashboard = (user, navigate) => {
  if (user?.role === 'HOMECHEF') {
    navigate('/chef/dashboard');
    return;
  }
  if (user?.role === 'ADMIN') {
    navigate('/admin/dashboard');
    return;
  }
  navigate('/dashboard');
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [shakeKey, setShakeKey] = useState(0);

  const emailRef = useRef(null);

  const successMessage = location.state?.message || '';

  // Facebook-style: if a session is already saved, the one-click
  // "Continue as [name]" card is shown instead of the sign-in form —
  // the same page a signed-in Facebook user sees at facebook.com/login.
  const savedUser = getUser();
  const hasSavedSession = Boolean(getToken() && savedUser);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    if (error) setError('');
  };

  const triggerShake = () => setShakeKey((k) => k + 1);

  const validate = () => {
    const errors = {};
    if (!EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!formData.password) {
      errors.password = 'Enter your password.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
        rememberMe
      });
      const { token, user } = response.data.data;
      saveAuth(token, user, rememberMe);
      redirectToDashboard(user, navigate);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // One-click resume of a previously saved session.
  const handleContinueAs = () => {
    if (hasSavedSession) redirectToDashboard(savedUser, navigate);
  };

  // "Not you?" — drop the saved session and show the normal form.
  const handleSwitchAccount = () => {
    clearAuth();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FDE7EF] flex items-center justify-center px-4 py-12">
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#F0DDE2] bg-white shadow-[0_25px_70px_rgba(104,63,76,0.10)] md:min-h-[620px] md:grid-cols-2">
        <div className="relative hidden min-w-0 overflow-hidden bg-[#F7E4E9] md:block">
          <img
            src="https://i.pinimg.com/736x/c9/34/e4/c934e46b425b3d04ea75225684752b33.jpg"
            alt="HomeChef"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#542A3D]/75 via-[#542A3D]/5 to-transparent" />

          <div className="absolute left-10 top-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#D96F91] shadow-sm">
              <Heart size={19} fill="currentColor" />
            </div>
          </div>

          <div className="absolute bottom-10 left-10 right-10 text-white">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/75">HomeChef</p>

            <h1 className="max-w-md font-serif text-4xl font-bold leading-[1.08] lg:text-5xl">
              Good food feels
              <span className="block text-[#F6C7D6]">better together.</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
              Discover talented home chefs, enjoy homemade food, and make every meal a little more special.
            </p>
          </div>
        </div>

        <div className="relative flex min-w-0 items-center bg-[#FFFDFC] px-7 py-10 sm:px-10 md:px-12 lg:px-16">
          <div key={shakeKey} className={`w-full max-w-md mx-auto ${error || (fieldErrors.email || fieldErrors.password) ? 'animate-shake' : ''}`}>
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#FCE8EF] text-[#D96F91] md:hidden">
                <Heart size={19} fill="currentColor" />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#C87891]">Welcome back</p>

              <h2 className="font-serif text-4xl font-bold leading-tight text-[#4A2924] sm:text-[2.7rem]">
                Let's get cooking
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#8A6B65]">
                Sign in with your account — chefs go to their chef dashboard, customers go to theirs.
              </p>
            </div>

            {hasSavedSession ? (
              // Continue-as card: the Facebook one-click sign-in experience.
              <div className="space-y-5">
                <div className="rounded-3xl border border-[#F0DDE2] bg-[#FFFAFC] p-6 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#FCE8EF] text-2xl font-bold text-[#D96F91] ring-4 ring-[#FCE8EF]">
                    {savedUser.profileImage ? (
                      <img src={savedUser.profileImage} alt={savedUser.name} className="h-full w-full object-cover" />
                    ) : (
                      (savedUser.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-[#4A2924]">Hi, {savedUser.name?.split(' ')[0]}</h3>
                  <p className="mt-0.5 text-sm text-[#8A6B65]">{savedUser.email}</p>

                  <button
                    type="button"
                    onClick={handleContinueAs}
                    className="group mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D96F91] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(217,111,145,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C45B7C]"
                  >
                    <LogIn size={17} />
                    Continue as {savedUser.name?.split(' ')[0] || savedUser.name}
                    <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <p className="mt-4 text-xs text-[#A78B86]">
                    Not you?{' '}
                    <button
                      type="button"
                      onClick={handleSwitchAccount}
                      className="font-semibold text-[#C45B7C] transition hover:text-[#A84F6B] hover:underline"
                    >
                      Log out and switch account
                    </button>
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF3F6] px-5 py-4 text-center">
                  <p className="text-sm text-[#866C67]">
                    Want a different account?{' '}
                    <Link to="/register" className="font-semibold text-[#C45B7C] transition hover:text-[#A84F6B]">
                      Create an account
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <>
                {successMessage && (
                  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {successMessage}
                  </div>
                )}

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-[#563A35]">
                      Email address
                    </label>

                    <input
                      id="login-email"
                      ref={emailRef}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className={`h-13 w-full rounded-2xl border bg-[#FFFAFC] px-4 text-sm text-[#4A2924] outline-none transition-all placeholder:text-[#B9A09C] focus:bg-white focus:ring-4 ${
                        fieldErrors.email
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-[#EBD8DE] focus:border-[#D96F91] focus:ring-[#D96F91]/10'
                      }`}
                    />

                    {fieldErrors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="login-password" className="block text-sm font-semibold text-[#563A35]">
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-[#C66C88] transition hover:text-[#A84F6B]"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className={`h-13 w-full rounded-2xl border bg-[#FFFAFC] px-4 pr-12 text-sm text-[#4A2924] outline-none transition-all placeholder:text-[#B9A09C] focus:bg-white focus:ring-4 ${
                          fieldErrors.password
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-[#EBD8DE] focus:border-[#D96F91] focus:ring-[#D96F91]/10'
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A98B87] transition hover:text-[#D96F91]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {fieldErrors.password && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.password}</p>
                    )}
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-[#EBD8DE] text-[#D96F91] accent-[#D96F91]"
                    />
                    <span className="text-xs font-medium text-[#866C67]">
                      Keep me signed in for 30 days on this device
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D96F91] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(217,111,145,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C45B7C] hover:shadow-[0_14px_30px_rgba(217,111,145,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Log in
                        <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 rounded-2xl bg-[#FFF3F6] px-5 py-4 text-center">
                  <p className="text-sm text-[#866C67]">
                    New to HomeChef?{' '}
                    <Link to="/register" className="font-semibold text-[#C45B7C] transition hover:text-[#A84F6B]">
                      Create an account
                    </Link>
                  </p>
                  <p className="mt-1.5 text-xs text-[#A78B86]">
                    Want to cook for customers?{' '}
                    <Link to="/chef/register" className="font-semibold text-[#A75D7A] transition hover:text-[#8A4B62]">
                      Register as a chef
                    </Link>
                  </p>
                </div>

                <p className="mt-6 text-center text-[11px] leading-5 text-[#B19A95]">
                  By continuing, you agree to our terms and privacy policy.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
