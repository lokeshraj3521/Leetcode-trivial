import React, { useState, useEffect } from 'react';
import { Calendar, Flame, CheckCircle } from 'lucide-react';
import { apiUsers } from '../services/api';

export default function Heatmap({ userId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    if (userId) loadHeatmap();
  }, [userId]);

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      const data = await apiUsers.getHeatmap(userId);
      setHeatmapData(data);
    } catch (err) {
      console.error('Failed to load heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate 52 weeks (364 days) grid
  const daysMap = {};
  heatmapData.forEach((d) => {
    daysMap[d.date] = d;
  });

  const getIntensityClass = (entry) => {
    if (!entry || entry.count === 0) return 'bg-[#1F2937]/50 border-transparent';
    if (entry.count === 1) return 'bg-amber-600/40 border-amber-500/50 text-amber-200';
    if (entry.count <= 3) return 'bg-amber-500/70 border-amber-400 text-amber-100';
    return 'bg-amber-400 border-amber-300 text-black font-bold';
  };

  return (
    <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            365-Day Solve Contribution Heatmap
          </h3>
          <p className="text-xs text-gray-400">GitHub-style activity calendar for recent solves.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded bg-[#1F2937]/50"></div>
          <div className="w-3 h-3 rounded bg-amber-600/40"></div>
          <div className="w-3 h-3 rounded bg-amber-500/70"></div>
          <div className="w-3 h-3 rounded bg-amber-400"></div>
          <span>More</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Loading contribution activity grid...</div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] flex gap-1.5 flex-wrap">
            {heatmapData.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4">No recent activity detected. Complete a LeetCode problem to start your streak!</p>
            ) : (
              heatmapData.map((d) => (
                <div
                  key={d.date}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-4 h-4 rounded-[3px] border transition-all transform hover:scale-125 cursor-pointer ${getIntensityClass(
                    d
                  )}`}
                />
              ))
            )}
          </div>

          {/* Hover Tooltip Details */}
          {hoveredDay && (
            <div className="mt-3 p-3 bg-[#0B0F19] border border-[#1F2937] rounded-xl text-xs flex items-center justify-between text-gray-300 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-white">{hoveredDay.date}</span>: {hoveredDay.count} problem(s) solved (+{hoveredDay.points} pts)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00B8A3]">Easy: {hoveredDay.easy}</span>
                <span className="text-[#FFC01E]">Medium: {hoveredDay.medium}</span>
                <span className="text-[#FF375F]">Hard: {hoveredDay.hard}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
