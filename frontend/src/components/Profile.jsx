import React, { useState, useEffect } from 'react';
import { User as UserIcon, Zap, Flame, Award, Tag, CheckCircle2, Clock } from 'lucide-react';
import Heatmap from './Heatmap';
import { apiUsers, apiSubmissions } from '../services/api';

export default function Profile({ userId }) {
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [profData, subsData] = await Promise.all([
        apiUsers.getProfile(userId),
        apiSubmissions.list({ user_id: userId, limit: 15 }),
      ]);
      setProfile(profData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <div className="p-8 text-center text-gray-400">Please select a user to view their profile.</div>;
  }

  if (loading || !profile) {
    return <div className="p-12 text-center text-gray-400">Loading user profile & statistics...</div>;
  }

  const stats = profile.stats || {};
  const totalSolved = (stats.easy_count || 0) + (stats.medium_count || 0) + (stats.hard_count || 0);

  return (
    <div className="space-y-6">
      {/* User Bio Header */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-amber-500/20">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              {profile.display_name}
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-normal">
                @{profile.leetcode_username}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
              <span>Joined: {new Date(profile.created_at).toLocaleDateString()}</span>
              {profile.last_synced_at && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" /> Synced: {new Date(profile.last_synced_at).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Total Points Badge */}
        <div className="bg-[#0B0F19] p-4 rounded-xl border border-[#1F2937] flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
            <Zap className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.total_points || 0}</div>
            <div className="text-xs text-amber-400 font-semibold">Total Earned Points</div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937]">
          <div className="text-xs text-gray-400 font-medium mb-1">Total Solved</div>
          <div className="text-2xl font-extrabold text-white">{totalSolved}</div>
          <div className="text-[11px] text-gray-500 mt-1">Unique AC problems</div>
        </div>

        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937]">
          <div className="text-xs text-[#00B8A3] font-semibold mb-1">Easy Solved</div>
          <div className="text-2xl font-extrabold text-[#00B8A3]">{stats.easy_count || 0}</div>
          <div className="text-[11px] text-gray-500 mt-1">+1 pt each</div>
        </div>

        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937]">
          <div className="text-xs text-[#FFC01E] font-semibold mb-1">Medium Solved</div>
          <div className="text-2xl font-extrabold text-[#FFC01E]">{stats.medium_count || 0}</div>
          <div className="text-[11px] text-gray-500 mt-1">+3 pts each</div>
        </div>

        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937]">
          <div className="text-xs text-[#FF375F] font-semibold mb-1">Hard Solved</div>
          <div className="text-2xl font-extrabold text-[#FF375F]">{stats.hard_count || 0}</div>
          <div className="text-[11px] text-gray-500 mt-1">+5 pts each</div>
        </div>
      </div>

      {/* Streak Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#111827] to-orange-950/20 p-5 rounded-2xl border border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
              <Flame className="w-6 h-6 fill-orange-400 text-orange-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.current_streak || 0} Days</div>
              <div className="text-xs text-orange-400 font-medium">Current Solve Streak</div>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.longest_streak || 0} Days</div>
              <div className="text-xs text-gray-400 font-medium">Longest Recorded Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* 365-day Heatmap */}
      <Heatmap userId={userId} />

      {/* Topic Breakdown & Recent Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic Tag Breakdown */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            Topic Tag Breakdown
          </h3>
          {Object.keys(profile.topic_breakdown).length === 0 ? (
            <p className="text-xs text-gray-500 italic">No topic tags recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {Object.entries(profile.topic_breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <div key={tag} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">{tag}</span>
                      <span className="text-amber-400">{count} solved</span>
                    </div>
                    <div className="w-full bg-[#0B0F19] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (count / (totalSolved || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Submissions Feed */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Recent AC Submissions
          </h3>
          {submissions.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No recent submissions found.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {submissions.map((sub) => {
                const diffColor =
                  sub.difficulty === 'Easy'
                    ? 'text-[#00B8A3]'
                    : sub.difficulty === 'Medium'
                    ? 'text-[#FFC01E]'
                    : 'text-[#FF375F]';
                return (
                  <div key={sub.id} className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-white">{sub.problem_title}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className={`font-semibold ${diffColor}`}>{sub.difficulty}</span>
                        <span>•</span>
                        <span>{sub.language}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-amber-400">+{sub.points_awarded} pts</div>
                      <div className="text-[10px] text-gray-500">{new Date(sub.submitted_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
