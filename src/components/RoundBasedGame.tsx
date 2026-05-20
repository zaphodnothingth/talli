import React, { useState } from 'react';
import { Plus, User, ArrowRight, AlertTriangle } from 'lucide-react';
import type { Player } from './PlayerManager';
import { sound } from '../utils/SoundManager';

interface Round {
  id: number;
  scores: Record<string, number>; // playerId -> score in this round
}

interface RoundBasedGameProps {
  activePlayers: Player[];
  totalScores: Record<string, number>;
  rounds: Round[];
  targetScore: number;
  isGameOver: boolean;
  winner: Player | null;
  onAddRound: (roundScores: Record<string, number>) => void;
  onDeleteLastRound: () => void;
  onResetGame: () => void;
  onSetTargetScore: (target: number) => void;
}

export const RoundBasedGame: React.FC<RoundBasedGameProps> = ({
  activePlayers,
  totalScores,
  rounds,
  targetScore,
  isGameOver,
  winner,
  onAddRound,
  onDeleteLastRound,
  onResetGame,
  onSetTargetScore
}) => {
  const [showInputModal, setShowInputModal] = useState(false);
  const [roundInputs, setRoundInputs] = useState<Record<string, string>>({});
  const [dealerIndex, setDealerIndex] = useState(0);

  // Use unified totalScores prop

  // Initialize round input fields
  const handleOpenInput = () => {
    sound.playDing();
    const initialInputs: Record<string, string> = {};
    activePlayers.forEach(p => {
      initialInputs[p.id] = '';
    });
    setRoundInputs(initialInputs);
    setShowInputModal(true);
  };

  const handleInputChange = (playerId: string, value: string) => {
    // Only allow positive/negative integers
    if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
      setRoundInputs(prev => ({
        ...prev,
        [playerId]: value
      }));
    }
  };

  const handleSaveRound = (e: React.FormEvent) => {
    e.preventDefault();
    
    const roundScores: Record<string, number> = {};
    activePlayers.forEach(p => {
      roundScores[p.id] = parseInt(roundInputs[p.id]) || 0;
    });

    onAddRound(roundScores);
    setShowInputModal(false);
    
    // Rotate dealer for next round
    setDealerIndex(prev => (prev + 1) % activePlayers.length);

    sound.playMatchPoint();
  };

  // Find who has the lowest/highest scores
  const getSortedStandings = () => {
    return [...activePlayers].sort((a, b) => (totalScores[a.id] || 0) - (totalScores[b.id] || 0));
  };

  const standings = getSortedStandings();

  return (
    <div className="animate-fadein flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      
      {/* Game Configuration HUD */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="flex-row-center">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>TARGET SCORE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <input
                type="number"
                value={targetScore}
                onChange={(e) => onSetTargetScore(Math.max(10, parseInt(e.target.value) || 100))}
                style={{
                  width: '64px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid hsl(var(--border-light))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>points</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {rounds.length > 0 && !isGameOver && (
              <button
                className="btn-premium"
                style={{ padding: '8px 12px', fontSize: '12px', color: 'hsl(var(--accent-danger))' }}
                onClick={() => {
                  sound.playUndo();
                  if (confirm("Undo and delete last round scores?")) {
                    onDeleteLastRound();
                    setDealerIndex(prev => (prev - 1 + activePlayers.length) % activePlayers.length);
                  }
                }}
              >
                Undo Rd
              </button>
            )}

            <button
              className="btn-premium"
              style={{ padding: '8px 12px', fontSize: '12px', color: 'hsl(var(--text-muted))' }}
              onClick={() => {
                sound.playUndo();
                if (confirm("Restart game? This deletes all current rounds.")) {
                  onResetGame();
                  setDealerIndex(0);
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Dealer rotation indicator */}
        {activePlayers.length > 0 && !isGameOver && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'hsl(var(--bg-app) / 0.4)', 
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          >
            <User size={13} style={{ color: `hsl(var(${activePlayers[dealerIndex]?.colorVar}))` }} />
            <span>
              Round {rounds.length + 1} Dealer: <strong>{activePlayers[dealerIndex]?.name}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Main Scoreboard List */}
      {activePlayers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3>No Active Players</h3>
          <p style={{ marginTop: '8px' }}>Select active players in the Players tab to begin playing.</p>
        </div>
      ) : isGameOver ? (
        /* GAME OVER SCREEN */
        <div className="glass-panel animate-scalein" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '48px' }}>🏆</div>
          <div>
            <h2 style={{ fontSize: '26px' }}>Winner Announced!</h2>
            <p style={{ fontSize: '16px', color: `hsl(var(${winner?.colorVar}))`, fontWeight: 800, marginTop: '5px' }}>
              {winner?.name} has won the match!
            </p>
          </div>

          <div 
            className="glass-card" 
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: 'hsl(var(--bg-app) / 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <h3 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', letterSpacing: '0.5px' }}>FINAL STANDINGS</h3>
            {standings.map((p, index) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
                <span style={{ fontWeight: index === 0 ? 800 : 500, color: index === 0 ? `hsl(var(${p.colorVar}))` : 'inherit' }}>
                  #{index + 1} {p.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {totalScores[p.id]} pts
                </span>
              </div>
            ))}
          </div>

          <button 
            className="btn-premium btn-primary-glow" 
            style={{ width: '100%' }}
            onClick={() => {
              sound.playDing();
              onResetGame();
              setDealerIndex(0);
            }}
          >
            Play Again
          </button>
        </div>
      ) : (
        /* ACTIVE GAME INTERFACE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          
          {/* Quick stand list */}
          <div className="player-grid">
            {activePlayers.map((player) => {
              const score = totalScores[player.id] || 0;
              const percentOfTarget = Math.min(100, Math.max(0, (score / targetScore) * 100));
              const isWarning = score >= targetScore * 0.8;

              return (
                <div 
                  key={player.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '12px 16px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Glowing background progress bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${percentOfTarget}%`,
                      background: `hsl(var(${player.colorVar}) / 0.05)`,
                      borderRight: score > 0 ? `2px solid hsl(var(${player.colorVar}) / 0.2)` : 'none',
                      transition: 'width 0.4s ease-out',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  <div className="flex-row-center" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: 'full', 
                          background: `hsl(var(${player.colorVar}))`,
                          boxShadow: `0 0 8px hsl(var(${player.colorVar}))`
                        }}
                      />
                      <span style={{ fontWeight: 700 }}>{player.name}</span>
                      {isWarning && <AlertTriangle size={13} style={{ color: 'hsl(var(--accent-danger))' }} />}
                    </div>

                    <span 
                      style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '22px', 
                        fontWeight: 800,
                        color: isWarning ? 'hsl(var(--accent-danger))' : 'inherit'
                      }}
                    >
                      {score} <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>/ {targetScore}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Round Button */}
          <button 
            className="btn-premium btn-primary-glow" 
            style={{ padding: '16px' }}
            onClick={handleOpenInput}
          >
            <Plus size={18} /> Enter Round {rounds.length + 1} Scores
          </button>

          {/* Round History Log */}
          {rounds.length > 0 && (
            <div className="glass-panel" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', letterSpacing: '0.5px' }}>ROUND LOGS</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...rounds].reverse().map((round) => (
                  <div 
                    key={round.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '13px', 
                      padding: '8px 0',
                      borderBottom: '1px solid hsl(var(--border-light) / 0.5)'
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>Rd {round.id}</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {activePlayers.map(p => (
                        <span key={p.id} style={{ fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: 'hsl(var(--text-muted))' }}>{p.name.slice(0, 3)}:</span>{' '}
                          <strong style={{ color: (round.scores[p.id] || 0) < 0 ? 'hsl(var(--accent-danger))' : 'inherit' }}>
                            {round.scores[p.id] || 0}
                          </strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ROUND SCORES INPUT MODAL */}
      {showInputModal && (
        <div className="action-sheet-overlay" onClick={() => setShowInputModal(false)}>
          <div className="action-sheet animate-slideup" onClick={(e) => e.stopPropagation()}>
            <div className="flex-row-center">
              <h2>Enter Round {rounds.length + 1} Points</h2>
              <button 
                className="btn-premium" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setShowInputModal(false)}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveRound} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activePlayers.map((player) => (
                  <div key={player.id} className="flex-row-center" style={{ gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <div 
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '4px', 
                          background: `hsl(var(${player.colorVar}))` 
                        }}
                      />
                      <span style={{ fontWeight: 700 }}>{player.name}</span>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="^-?[0-9]*$"
                      placeholder="0"
                      className="input-premium"
                      style={{ width: '100px', textAlign: 'center', padding: '10px', fontFamily: 'var(--font-mono)' }}
                      value={roundInputs[player.id] || ''}
                      onChange={(e) => handleInputChange(player.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-premium btn-primary-glow" style={{ padding: '14px', width: '100%' }}>
                Save Round Scores <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
