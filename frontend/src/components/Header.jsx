import React from 'react';
import { Trophy, Users, Sparkles, Bell, RefreshCw, Flame, LogOut, User } from 'lucide-react';

export default function Header({
  currentUser,
  groups,
  selectedGroupId,
  setSelectedGroupId,
  activeTab,
  setActiveTab,
  onSync,
  isSyncing,
  notificationCount,
  onOpenNotifications,
  onSwitchAccount,
}) {
  return (
    <header className="bg-[#282828] border-b border-[#3e3e3e] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* LeetCode Authentic Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-[#1a1a1a] border border-[#3e3e3e] rounded-xl flex items-center justify-center shadow-inner">
            <svg className="w-5 h-5 fill-[#ffa116]" viewBox="0 0 24 24">
              <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.178 1.823.645l2.697 2.607c.25.25.65.25.9 0l1.2-1.2c.25-.25.25-.65 0-.9l-2.697-2.607c-1.04-1.04-2.54-1.545-4.123-1.545s-3.08.505-4.12 1.545l-4.32 4.38c-1.04 1.04-1.56 2.44-1.56 4.02s.52 2.98 1.56 4.02l4.33 4.36c1.04 1.04 2.54 1.55 4.12 1.55s3.08-.51 4.12-1.55l2.697-2.607c.25-.25.25-.65 0-.9l-1.2-1.2c-.25-.25-.65-.25-.9 0z"/>
              <path d="M20.8 11.2h-8.8c-.33 0-.6.27-.6.6v1.6c0 .33.27.6.6.6h8.8c.33 0 .6-.27.6-.6v-1.6c0-.33-.27-.6-.6-.6z"/>
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-white tracking-tight">LeetCode</span>
            <span className="font-extrabold text-lg text-[#ffa116]">Tracker</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-[#1a1a1a] p-1 rounded-xl border border-[#3e3e3e]">
          {[
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'profile', label: 'Profile & Heatmap', icon: Flame },
            { id: 'groups', label: 'Groups', icon: Users },
            { id: 'ai', label: 'AI Insights', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#ffa116] text-black shadow-md shadow-[#ffa116]/20'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#282828]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Group Filter Selector */}
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(e.target.value || null)}
            className="bg-[#1a1a1a] text-gray-300 border border-[#3e3e3e] focus:border-[#ffa116] rounded-xl text-xs px-3 py-2 focus:outline-none"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Instant Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 bg-[#ffa116]/10 text-[#ffa116] hover:bg-[#ffa116]/20 border border-[#ffa116]/30 text-xs px-3 py-2 rounded-xl font-bold transition-all ${
              isSyncing ? 'animate-pulse opacity-75' : ''
            }`}
            title="Sync LeetCode Submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Activity Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-gray-400 hover:text-white bg-[#1a1a1a] border border-[#3e3e3e] rounded-xl transition-colors"
            title="Friend Solve Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Active Logged-in User Profile Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#3e3e3e]">
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#3e3e3e] px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[#ffa116]/20 border border-[#ffa116]/40 flex items-center justify-center text-[#ffa116] font-bold text-xs">
                  {currentUser.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-xs text-left">
                  <div className="font-bold text-white leading-tight">{currentUser.display_name}</div>
                  <div className="text-[10px] text-[#9e9e9e]">@{currentUser.leetcode_username}</div>
                </div>
              </div>

              <button
                onClick={onSwitchAccount}
                className="p-2 text-gray-400 hover:text-rose-400 bg-[#1a1a1a] border border-[#3e3e3e] rounded-xl transition-colors"
                title="Switch LeetCode Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
