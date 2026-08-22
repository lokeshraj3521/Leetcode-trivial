import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
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

  // Build 365-day full calendar grid (52 weeks x 7 days)
  const daysMap = {};
  heatmapData.forEach((d) => {
    daysMap[d.date] = d;
  });

  const generateFullYearGrid = () => {
    const grid = [];
    const today = new Date();
    
    // Generate past 364 days (52 weeks * 7 days)
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = daysMap[dateStr] || { date: dateStr, count: 0, points: 0, easy: 0, medium: 0, hard: 0 };
      grid.push(entry);
    }
    return grid;
  };

  const gridDays = generateFullYearGrid();

  // Emerald Green GitHub / LeetCode Color Intensity
  const getEmeraldClass = (entry) => {
    if (!entry || entry.count === 0) return 'bg-[#161b22] border-[#21262d]';
    if (entry.count === 1) return 'bg-[#0e4429] border-[#006d32] text-white';
    if (entry.count <= 3) return 'bg-[#006d32] border-[#26a641] text-white';
    if (entry.count <= 5) return 'bg-[#26a641] border-[#39d353] text-black font-bold';
    return 'bg-[#39d353] border-[#56f076] text-black font-black';
  };

  return (
    <div className="bg-[#282828] p-6 rounded-2xl border border-[#3e3e3e] space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#39d353]" />
            365-Day Submission Contribution Grid
          </h3>
          <p className="text-xs text-[#d1d5db]">Live LeetCode & GitHub-style activity calendar across 52 weeks.</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-[#e5e7eb] font-semibold">
          <span className="text-[#9ca3af]">Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-[#161b22] border border-[#21262d]" title="0 solves"></div>
          <div className="w-3 h-3 rounded-[2px] bg-[#0e4429]" title="1 solve"></div>
          <div className="w-3 h-3 rounded-[2px] bg-[#006d32]" title="2-3 solves"></div>
          <div className="w-3 h-3 rounded-[2px] bg-[#26a641]" title="4-5 solves"></div>
          <div className="w-3 h-3 rounded-[2px] bg-[#39d353]" title="6+ solves"></div>
          <span className="text-white font-bold">More</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#d1d5db] font-semibold">Loading live LeetCode 365-day grid...</div>
      ) : (
        <div className="overflow-x-auto pb-2">
          {/* 52-Week Column Matrix */}
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1">
            {gridDays.map((dayObj) => (
              <div
                key={dayObj.date}
                onMouseEnter={() => setHoveredDay(dayObj)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-3.5 h-3.5 rounded-[2.5px] border transition-all transform hover:scale-150 hover:z-20 cursor-pointer ${getEmeraldClass(
                  dayObj
                )}`}
              />
            ))}
          </div>

          {/* Hover Tooltip Details */}
          {hoveredDay && (
            <div className="mt-3 p-3 bg-[#1a1a1a] border border-[#3e3e3e] rounded-xl text-xs flex flex-wrap items-center justify-between text-white font-semibold shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#39d353]" />
                <span className="font-extrabold text-[#39d353]">{hoveredDay.date}</span>: {hoveredDay.count} problem(s) solved (+{hoveredDay.points} pts)
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#00b8a3] font-bold">Easy: {hoveredDay.easy}</span>
                <span className="text-[#ffc01e] font-bold">Medium: {hoveredDay.medium}</span>
                <span className="text-[#ff375f] font-bold">Hard: {hoveredDay.hard}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
