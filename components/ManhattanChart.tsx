import React from 'react';
import type { OverEvent } from '../types';

interface ManhattanChartProps {
  innings1History: OverEvent[][];
  innings2History: OverEvent[][];
  team1Name: string;
  team2Name: string;
  innings1TeamKey: 'team1' | 'team2';
}

const ManhattanChart: React.FC<ManhattanChartProps> = ({ innings1History, innings2History, team1Name, team2Name, innings1TeamKey }) => {
  const innings1Runs = innings1History.map(over => over.reduce((sum, ball) => sum + ball.runs, 0));
  const innings2Runs = innings2History.map(over => over.reduce((sum, ball) => sum + ball.runs, 0));

  const maxOvers = Math.max(innings1History.length, innings2History.length, 1);
  const maxRuns = Math.max(...innings1Runs, ...innings2Runs, 5); // Minimum height for better visualization

  const team1Color = "bg-blue-500";
  const team2Color = "bg-amber-500";

  const innings1TeamName = innings1TeamKey === 'team1' ? team1Name : team2Name;
  const innings2TeamName = innings1TeamKey === 'team1' ? team2Name : team1Name;

  const innings1Color = innings1TeamKey === 'team1' ? team1Color : team2Color;
  const innings2Color = innings1TeamKey === 'team1' ? team2Color : team1Color;


  return (
    <div className="bg-[#161B22] rounded-xl p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-[#9CA3AF]">Match Summary (Runs per Over)</h3>
      <div className="flex justify-end gap-4 text-xs mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${innings1Color}`}></div>
          <span>{innings1TeamName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${innings2Color}`}></div>
          <span>{innings2TeamName}</span>
        </div>
      </div>
      <div className="flex gap-1 items-end h-48 border-b-2 border-l-2 border-gray-700 p-2 pb-0">
        {Array.from({ length: maxOvers }, (_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
            <div className="flex gap-[2px] items-end h-full w-full justify-center">
              {/* Innings 1 Bar */}
              <div
                className={`w-1/2 max-w-[20px] ${innings1Color} rounded-t-sm hover:opacity-80 transition-all duration-300`}
                style={{ height: `${(innings1Runs[i] ?? 0) / maxRuns * 100}%` }}
                title={`Over ${i + 1} (${innings1TeamName}): ${innings1Runs[i] ?? 0} runs`}
              >
              </div>
              
              {/* Innings 2 Bar */}
              {innings2History.length > i && (
                <div
                  className={`w-1/2 max-w-[20px] ${innings2Color} rounded-t-sm hover:opacity-80 transition-all duration-300`}
                  style={{ height: `${(innings2Runs[i] ?? 0) / maxRuns * 100}%` }}
                  title={`Over ${i + 1} (${innings2TeamName}): ${innings2Runs[i] ?? 0} runs`}
                >
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1 absolute -bottom-5">{i + 1}</span>
            <div className="absolute bottom-full mb-2 w-max bg-black/70 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p>{innings1TeamName}: {innings1Runs[i] ?? '-'} runs</p>
              {innings2History.length > i && <p>{innings2TeamName}: {innings2Runs[i] ?? '-'} runs</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManhattanChart;