import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ExternalLink, Award, Flame, CheckCircle2 } from 'lucide-react';
import { apiAI } from '../services/api';

export default function AIInsights({ userId }) {
  const [insightType, setInsightType] = useState('weak_topics');
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId) loadInsight();
  }, [userId, insightType]);

  const loadInsight = async () => {
    setLoading(true);
    try {
      const res = await apiAI.getInsights(userId, insightType);
      setInsight(res.content);
    } catch (err) {
      console.error('Failed to load AI insight:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await apiAI.refreshInsights(userId, insightType);
      setInsight(res.content);
    } catch (err) {
      console.error('Failed to refresh AI insight:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!userId) {
    return <div className="p-8 text-center text-gray-400">Select a user to view AI Insights.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Sub-tabs */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Insights & Recommendations Engine
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Data-driven topic gap detection, weekly AI recaps, and problem suggestions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tabs */}
          <div className="flex items-center bg-[#0B0F19] p-1 rounded-xl border border-[#1F2937]">
            {[
              { id: 'weak_topics', label: 'Weak Topics' },
              { id: 'weekly_recap', label: 'Weekly Roast' },
              { id: 'next_problem', label: 'Suggested Problems' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInsightType(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  insightType === tab.id
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 text-gray-400 hover:text-amber-400 bg-[#0B0F19] border border-[#1F2937] hover:border-amber-500/50 rounded-xl transition-all"
            title="Force Regenerate AI Insights"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
          <Sparkles className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Analyzing submission history & topic tag matrix...</p>
        </div>
      ) : !insight ? (
        <div className="p-8 text-center text-gray-400">Failed to load insight. Try refreshing.</div>
      ) : (
        <div className="space-y-6">
          {/* WEAK TOPICS VIEW */}
          {insightType === 'weak_topics' && (
            <div className="space-y-6">
              <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937]">
                <h3 className="text-lg font-bold text-white mb-2">{insight.title}</h3>
                <p className="text-xs text-gray-300 bg-[#0B0F19] p-4 rounded-xl border border-[#1F2937] leading-relaxed">
                  💡 <span className="font-semibold text-amber-400">AI Assessment:</span> {insight.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weak Topics */}
                <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
                  <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Focus Needed (Weak / Untouched Topics)
                  </h4>
                  <div className="space-y-3">
                    {insight.weak_topics?.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#0B0F19] border border-rose-500/20 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-white">{item.topic}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">Status: {item.status} ({item.solved_count} solved)</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md">
                          {item.priority} Priority
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strong Topics */}
                <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Strong Topics (Consistent ACs)
                  </h4>
                  <div className="space-y-3">
                    {insight.strong_topics?.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#0B0F19] border border-emerald-500/20 rounded-xl flex items-center justify-between">
                        <div className="font-bold text-xs text-white">{item.topic}</div>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                          {item.solved_count} solved
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WEEKLY RECAP VIEW */}
          {insightType === 'weekly_recap' && (
            <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                <span className="text-2xl font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-xl">
                  Grade: {insight.grade}
                </span>
              </div>

              <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl">
                <p className="text-sm text-gray-200 italic font-medium leading-relaxed">
                  "{insight.roast_summary}"
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-[#1F2937]">
                  <div className="text-xs text-gray-400">Weekly Solved</div>
                  <div className="text-xl font-bold text-white mt-1">{insight.weekly_solved_count}</div>
                </div>

                <div className="bg-[#0B0F19] p-4 rounded-xl border border-[#1F2937]">
                  <div className="text-xs text-amber-400">Weekly Points</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">+{insight.weekly_points}</div>
                </div>

                <div className="bg-[#0B0F19] p-4 rounded-xl border border-[#1F2937]">
                  <div className="text-xs text-[#00B8A3]">Easy / Med / Hard</div>
                  <div className="text-sm font-bold text-gray-300 mt-1">
                    {insight.breakdown?.easy || 0} / {insight.breakdown?.medium || 0} / {insight.breakdown?.hard || 0}
                  </div>
                </div>

                <div className="bg-[#0B0F19] p-4 rounded-xl border border-[#1F2937]">
                  <div className="text-xs text-gray-400">Target</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1.5">5 solves / week</div>
                </div>
              </div>
            </div>
          )}

          {/* NEXT PROBLEM SUGGESTIONS VIEW */}
          {insightType === 'next_problem' && (
            <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insight.recommendations?.map((rec, idx) => (
                  <div key={idx} className="p-5 bg-[#0B0F19] border border-[#1F2937] hover:border-amber-500/50 rounded-2xl flex flex-col justify-between space-y-4 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md">
                          {rec.difficulty}
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">{rec.topic}</span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-3">{rec.title}</h4>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">{rec.reason}</p>
                    </div>

                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold py-2.5 rounded-xl border border-amber-500/30 transition-all"
                    >
                      Solve on LeetCode <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
