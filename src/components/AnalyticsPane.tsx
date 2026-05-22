import React from 'react';
import { TrendingUp, Shield, Flame, Calendar, Trash2, Trophy, Edit3, X, CheckSquare, Square } from 'lucide-react';
import type { Player } from './PlayerManager';
import type { MatchSummary } from '../App';

interface Round {
  id: number;
  scores: Record<string, number>;
}

interface AnalyticsPaneProps {
  activePlayers: Player[];
  rounds: Round[];
  scores: Record<string, number>; // simple counter score fallback
  gameMode: 'tally' | 'round' | 'versus';
  matchHistory?: MatchSummary[];
  onClearHistory?: () => void;
  onDeleteMatches?: (matchIds: string[]) => void;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ children, onDelete, disabled }) => {
  const [startX, setStartX] = React.useState(0);
  const [currentOffset, setCurrentOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const dragThreshold = 45; // snap threshold
  const deleteThreshold = 180; // drag past this to trigger direct delete

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    const diffX = e.touches[0].clientX - startX;
    
    let offset = isOpen ? diffX - 70 : diffX;
    if (offset > 0) offset = 0; // Swipe left only!
    setCurrentOffset(offset);
  };

  const handleTouchEnd = () => {
    if (disabled || !isDragging) return;
    setIsDragging(false);
    
    if (currentOffset < -deleteThreshold) {
      onDelete();
      setCurrentOffset(0);
      setIsOpen(false);
    } else if (currentOffset < -dragThreshold) {
      setCurrentOffset(-70);
      setIsOpen(true);
    } else {
      setCurrentOffset(0);
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setCurrentOffset(0);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', width: '100%', touchAction: 'pan-y' }}>
      {/* Red Delete Panel Behind */}
      <div 
        style={{ 
          position: 'absolute', 
          right: 0, 
          top: 0, 
          bottom: 0, 
          width: '70px', 
          background: 'hsl(var(--accent-danger))',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '16px',
          color: '#fff',
          zIndex: 1,
          opacity: currentOffset < 0 ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            handleClose();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 800
          }}
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>

      {/* Front sliding content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${currentOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          zIndex: 2
        }}
        onClick={() => {
          if (isOpen) handleClose();
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const AnalyticsPane: React.FC<AnalyticsPaneProps> = ({
  activePlayers,
  rounds,
  scores,
  gameMode,
  matchHistory = [],
  onClearHistory,
  onDeleteMatches
}) => {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [selectedMatchIds, setSelectedMatchIds] = React.useState<string[]>([]);

  const handleToggleSelect = (matchId: string) => {
    setSelectedMatchIds(prev => 
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedMatchIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete the ${selectedMatchIds.length} selected match(es)?`)) {
      if (onDeleteMatches) {
        onDeleteMatches(selectedMatchIds);
      }
      setSelectedMatchIds([]);
      setIsEditMode(false);
    }
  };

  const hasActiveData = gameMode === 'round' 
    ? rounds.length > 0 
    : (gameMode === 'tally' ? Object.keys(scores).length > 0 : false);

  const hasData = hasActiveData || matchHistory.length > 0;

  if (!hasData) {
    return (
      <div className="glass-panel animate-fadein" style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
        <h3>No Game Stats Yet</h3>
        <p style={{ marginTop: '8px', fontSize: '13px' }}>Start scoring points, play rounds, or complete matches to showcase your hall of fame and dynamic charts here!</p>
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
        
        {hasActiveData ? renderSVGChart() : (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
            No active game scoring yet. Add rounds in the game tab to populate real-time charts!
          </div>
        )}
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

      {/* MATCH HISTORY LOG */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
        <div className="flex-row-center" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="flex-row-center" style={{ fontSize: '13px', gap: '8px', color: 'hsl(var(--text-muted))', letterSpacing: '0.5px' }}>
            <Calendar size={15} style={{ color: 'hsl(var(--accent-secondary))' }} />
            <span>MATCH HISTORY ARCHIVE {matchHistory.length > 0 && `(${matchHistory.length})`}</span>
          </h3>
          
          {matchHistory.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isEditMode ? (
                <>
                  <button
                    onClick={() => {
                      if (selectedMatchIds.length === matchHistory.length) {
                        setSelectedMatchIds([]);
                      } else {
                        setSelectedMatchIds(matchHistory.map(m => m.id));
                      }
                    }}
                    className="btn-premium"
                    style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                  >
                    {selectedMatchIds.length === matchHistory.length ? 'Deselect All' : 'Select All'}
                  </button>

                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedMatchIds.length === 0}
                    className="btn-premium"
                    style={{ 
                      padding: '6px 10px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      color: selectedMatchIds.length > 0 ? 'hsl(var(--accent-danger))' : 'hsl(var(--text-muted))',
                      borderColor: selectedMatchIds.length > 0 ? 'hsl(var(--accent-danger) / 0.3)' : 'hsl(var(--border-light))',
                      opacity: selectedMatchIds.length > 0 ? 1 : 0.5
                    }}
                  >
                    <Trash2 size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    Delete Selected ({selectedMatchIds.length})
                  </button>

                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedMatchIds([]);
                    }}
                    className="btn-premium"
                    style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                  >
                    <X size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="btn-premium"
                    style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--accent-primary))', borderColor: 'hsl(var(--accent-primary) / 0.3)' }}
                  >
                    <Edit3 size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    Edit
                  </button>

                  {onClearHistory && (
                    <button
                      onClick={onClearHistory}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'hsl(var(--accent-danger))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}
                      title="Clear all match logs"
                    >
                      <Trash2 size={13} />
                      <span>Clear All</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {matchHistory.length === 0 ? (
          <div className="glass-card animate-fadein" style={{ padding: '30px 16px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗓️</div>
            <h4 style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>No Archived Matches</h4>
            <p style={{ marginTop: '4px', lineHeight: 1.4 }}>Complete any match with a target score set to automatically archive results in this hall of fame.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matchHistory.map((match) => {
              const isSelected = selectedMatchIds.includes(match.id);
              const cardMarkup = (
                <div 
                  className={`glass-card animate-scalein ${isSelected ? 'selected' : ''}`} 
                  onClick={() => {
                    if (isEditMode) {
                      handleToggleSelect(match.id);
                    }
                  }}
                  style={{ 
                    padding: '16px', 
                    display: 'flex', 
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    cursor: isEditMode ? 'pointer' : 'default',
                    borderLeft: `3px solid ${match.winnerId ? `hsl(var(${match.players.find(p => p.name === match.winnerName)?.colorVar || '--accent-primary'}))` : 'hsl(var(--accent-primary))'}`,
                    background: isSelected 
                      ? 'linear-gradient(90deg, hsl(var(--accent-primary) / 0.08) 0%, hsl(var(--bg-card) / 0.9) 100%)' 
                      : `linear-gradient(90deg, hsl(var(${match.players.find(p => p.name === match.winnerName)?.colorVar || '--accent-primary'} / 0.04) 0%, hsl(var(--bg-card)) 100%)`
                  }}
                >
                  {/* Edit mode selection checkmark */}
                  {isEditMode && (
                    <div style={{ color: isSelected ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center' }}>
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                  )}

                  {/* Card Content Core */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {/* Header: Preset and Date */}
                    <div className="flex-row-center" style={{ justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 800, color: 'hsl(var(--text-primary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {match.presetName}
                      </span>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>
                        {match.date}
                      </span>
                    </div>

                    {/* Winner announcement */}
                    <div className="flex-row-center" style={{ gap: '6px', fontSize: '13px' }}>
                      <Trophy size={14} style={{ color: 'hsl(var(--accent-warning))' }} />
                      <span>
                        Winner:{' '}
                        <strong style={{ color: `hsl(var(${match.players.find(p => p.name === match.winnerName)?.colorVar || '--text-primary'}))` }}>
                          {match.winnerName}
                        </strong>
                      </span>
                    </div>

                    {/* Scoreboard grid for this match */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {match.players.map((player, pIdx) => {
                        const isWinner = player.name === match.winnerName;
                        return (
                          <div 
                            key={pIdx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              background: 'hsl(var(--bg-app) / 0.5)', 
                              padding: '4px 10px', 
                              borderRadius: '20px',
                              fontSize: '12px',
                              border: isWinner ? '1px solid hsl(var(--accent-warning) / 0.3)' : '1px solid transparent'
                            }}
                          >
                            <div 
                              style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: `hsl(var(${player.colorVar}))`,
                                boxShadow: `0 0 6px hsl(var(${player.colorVar}) / 0.5)`
                              }} 
                            />
                            <span style={{ color: 'hsl(var(--text-secondary))' }}>{player.name}</span>
                            <strong style={{ fontFamily: 'var(--font-mono)' }}>{player.score}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inline Delete Button (only in Edit mode for quick single delete fallback) */}
                  {isEditMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete this match?`)) {
                          if (onDeleteMatches) onDeleteMatches([match.id]);
                        }
                      }}
                      className="btn-premium"
                      style={{ padding: '6px', color: 'hsl(var(--accent-danger))', borderColor: 'hsl(var(--accent-danger) / 0.2)' }}
                      title="Delete single match"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );

              return (
                <SwipeableItem 
                  key={match.id}
                  disabled={isEditMode} // Disable swipe gesture in edit mode to avoid touch conflicts!
                  onDelete={() => {
                    if (onDeleteMatches) {
                      onDeleteMatches([match.id]);
                    }
                  }}
                >
                  {cardMarkup}
                </SwipeableItem>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
