import React, { useState, useEffect } from 'react';
import { User as UserIcon, Zap, Flame, Award, Tag, CheckCircle2, Clock, Code, Cpu } from 'lucide-react';
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

  const totalEasyPool = 960;
  const totalMedPool = 2103;
  const totalHardPool = 966;
  const totalQuestionPool = 4029;

  // Donut Arc Calculations (circumference = 100)
  const safeTotal = totalSolved > 0 ? totalSolved : 1;
  const easyPct = (easyCount / safeTotal) * 100;
  const medPct = (medCount / safeTotal) * 100;
  const hardPct = (hardCount / safeTotal) * 100;

  const easyDash = `${easyPct} ${100 - easyPct}`;
  const medDash = `${medPct} ${100 - medPct}`;
  const hardDash = `${hardPct} ${100 - hardPct}`;

  const medOffset = -easyPct;
  const hardOffset = -(easyPct + medPct);

  const skills = profile.skills_breakdown || {};
  const languages = profile.languages_breakdown || [];

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
              <span className="text-xs bg-[#ffa116]/20 text-[#ffa116] border border-[#ffa116]/40 px-3 py-1 rounded-full font-bold font-mono">
                @{profile.leetcode_username}
              </span>
            </h2>
            <p className="text-xs text-[#d1d5db] mt-1 flex items-center gap-3 font-semibold">
              <span>Member since: {new Date(profile.created_at).toLocaleDateString()}</span>
              {profile.last_synced_at && (
                <span className="flex items-center gap-1 text-[#e5e7eb]">
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
            <div className="text-xs text-[#ffa116] font-extrabold">Total Earned Points</div>
          </div>
        </div>
      </div>

      {/* LeetCode Multi-Color Solved Donut & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Authentic Multi-Segment Solved Donut Summary Card */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] flex items-center justify-around shadow-lg">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background Track */}
              <path
                className="text-[#3e3e3e]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />

              {/* Easy Segment (Green) */}
              {easyCount > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#00b8a3"
                  strokeWidth="3.5"
                  strokeDasharray={easyDash}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              )}

              {/* Medium Segment (Yellow) */}
              {medCount > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#ffc01e"
                  strokeWidth="3.5"
                  strokeDasharray={medDash}
                  strokeDashoffset={medOffset}
                  strokeLinecap="round"
                />
              )}

              {/* Hard Segment (Red) */}
              {hardCount > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#ff375f"
                  strokeWidth="3.5"
                  strokeDasharray={hardDash}
                  strokeDashoffset={hardOffset}
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Center Solved Numbers */}
            <div className="absolute text-center">
              <div className="text-2xl font-black text-white">{totalSolved}<span className="text-xs font-semibold text-[#9ca3af]">/{totalQuestionPool}</span></div>
              <div className="text-[10px] uppercase font-black text-[#00b8a3] flex items-center justify-center gap-1">
                <span>✓ Solved</span>
              </div>
            </div>
          </div>

          {/* Right Stats Breakdown Cards (Easy/960, Med/2103, Hard/966) */}
          <div className="space-y-2.5 text-xs font-extrabold">
            <div className="p-2 bg-[#1a1a1a] rounded-xl border border-[#3e3e3e] flex items-center justify-between gap-3 min-w-[110px]">
              <div className="flex items-center gap-1.5 text-[#00b8a3]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00b8a3]"></span>
                <span>Easy</span>
              </div>
              <span className="text-white font-black">{easyCount}<span className="text-[#9ca3af] font-normal text-[11px]">/{totalEasyPool}</span></span>
            </div>

            <div className="p-2 bg-[#1a1a1a] rounded-xl border border-[#3e3e3e] flex items-center justify-between gap-3 min-w-[110px]">
              <div className="flex items-center gap-1.5 text-[#ffc01e]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffc01e]"></span>
                <span>Med.</span>
              </div>
              <span className="text-white font-black">{medCount}<span className="text-[#9ca3af] font-normal text-[11px]">/{totalMedPool}</span></span>
            </div>

            <div className="p-2 bg-[#1a1a1a] rounded-xl border border-[#3e3e3e] flex items-center justify-between gap-3 min-w-[110px]">
              <div className="flex items-center gap-1.5 text-[#ff375f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff375f]"></span>
                <span>Hard</span>
              </div>
              <span className="text-white font-black">{hardCount}<span className="text-[#9ca3af] font-normal text-[11px]">/{totalHardPool}</span></span>
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
              <div className="text-xs text-orange-400 font-extrabold mt-1">Current Active Streak</div>
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
              <div className="text-xs text-[#e5e7eb] font-extrabold mt-1">Longest Recorded Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* 365-day Heatmap */}
      <Heatmap userId={userId} />

      {/* Authentic LeetCode Languages & Skills Section (Fundamental -> Intermediate -> Advanced) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Languages Card */}
        <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-[#ffa116]" />
            Languages
          </h3>
          {languages.length === 0 ? (
            <p className="text-xs text-[#d1d5db] italic">No language statistics available.</p>
          ) : (
            <div className="space-y-3">
              {languages.map((lang, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#3e3e3e] rounded-xl">
                  <span className="text-xs font-bold text-gray-200 bg-[#282828] border border-[#3e3e3e] px-2.5 py-1 rounded-lg">
                    {lang.languageName}
                  </span>
                  <span className="text-xs font-black text-white">
                    {lang.problemsSolved} <span className="text-[11px] font-normal text-[#d1d5db]">problems solved</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Matrix Card (Fundamental -> Intermediate -> Advanced) */}
        <div className="md:col-span-2 bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-5 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#ffa116]" />
            LeetCode Official Skills Matrix
          </h3>

          <div className="space-y-5">
            {/* 1. Fundamental Category (Top) */}
            {skills.fundamental && skills.fundamental.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Fundamental
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.fundamental.map((tag, idx) => (
                    <span key={idx} className="bg-[#1a1a1a] border border-[#3e3e3e] hover:border-[#ffa116]/50 text-xs px-3 py-1.5 rounded-xl font-bold text-gray-200 flex items-center gap-1.5 transition-colors">
                      <span>{tag.tagName}</span>
                      <span className="text-[#ffa116] font-mono font-extrabold">x{tag.problemsSolved}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Intermediate Category (Middle) */}
            {skills.intermediate && skills.intermediate.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Intermediate
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.intermediate.map((tag, idx) => (
                    <span key={idx} className="bg-[#1a1a1a] border border-[#3e3e3e] hover:border-[#ffa116]/50 text-xs px-3 py-1.5 rounded-xl font-bold text-gray-200 flex items-center gap-1.5 transition-colors">
                      <span>{tag.tagName}</span>
                      <span className="text-[#ffa116] font-mono font-extrabold">x{tag.problemsSolved}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Advanced Category (Bottom) */}
            {skills.advanced && skills.advanced.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Advanced
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.advanced.map((tag, idx) => (
                    <span key={idx} className="bg-[#1a1a1a] border border-[#3e3e3e] hover:border-[#ffa116]/50 text-xs px-3 py-1.5 rounded-xl font-bold text-gray-200 flex items-center gap-1.5 transition-colors">
                      <span>{tag.tagName}</span>
                      <span className="text-[#ffa116] font-mono font-extrabold">x{tag.problemsSolved}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Accepted Submissions List */}
      <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00b8a3]" />
          Recent Accepted Submissions
        </h3>
        {submissions.length === 0 ? (
          <p className="text-xs text-[#d1d5db] italic">No recent submissions found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <div className="text-[11px] text-[#e5e7eb] flex items-center gap-2 mt-1 font-semibold">
                      <span className={diffColor}>{sub.difficulty}</span>
                      <span>•</span>
                      <span>{sub.language}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-[#ffa116]">+{sub.points_awarded} pts</div>
                    <div className="text-[10px] text-[#d1d5db] mt-0.5">{new Date(sub.submitted_at).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
