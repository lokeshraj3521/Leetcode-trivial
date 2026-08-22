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
    return <div className="p-8 text-center text-[#9e9e9e]">Please select or connect a LeetCode user profile.</div>;
  }

  if (loading || !profile) {
    return <div className="p-12 text-center text-[#9e9e9e]">Loading LeetCode profile & statistics...</div>;
  }

  const stats = profile.stats || {};
  const easyCount = stats.easy_count || 0;
  const medCount = stats.medium_count || 0;
  const hardCount = stats.hard_count || 0;
  const totalSolved = easyCount + medCount + hardCount;

  return (
    <div className="space-y-6">
      {/* Bio Header Card */}
      <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ffa116]/20 border border-[#ffa116]/40 flex items-center justify-center text-[#ffa116] text-2xl font-black shadow-lg shadow-[#ffa116]/10">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              {profile.display_name}
              <span className="text-xs bg-[#ffa116]/20 text-[#ffa116] border border-[#ffa116]/40 px-3 py-1 rounded-full font-bold">
                @{profile.leetcode_username}
              </span>
            </h2>
            <p className="text-xs text-[#9e9e9e] mt-1 flex items-center gap-3">
              <span>Member since: {new Date(profile.created_at).toLocaleDateString()}</span>
              {profile.last_synced_at && (
                <span className="flex items-center gap-1 text-[#9e9e9e]">
                  <Clock className="w-3.5 h-3.5" /> Synced: {new Date(profile.last_synced_at).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Total Points Badge */}
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#3e3e3e] flex items-center gap-4">
          <div className="p-3 bg-[#ffa116]/10 rounded-xl text-[#ffa116] border border-[#ffa116]/30">
            <Zap className="w-6 h-6 fill-[#ffa116]" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.total_points || 0}</div>
            <div className="text-xs text-[#ffa116] font-bold">Total Earned Points</div>
          </div>
        </div>
      </div>

      {/* LeetCode Solved Ring & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Solved Donut Summary Card */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] flex items-center justify-around shadow-lg">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#3e3e3e]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#ffa116]"
                strokeDasharray={`${Math.min(100, totalSolved * 5)}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-2xl font-black text-white">{totalSolved}</div>
              <div className="text-[10px] uppercase font-bold text-[#9e9e9e]">Solved</div>
            </div>
          </div>

          <div className="space-y-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00b8a3]"></span>
              <span className="text-[#9e9e9e]">Easy:</span>
              <span className="text-white font-extrabold">{easyCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffc01e]"></span>
              <span className="text-[#9e9e9e]">Medium:</span>
              <span className="text-white font-extrabold">{medCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff375f]"></span>
              <span className="text-[#9e9e9e]">Hard:</span>
              <span className="text-white font-extrabold">{hardCount}</span>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-400 border border-orange-500/30">
              <Flame className="w-8 h-8 fill-orange-400 text-orange-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{stats.current_streak || 0} Days</div>
              <div className="text-xs text-orange-400 font-bold mt-1">Current Active Streak</div>
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#ffa116]/10 rounded-2xl text-[#ffa116] border border-[#ffa116]/30">
              <Award className="w-8 h-8 text-[#ffa116]" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{stats.longest_streak || 0} Days</div>
              <div className="text-xs text-[#9e9e9e] font-bold mt-1">Longest Recorded Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* 365-day Heatmap */}
      <Heatmap userId={userId} />

      {/* Topic Breakdown & Recent AC Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic Tag Breakdown */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#ffa116]" />
            Topic Tag Breakdown
          </h3>
          {Object.keys(profile.topic_breakdown).length === 0 ? (
            <p className="text-xs text-[#9e9e9e] italic">No topic tags recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {Object.entries(profile.topic_breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <div key={tag} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-300">{tag}</span>
                      <span className="text-[#ffa116]">{count} solved</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] h-2 rounded-full overflow-hidden border border-[#3e3e3e]">
                      <div
                        className="bg-[#ffa116] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (count / (totalSolved || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Submissions Feed */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00b8a3]" />
            Recent Accepted Submissions
          </h3>
          {submissions.length === 0 ? (
            <p className="text-xs text-[#9e9e9e] italic">No recent submissions found.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {submissions.map((sub) => {
                const diffColor =
                  sub.difficulty === 'Easy'
                    ? 'text-[#00b8a3]'
                    : sub.difficulty === 'Medium'
                    ? 'text-[#ffc01e]'
                    : 'text-[#ff375f]';
                return (
                  <div key={sub.id} className="p-3.5 bg-[#1a1a1a] border border-[#3e3e3e] hover:border-[#ffa116]/50 rounded-xl flex items-center justify-between transition-colors">
                    <div>
                      <div className="font-bold text-xs text-white">{sub.problem_title}</div>
                      <div className="text-[11px] text-[#9e9e9e] flex items-center gap-2 mt-1 font-semibold">
                        <span className={diffColor}>{sub.difficulty}</span>
                        <span>•</span>
                        <span>{sub.language}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-[#ffa116]">+{sub.points_awarded} pts</div>
                      <div className="text-[10px] text-[#9e9e9e] mt-0.5">{new Date(sub.submitted_at).toLocaleDateString()}</div>
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
