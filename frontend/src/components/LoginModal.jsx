import React, { useState } from 'react';
import { LogIn, User, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiUsers } from '../services/api';

export default function LoginModal({ isOpen, users, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanUsername = username.trim();
      // Check if user already exists
      const existing = users.find((u) => u.leetcode_username.toLowerCase() === cleanUsername.toLowerCase());

      if (existing) {
        onLoginSuccess(existing);
      } else {
        const newUser = await apiUsers.create({
          leetcode_username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
        });
        onLoginSuccess(newUser);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect LeetCode account.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user) => {
    onLoginSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#282828] border border-[#3e3e3e] w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* LeetCode Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-[#3e3e3e]/50 border border-[#555] rounded-2xl flex items-center justify-center shadow-inner">
            <svg className="w-8 h-8 fill-[#ffa116]" viewBox="0 0 24 24">
              <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.178 1.823.645l2.697 2.607c.25.25.65.25.9 0l1.2-1.2c.25-.25.25-.65 0-.9l-2.697-2.607c-1.04-1.04-2.54-1.545-4.123-1.545s-3.08.505-4.12 1.545l-4.32 4.38c-1.04 1.04-1.56 2.44-1.56 4.02s.52 2.98 1.56 4.02l4.33 4.36c1.04 1.04 2.54 1.55 4.12 1.55s3.08-.51 4.12-1.55l2.697-2.607c.25-.25.25-.65 0-.9l-1.2-1.2c-.25-.25-.65-.25-.9 0z"/>
              <path d="M20.8 11.2h-8.8c-.33 0-.6.27-.6.6v1.6c0 .33.27.6.6.6h8.8c.33 0 .6-.27.6-.6v-1.6c0-.33-.27-.6-.6-.6z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            LeetCode <span className="text-[#ffa116]">Friends Tracker</span>
          </h2>
          <p className="text-xs text-[#9e9e9e]">
            Connect your LeetCode username to enter your competitive dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Username Connect Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Your LeetCode Public Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. raj_coder or lokeshraj3521"
                className="w-full bg-[#1a1a1a] border border-[#3e3e3e] focus:border-[#ffa116] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Raj Kumar"
              className="w-full bg-[#1a1a1a] border border-[#3e3e3e] focus:border-[#ffa116] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-[#ffa116] hover:bg-[#ff8c00] disabled:opacity-50 text-black font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-[#ffa116]/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Connecting & Syncing LeetCode...</span>
            ) : (
              <>
                <span>Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Users Quick Select */}
        {users.length > 0 && (
          <div className="pt-4 border-t border-[#3e3e3e] space-y-2">
            <div className="text-[11px] text-[#9e9e9e] font-semibold text-center uppercase tracking-wider">
              Or quick-select existing profile
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#323232] border border-[#3e3e3e] hover:border-[#ffa116] rounded-lg text-xs font-semibold text-gray-200 transition-all flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-[#ffa116]" />
                  <span>{u.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
