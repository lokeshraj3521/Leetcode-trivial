import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { apiUsers } from '../services/api';

export default function NewUserModal({ isOpen, onClose, onUserCreated }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const newUser = await apiUsers.create({
        leetcode_username: username.trim(),
        display_name: displayName.trim(),
        email: email.trim() || null,
      });
      setUsername('');
      setDisplayName('');
      setEmail('');
      onUserCreated(newUser);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1F2937] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" /> Register LeetCode Friend
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              LeetCode Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. neetcode"
              className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Navin Kumar"
              className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. friend@example.com"
              className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            {submitting ? 'Fetching LeetCode Submissions...' : 'Register & Sync User'}
          </button>
        </form>
      </div>
    </div>
  );
}
