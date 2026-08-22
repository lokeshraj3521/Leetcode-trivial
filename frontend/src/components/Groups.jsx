import React, { useState } from 'react';
import { Users, Plus, Key, Copy, Check, ShieldCheck } from 'lucide-react';
import { apiGroups } from '../services/api';

export default function Groups({ groups, currentUserId, onRefreshGroups }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentUserId) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiGroups.create({
        name: newGroupName.trim(),
        created_by: currentUserId,
      });
      setNewGroupName('');
      setSuccessMsg(`Group "${res.name}" created! Invite code: ${res.invite_code}`);
      onRefreshGroups();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim() || !currentUserId) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiGroups.join({
        invite_code: inviteCodeInput.trim(),
        user_id: currentUserId,
      });
      setInviteCodeInput('');
      setSuccessMsg(`Successfully joined "${res.name}"!`);
      onRefreshGroups();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to join group');
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] shadow-lg">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#ffa116]" />
          Friend Circles & Contest Rooms
        </h2>
        <p className="text-xs text-[#9e9e9e] mt-1">
          Create or join competitive friend circles using unique invite codes.
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Group Form */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ffa116]" />
            Create New Friend Group
          </h3>
          <form onSubmit={handleCreateGroup} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Group Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Samsung LeetCode Squad"
                className="w-full bg-[#1a1a1a] border border-[#3e3e3e] focus:border-[#ffa116] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!currentUserId}
              className="w-full bg-[#ffa116] hover:bg-[#ff8c00] disabled:opacity-50 text-black font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-[#ffa116]/20"
            >
              Create Room
            </button>
          </form>
        </div>

        {/* Join Group Form */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-[#ffa116]" />
            Join Room via Invite Code
          </h3>
          <form onSubmit={handleJoinGroup} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Invite Code</label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. CODE2026"
                className="w-full bg-[#1a1a1a] border border-[#3e3e3e] focus:border-[#ffa116] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none uppercase font-mono tracking-widest"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!currentUserId}
              className="w-full bg-[#1a1a1a] hover:bg-[#323232] border border-[#3e3e3e] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>

      {/* Active Groups List */}
      <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white">Active Friend Rooms</h3>
        {groups.length === 0 ? (
          <p className="text-xs text-[#9e9e9e] italic">No groups found. Create or join one to start competing!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div key={group.id} className="p-4 bg-[#1a1a1a] border border-[#3e3e3e] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">{group.name}</div>
                  <div className="text-xs text-[#9e9e9e] mt-0.5">{group.member_count} member(s)</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-[#ffa116]/10 text-[#ffa116] border border-[#ffa116]/30 px-3 py-1 rounded-lg">
                    {group.invite_code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(group.invite_code)}
                    className="p-1.5 text-gray-400 hover:text-white bg-[#282828] border border-[#3e3e3e] rounded-lg transition-colors"
                    title="Copy Invite Code"
                  >
                    {copiedCode === group.invite_code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
