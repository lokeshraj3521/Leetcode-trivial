import React, { useState } from 'react';
import { Trophy, Users, Sparkles, Bell, RefreshCw, PlusCircle, Flame } from 'lucide-react';

export default function Header({
  users,
  groups,
  selectedUserId,
  setSelectedUserId,
  selectedGroupId,
  setSelectedGroupId,
  activeTab,
  setActiveTab,
  onSync,
  isSyncing,
  notificationCount,
  onOpenNotifications,
  onOpenNewUserModal,
}) {
  const currentUser = users.find((u) => u.id === selectedUserId);

  return (
    <header className="bg-[#111827] border-b border-[#1F2937] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-2">
              LeetCode <span className="text-amber-500">Friends Tracker</span>
            </h1>
            <p className="text-xs text-gray-400">Competitive Solves & AI Insights</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-[#0B0F19] p-1 rounded-xl border border-[#1F2937]">
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
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#111827]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Selector & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Group Filter */}
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(e.target.value || null)}
            className="bg-[#0B0F19] text-gray-300 border border-[#1F2937] rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.invite_code})
              </option>
            ))}
          </select>

          {/* User Selector */}
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-[#0B0F19] text-gray-200 font-medium border border-[#1F2937] rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="" disabled>
              Select Active User
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                👤 {u.display_name} (@{u.leetcode_username})
              </option>
            ))}
          </select>

          {/* Add User Button */}
          <button
            onClick={onOpenNewUserModal}
            className="p-2 text-gray-400 hover:text-white bg-[#0B0F19] border border-[#1F2937] rounded-lg hover:border-amber-500 transition-colors"
            title="Register New LeetCode User"
          >
            <PlusCircle className="w-4 h-4" />
          </button>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs px-3 py-2 rounded-lg font-medium transition-all ${
              isSyncing ? 'animate-pulse opacity-75' : ''
            }`}
            title="Sync LeetCode Submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Notifications Feed Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-gray-400 hover:text-white bg-[#0B0F19] border border-[#1F2937] rounded-lg transition-colors"
            title="Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
