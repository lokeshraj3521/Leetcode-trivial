import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, Award } from 'lucide-react';
import { apiLeaderboard } from '../services/api';

export default function Leaderboard({ selectedGroupId, currentUserId }) {
  const [timeframe, setTimeframe] = useState('all_time');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe, selectedGroupId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await apiLeaderboard.get(timeframe, selectedGroupId);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="font-extrabold text-[#9e9e9e] text-xs">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#282828] p-5 rounded-2xl border border-[#3e3e3e] shadow-lg">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#ffa116]" />
            Competitive Solves Leaderboard
          </h2>
          <p className="text-xs text-[#9e9e9e] mt-1">
            Points Weighting: Easy = 1 pt | Medium = 3 pts | Hard = 5 pts (First AC per problem)
          </p>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center bg-[#1a1a1a] p-1 rounded-xl border border-[#3e3e3e] self-start sm:self-auto">
          {[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'all_time', label: 'All-Time' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeframe === tf.id
                  ? 'bg-[#ffa116] text-black shadow-md shadow-[#ffa116]/20'
                  : 'text-[#9e9e9e] hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-[#282828] rounded-2xl border border-[#3e3e3e] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-[#9e9e9e] flex flex-col items-center gap-3">
            <Zap className="w-8 h-8 animate-spin text-[#ffa116]" />
            <p className="text-xs font-semibold">Syncing real-time scores & ranks...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-[#9e9e9e]">
            <Award className="w-10 h-10 mx-auto text-[#555] mb-2" />
            <p className="font-bold text-gray-300">No submissions recorded yet for this timeframe.</p>
            <p className="text-xs text-[#9e9e9e] mt-1">Complete a LeetCode problem or select another group.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3e3e3e] bg-[#1a1a1a]/60 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">LeetCode Friend</th>
                  <th className="py-3.5 px-4 text-center">Total Points</th>
                  <th className="py-3.5 px-4 text-center">Difficulty Solved</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3e3e3e]">
                {leaderboard.map((entry) => {
                  const isCurrent = entry.user_id === currentUserId;
                  return (
                    <tr
                      key={entry.user_id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-[#ffa116]/10 border-l-4 border-l-[#ffa116]'
                          : 'hover:bg-[#323232]'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center align-middle">{getRankBadge(entry.rank)}</td>

                      {/* User Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#ffa116]/20 border border-[#ffa116]/40 flex items-center justify-center text-[#ffa116] font-extrabold text-sm">
                            {entry.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              {entry.display_name}
                              {isCurrent && (
                                <span className="bg-[#ffa116]/20 text-[#ffa116] border border-[#ffa116]/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#9e9e9e]">@{entry.leetcode_username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-black text-[#ffa116] bg-[#ffa116]/10 px-3 py-1 rounded-xl border border-[#ffa116]/30">
                          <Zap className="w-4 h-4 fill-[#ffa116] text-[#ffa116]" />
                          {entry.total_points} <span className="text-xs font-normal text-[#ffa116]/80">pts</span>
                        </span>
                      </td>

                      {/* Difficulty Badges */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-bold">
                          <span className="bg-[#00b8a3]/10 text-[#00b8a3] border border-[#00b8a3]/30 px-2.5 py-1 rounded-lg">
                            Easy: {entry.easy_count}
                          </span>
                          <span className="bg-[#ffc01e]/10 text-[#ffc01e] border border-[#ffc01e]/30 px-2.5 py-1 rounded-lg">
                            Med: {entry.medium_count}
                          </span>
                          <span className="bg-[#ff375f]/10 text-[#ff375f] border border-[#ff375f]/30 px-2.5 py-1 rounded-lg">
                            Hard: {entry.hard_count}
                          </span>
                        </div>
                      </td>

                      {/* Streak */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                          <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
                          {entry.current_streak} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
