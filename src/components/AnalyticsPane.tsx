import React from 'react';
import { TrendingUp, Shield, Flame } from 'lucide-react';
import type { Player } from './PlayerManager';

interface Round {
  id: number;
  scores: Record<string, number>;
}

interface AnalyticsPaneProps {
  activePlayers: Player[];
  rounds: Round[];
  scores: Record<string, number>; // simple counter score fallback
  gameMode: 'tally' | 'round' | 'versus';
}

export const AnalyticsPane: React.FC<AnalyticsPaneProps> = ({
  activePlayers,
  rounds,
  scores,
  gameMode
}) => {

  const hasData = gameMode === 'round' ? rounds.length > 0 : activePlayers.length > 0;

  if (!hasData) {
    return (
      <div className="glass-panel animate-fadein" style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3>No Game Data Yet</h3>
        <p style={{ marginTop: '8px' }}>Start scoring some rounds or points to generate live analytics charts!</p>
      </div>
    );
  }

  // Calculate round-based cumulative progressions
  const getCumulativeHistory = () => {
    const history: Record<string, number[]> = {};
    activePlayers.forEach(p => {
      history[p.id] = [0]; // starts at 0
    });

    let currentTotals: Record<string, number> = {};
    activePlayers.forEach(p => { currentTotals[p.id] = 0; });

    rounds.forEach(r => {
      activePlayers.forEach(p => {
        currentTotals[p.id] += r.scores[p.id] || 0;
        history[p.id].push(currentTotals[p.id]);
      });
    });

    return history;
  };

  const cumulativeHistory = getCumulativeHistory();
  const numRounds = rounds.length;

  // Render Custom SVG Progression Line Chart
  const renderSVGChart = () => {
    if (gameMode !== 'round' || numRounds === 0) {
      // Counter-based bar representation fallback
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activePlayers.map((player) => {
            const score = scores[player.id] || 0;
            const maxVal = Math.max(...activePlayers.map(p => scores[p.id] || 0), 1);
            const percent = (score / maxVal) * 100;

            return (
              <div key={player.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="flex-row-center" style={{ fontSize: '12px' }}>
                  <span>{player.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{score} pts</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border-light))', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: `hsl(var(${player.colorVar}))`, 
                      borderRadius: '4px',
                      boxShadow: `0 0 10px hsl(var(${player.colorVar}) / 0.5)`
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Chart parameters
    const padding = 40;
    const width = 360;
    const height = 180;
    
    // Find min and max points in history
    let maxScore = 1;
    let minScore = 0;
    activePlayers.forEach(p => {
      const pHistory = cumulativeHistory[p.id];
      maxScore = Math.max(maxScore, ...pHistory);
      minScore = Math.min(minScore, ...pHistory);
    });

    const scoreRange = maxScore - minScore || 1;
    const numPoints = numRounds + 1; // including round 0

    // Coordinate maps
    const getX = (index: number) => padding + (index / (numPoints - 1)) * (width - padding * 2);
    const getY = (score: number) => height - padding - ((score - minScore) / scoreRange) * (height - padding * 2);

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Chart Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const gridY = padding + ratio * (height - padding * 2);
            const gridVal = Math.round(maxScore - ratio * scoreRange);

            return (
              <g key={idx}>
                <line 
                  x1={padding} 
                  y1={gridY} 
                  x2={width - padding} 
                  y2={gridY} 
                  stroke="hsl(var(--border-light) / 0.4)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={padding - 8} 
                  y={gridY + 4} 
                  fill="hsl(var(--text-muted))" 
                  fontSize="9px" 
                  fontFamily="var(--font-mono)" 
                  textAnchor="end"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Round label markers on X axis */}
          {Array.from({ length: numPoints }).map((_, idx) => (
            <text 
              key={idx}
              x={getX(idx)} 
              y={height - padding + 16} 
              fill="hsl(var(--text-muted))" 
              fontSize="9px" 
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              R{idx}
            </text>
          ))}

          {/* Glowing Paths for Players */}
          {activePlayers.map((player) => {
            const pHistory = cumulativeHistory[player.id];
            
            // Build SVG path
            let d = '';
            pHistory.forEach((score, idx) => {
              const x = getX(idx);
              const y = getY(score);
              d += `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
            });

            return (
              <g key={player.id}>
                {/* Neon shadow glow path */}
                <path
                  d={d}
                  fill="none"
                  stroke={`hsl(var(${player.colorVar}))`}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.15"
                />
                {/* Solid foreground path */}
                <path
                  d={d}
                  fill="none"
                  stroke={`hsl(var(${player.colorVar}))`}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {pHistory.map((score, idx) => (
                  <circle
                    key={idx}
                    cx={getX(idx)}
                    cy={getY(score)}
                    r="3.5"
                    fill="hsl(var(--bg-card))"
                    stroke={`hsl(var(${player.colorVar}))`}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Round stats analyses
  const getRoundStats = () => {
    if (rounds.length === 0) return null;

    let highestSingleRoundScore = -9999;
    let highestSingleRoundPlayer: Player | null = null;
    let highestRoundNum = 1;

    rounds.forEach(r => {
      activePlayers.forEach(p => {
        const score = r.scores[p.id] || 0;
        if (score > highestSingleRoundScore) {
          highestSingleRoundScore = score;
          highestSingleRoundPlayer = p;
          highestRoundNum = r.id;
        }
      });
    });

    return {
      highestRoundPlayer: highestSingleRoundPlayer,
      highestRoundScore: highestSingleRoundScore,
      highestRoundNum
    };
  };

  const roundStats = getRoundStats();

  return (
    <div className="animate-fadein flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
      
      {/* Live Chart Canvas */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <TrendingUp size={18} style={{ color: 'hsl(var(--accent-secondary))' }} />
          Score Progression
        </h3>
        
        {renderSVGChart()}
      </div>

      {/* Insight Badges / Fun Stats */}
      {gameMode === 'round' && roundStats && roundStats.highestRoundPlayer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', letterSpacing: '0.5px' }}>GAME INSIGHTS</h3>
          
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                background: 'hsl(var(--accent-warning) / 0.15)',
                color: 'hsl(var(--accent-warning))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flame size={20} />
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Highest Single-Round Score</h4>
              <p style={{ fontSize: '13px', marginTop: '2px' }}>
                <strong style={{ color: `hsl(var(${(roundStats.highestRoundPlayer as Player).colorVar}))` }}>
                  {(roundStats.highestRoundPlayer as Player).name}
                </strong>{' '}
                scored <strong>{roundStats.highestRoundScore} points</strong> in Round {roundStats.highestRoundNum}!
              </p>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                background: 'hsl(var(--accent-secondary) / 0.15)',
                color: 'hsl(var(--accent-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Shield size={20} />
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Match Status</h4>
              <p style={{ fontSize: '13px', marginTop: '2px' }}>
                Currently playing round <strong>{numRounds + 1}</strong> with <strong>{activePlayers.length} active players</strong>.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
