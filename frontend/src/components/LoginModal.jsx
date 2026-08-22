import React, { useState } from 'react';
import { UserCheck, Sparkles, AlertCircle, Phone, Lock, Mail, User } from 'lucide-react';
import { apiAuth } from '../services/api';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!leetcodeUsername.trim() || !password.trim()) {
      setError('Please fill in both LeetCode username and password.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError('Please provide a display name.');
      return;
    }

    setLoading(true);
    try {
      let userProfile;
      if (isSignUp) {
        userProfile = await apiAuth.register({
          leetcode_username: leetcodeUsername.trim(),
          display_name: displayName.trim(),
          password: password.trim(),
          email: email.trim() || null,
          phone_number: phoneNumber.trim() || null,
        });
      } else {
        userProfile = await apiAuth.login({
          leetcode_username: leetcodeUsername.trim(),
          password: password.trim(),
        });
      }

      onLoginSuccess(userProfile);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#282828] border border-[#3e3e3e] rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#ffa116]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#ffa116]/15 border border-[#ffa116]/30 rounded-2xl flex items-center justify-center mx-auto text-[#ffa116] shadow-lg shadow-[#ffa116]/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isSignUp ? 'Create LeetCode Tracker Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#d1d5db] font-semibold">
            {isSignUp
              ? 'Connect your LeetCode username to sync solves, rankings, and stats.'
              : 'Sign in to access your dashboard, group chats, and leaderboards.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#e5e7eb] mb-1.5">LeetCode Public Username *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. lokeshraj3521"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#ffa116] rounded-2xl px-4 py-3 text-xs pl-10 focus:outline-none font-mono"
                required
              />
              <User className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#e5e7eb] mb-1.5">Display Name *</label>
              <input
                type="text"
                placeholder="Your Name / Nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#ffa116] rounded-2xl px-4 py-3 text-xs focus:outline-none font-semibold"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#e5e7eb] mb-1.5">Password *</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#ffa116] rounded-2xl px-4 py-3 text-xs pl-10 focus:outline-none font-mono"
                required
              />
              <Lock className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#e5e7eb] mb-1.5">Phone Number (Optional for Messaging/SMS)</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#ffa116] rounded-2xl px-4 py-3 text-xs pl-10 focus:outline-none font-semibold"
                  />
                  <Phone className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#e5e7eb] mb-1.5">Email Address (Optional)</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#ffa116] rounded-2xl px-4 py-3 text-xs pl-10 focus:outline-none font-semibold"
                  />
                  <Mail className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-3.5" />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ffa116] hover:bg-[#ffa116]/90 text-black font-extrabold text-xs py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-[#ffa116]/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Validating & Connecting...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>{isSignUp ? 'Create Account & Sync' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#3e3e3e]">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-xs text-[#ffa116] hover:underline font-bold"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New here? Register with your LeetCode ID'}
          </button>
        </div>
      </div>
    </div>
  );
}
