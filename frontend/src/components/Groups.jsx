import React, { useState, useEffect } from 'react';
import { Users, Plus, Key, Copy, Check, MessageSquare, Send, User, Sparkles } from 'lucide-react';
import { apiGroups, apiMessages } from '../services/api';

export default function Groups({ currentUser, groups, onGroupCreated, onGroupJoined }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedChatGroup, setSelectedChatGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groups.length > 0 && !selectedChatGroup) {
      setSelectedChatGroup(groups[0]);
    }
  }, [groups]);

  useEffect(() => {
    if (selectedChatGroup) {
      loadGroupMessages(selectedChatGroup.id);
    }
  }, [selectedChatGroup]);

  const loadGroupMessages = async (groupId) => {
    setLoadingMessages(true);
    try {
      const msgs = await apiMessages.listGroupMessages(groupId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load group messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentUser) return;
    try {
      const newG = await apiGroups.create({
        name: newGroupName.trim(),
        created_by: currentUser.id,
      });
      setNewGroupName('');
      onGroupCreated(newG);
      setSelectedChatGroup(newG);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim() || !currentUser) return;
    try {
      const joinedG = await apiGroups.join({
        invite_code: inviteCode.trim().toUpperCase(),
        user_id: currentUser.id,
      });
      setInviteCode('');
      onGroupJoined(joinedG);
      setSelectedChatGroup(joinedG);
    } catch (err) {
      setError(err.message || 'Failed to join group. Please check invite code.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatGroup || !currentUser) return;

    const contentToSend = messageInput.trim();
    setMessageInput('');

    try {
      const sentMsg = await apiMessages.sendGroupMessage(selectedChatGroup.id, {
        sender_id: currentUser.id,
        content: contentToSend,
      });
      setMessages((prev) => [...prev, sentMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const copyInviteCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#ffa116]" />
            Friend Groups & In-App Chat
          </h2>
          <p className="text-xs text-[#d1d5db] font-semibold mt-1">
            Create or join private rooms, compare leaderboards, and send messages directly to your friends!
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Creation & Joining Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Group Form */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ffa116]" />
            Create Private Group
          </h3>
          <form onSubmit={handleCreateGroup} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Algo Champions"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#ffa116] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
            />
            <button
              type="submit"
              className="bg-[#ffa116] hover:bg-[#ffa116]/90 text-black font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md"
            >
              Create
            </button>
          </form>
        </div>

        {/* Join Group Form */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-[#00b8a3]" />
            Join with Invite Code
          </h3>
          <form onSubmit={handleJoinGroup} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter 8-character invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1 bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#00b8a3] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none uppercase font-mono font-bold"
            />
            <button
              type="submit"
              className="bg-[#00b8a3] hover:bg-[#00b8a3]/90 text-black font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Main Groups & Interactive In-App Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Your Groups List */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Your Joined Groups</span>
            <span className="text-xs bg-[#ffa116]/20 text-[#ffa116] border border-[#ffa116]/40 px-2 py-0.5 rounded-full font-bold">
              {groups.length}
            </span>
          </h3>

          {groups.length === 0 ? (
            <p className="text-xs text-[#d1d5db] italic">You haven't joined any groups yet. Create or join one above!</p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isSelected = selectedChatGroup?.id === group.id;
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedChatGroup(group)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#ffa116]/10 border-[#ffa116]'
                        : 'bg-[#1a1a1a] border-[#3e3e3e] hover:border-gray-500'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-white">{group.name}</div>
                      <div className="text-[11px] text-[#d1d5db] mt-1 flex items-center gap-2">
                        <span>Code: <code className="font-mono text-[#ffa116]">{group.invite_code}</code></span>
                        <span>•</span>
                        <span>{group.member_count || 1} member(s)</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteCode(group.invite_code, group.id);
                      }}
                      className="p-2 text-gray-400 hover:text-white bg-[#282828] border border-[#3e3e3e] rounded-lg transition-colors"
                      title="Copy Invite Code"
                    >
                      {copiedId === group.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: In-App Chat & Message Drawer */}
        <div className="lg:col-span-2 bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] flex flex-col h-[480px] shadow-lg">
          {/* Chat Header */}
          <div className="pb-4 border-b border-[#3e3e3e] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#ffa116]/15 text-[#ffa116] border border-[#ffa116]/30 rounded-xl">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {selectedChatGroup ? selectedChatGroup.name : 'Select a Group to Chat'}
                </h3>
                <p className="text-[11px] text-[#d1d5db] font-semibold">In-app friend messages & cheer channel</p>
              </div>
            </div>

            {selectedChatGroup && (
              <span className="text-xs bg-[#1a1a1a] text-[#ffa116] border border-[#3e3e3e] px-2.5 py-1 rounded-lg font-mono font-bold">
                Code: {selectedChatGroup.invite_code}
              </span>
            )}
          </div>

          {/* Messages Stream Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
            {!selectedChatGroup ? (
              <div className="h-full flex items-center justify-center text-xs text-[#d1d5db] italic">
                Select a group on the left to view messages.
              </div>
            ) : loadingMessages ? (
              <div className="h-full flex items-center justify-center text-xs text-[#d1d5db]">
                Loading group chat history...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#d1d5db] gap-2">
                <Sparkles className="w-6 h-6 text-[#ffa116]" />
                <span>No messages in this group yet. Send the first message to your friends!</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = currentUser && msg.sender_id === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-[#9ca3af] mb-1 font-semibold flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{msg.sender_name}</span>
                      <span>•</span>
                      <span>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                        isMe
                          ? 'bg-[#ffa116] text-black rounded-tr-none shadow-md font-bold'
                          : 'bg-[#1a1a1a] text-white border border-[#3e3e3e] rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input Form */}
          {selectedChatGroup && (
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-[#3e3e3e] flex gap-2 shrink-0">
              <input
                type="text"
                placeholder={`Message #${selectedChatGroup.name}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-[#1a1a1a] text-white border border-[#3e3e3e] focus:border-[#ffa116] rounded-xl px-4 py-2.5 text-xs focus:outline-none font-semibold"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-[#ffa116] hover:bg-[#ffa116]/90 disabled:opacity-50 text-black font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
