import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Heart } from 'lucide-react';
import API from '../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const successMessage = location.state?.message || '';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/login', formData);
      const { token, user } = response.data.data;

      localStorage.setItem('homechef_token', token);
      localStorage.setItem('homechef_user', JSON.stringify(user));

      if (user.role === 'HOMECHEF') {
        navigate('/chef/dashboard');
        return;
      }
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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
            <div className="w-full max-w-md mx-auto">
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#563A35]">Email address</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="h-13 w-full rounded-2xl border border-[#EBD8DE] bg-[#FFFAFC] px-4 text-sm text-[#4A2924] outline-none transition-all placeholder:text-[#B9A09C] focus:border-[#D96F91] focus:bg-white focus:ring-4 focus:ring-[#D96F91]/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-[#563A35]">Password</label>

                    <button type="button" className="text-xs font-semibold text-[#C66C88] transition hover:text-[#A84F6B]">
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      className="h-13 w-full rounded-2xl border border-[#EBD8DE] bg-[#FFFAFC] px-4 pr-12 text-sm text-[#4A2924] outline-none transition-all placeholder:text-[#B9A09C] focus:border-[#D96F91] focus:bg-white focus:ring-4 focus:ring-[#D96F91]/10"
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D96F91] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(217,111,145,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C45B7C] hover:shadow-[0_14px_30px_rgba(217,111,145,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'Log in'}

                  {!loading && (
                    <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                  )}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#F0E1E5]" />
                <span className="text-xs font-medium text-[#B39A96]">or</span>
                <div className="h-px flex-1 bg-[#F0E1E5]" />
              </div>

              <div className="rounded-2xl bg-[#FFF3F6] px-5 py-4 text-center">
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
            </div>
          </div>
      </div>
    </div>
  );
};

export default Login;
