import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, Award, Calendar } from 'lucide-react';
import { apiLeaderboard } from '../services/api';

export default function Leaderboard({ selectedGroupId, selectedUserId }) {
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
    return <span className="font-bold text-gray-400 text-sm">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-5 rounded-2xl border border-[#1F2937]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Competitive Solves Leaderboard
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Points system: Easy = 1 pt | Medium = 3 pts | Hard = 5 pts (First AC per problem)
          </p>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center bg-[#0B0F19] p-1 rounded-xl border border-[#1F2937] self-start sm:self-auto">
          {[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'all_time', label: 'All-Time' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeframe === tf.id
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <Zap className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Calculating real-time scores & ranks...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Award className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="font-semibold text-gray-300">No submissions recorded yet for this timeframe.</p>
            <p className="text-xs text-gray-500 mt-1">Run a sync or select another timeframe/group.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#0B0F19]/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">LeetCode Friend</th>
                  <th className="py-3.5 px-4 text-center">Total Points</th>
                  <th className="py-3.5 px-4 text-center">Difficulty Solved</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {leaderboard.map((entry) => {
                  const isSelected = entry.user_id === selectedUserId;
                  return (
                    <tr
                      key={entry.user_id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-amber-500/10 border-l-4 border-l-amber-500'
                          : 'hover:bg-[#1A2234]'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center align-middle">{getRankBadge(entry.rank)}</td>

                      {/* User Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                            {entry.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              {entry.display_name}
                              {isSelected && (
                                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">@{entry.leetcode_username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-base font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                          <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {entry.total_points} <span className="text-xs font-normal text-amber-300">pts</span>
                        </span>
                      </td>

                      {/* Difficulty Badges */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold">
                          <span className="bg-[#00B8A3]/10 text-[#00B8A3] border border-[#00B8A3]/30 px-2 py-1 rounded-md">
                            Easy: {entry.easy_count}
                          </span>
                          <span className="bg-[#FFC01E]/10 text-[#FFC01E] border border-[#FFC01E]/30 px-2 py-1 rounded-md">
                            Med: {entry.medium_count}
                          </span>
                          <span className="bg-[#FF375F]/10 text-[#FF375F] border border-[#FF375F]/30 px-2 py-1 rounded-md">
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
