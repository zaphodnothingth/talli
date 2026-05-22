import React, { useState } from 'react';
import { Plus, Minus, User, ArrowRight, AlertTriangle, Edit2, Trash2, X } from 'lucide-react';
import type { Player } from './PlayerManager';
import { sound } from '../utils/SoundManager';

interface Round {
  id: number;
  scores: Record<string, number>; // playerId -> score in this round
}

interface RoundBasedGameProps {
  activePlayers: Player[];
  totalScores: Record<string, number>;
  scores?: Record<string, number>;
  rounds: Round[];
  targetScore: number;
  isGameOver: boolean;
  winner: Player | null;
  onAddRound: (roundScores: Record<string, number>) => void;
  onDeleteLastRound: () => void;
  onDeleteRound?: (roundId: number) => void;
  onEditRound?: (roundId: number, updatedScores: Record<string, number>) => void;
  onResetGame: () => void;
  onSetTargetScore: (target: number) => void;
  onAdjustScore?: (playerId: string, delta: number) => void;
  onMatchCompleted?: () => void;
}

export const RoundBasedGame: React.FC<RoundBasedGameProps> = ({
  activePlayers,
  totalScores,
  scores,
  rounds,
  targetScore,
  isGameOver,
  winner,
  onAddRound,
  onDeleteRound,
  onEditRound,
  onResetGame,
  onSetTargetScore,
  onAdjustScore,
  onMatchCompleted
}) => {
  const [showInputModal, setShowInputModal] = useState(false);
  const [roundInputs, setRoundInputs] = useState<Record<string, string>>({});
  const [dealerIndex, setDealerIndex] = useState(0);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // States for Manage/Edit Rounds
  const [showEditRoundsModal, setShowEditRoundsModal] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<number | null>(null);
  const [editRoundInputs, setEditRoundInputs] = useState<Record<string, string>>({});

  // Use unified totalScores prop

  // Initialize round input fields
  const handleOpenInput = () => {
    sound.playDing();
    const initialInputs: Record<string, string> = {};
    activePlayers.forEach(p => {
      const tallyVal = scores?.[p.id] || 0;
      initialInputs[p.id] = tallyVal !== 0 ? tallyVal.toString() : '';
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

  const adjustInputValue = (playerId: string, delta: number) => {
    setRoundInputs(prev => {
      const currentVal = parseInt(prev[playerId]) || 0;
      const newVal = currentVal + delta;
      return {
        ...prev,
        [playerId]: newVal.toString()
      };
    });
    sound.playTick();
  };

  const handleSaveRound = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Save Round Button */}
            {!isGameOver && (
              <button
                className="btn-premium btn-primary-glow"
                style={{ padding: '8px 12px', fontSize: '12px', color: 'hsl(var(--accent-primary))', borderColor: 'hsl(var(--accent-primary) / 0.3)' }}
                onClick={() => {
                  sound.playMatchPoint();
                  onAddRound(scores || {});
                }}
                title="Save Round"
              >
                Save Rd
              </button>
            )}

            {/* End Match Button */}
            {onMatchCompleted && !isGameOver && (
              <button
                className="btn-premium"
                style={{ padding: '8px 12px', fontSize: '12px', color: 'hsl(var(--accent-success))' }}
                onClick={() => {
                  if (window.confirm("Finish match and save to history?")) {
                    onMatchCompleted();
                  }
                }}
                title="End Match"
              >
                End Match
              </button>
            )}

            {rounds.length > 0 && !isGameOver && (
              <button
                className="btn-premium"
                style={{ padding: '8px 12px', fontSize: '12px', color: 'hsl(var(--accent-primary))', borderColor: 'hsl(var(--accent-primary) / 0.3)' }}
                onClick={() => {
                  sound.playTick();
                  setShowEditRoundsModal(true);
                }}
              >
                Edit Rounds
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
          {/* Quick stand list */}
          <div className="player-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activePlayers.map((player) => {
              const activeRoundScore = scores?.[player.id] || 0;
              const cumulativeSavedScore = rounds.reduce((sum, r) => sum + (r.scores[player.id] || 0), 0);
              const totalGameScore = cumulativeSavedScore + activeRoundScore;
              const percentOfTarget = Math.min(100, Math.max(0, (totalGameScore / targetScore) * 100));
              const isWarning = totalGameScore >= targetScore * 0.8;
              const isAnimating = animatingId === player.id;

              return (
                <div 
                  key={player.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '14px 18px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderColor: `hsl(var(${player.colorVar}) / 0.3)`,
                    background: `linear-gradient(90deg, hsl(var(${player.colorVar}) / 0.04) 0%, hsl(var(--bg-card)) 100%)`,
                    cursor: onAdjustScore ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (onAdjustScore) {
                      sound.playDing();
                      setAnimatingId(player.id);
                      setTimeout(() => setAnimatingId(null), 300);
                      onAdjustScore(player.id, 1);
                    }
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
                      borderRight: totalGameScore > 0 ? `2px solid hsl(var(${player.colorVar}) / 0.2)` : 'none',
                      transition: 'width 0.4s ease-out',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Left Column: Player Details & Cumulative Saved Score */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: `hsl(var(${player.colorVar}))`,
                          boxShadow: `0 0 8px hsl(var(${player.colorVar}) / 0.5)`
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{player.name}</span>
                      {isWarning && <AlertTriangle size={13} style={{ color: 'hsl(var(--accent-danger))' }} />}
                    </div>
                    
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                      Total: <strong style={{ color: 'hsl(var(--text-secondary))', fontFamily: 'var(--font-mono)' }}>{totalGameScore}</strong> / {targetScore} pts
                    </span>
                  </div>

                  {/* Right Column: Score adjustment pills & Active round score */}
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onAdjustScore && (
                      <button
                        className="btn-icon-circle"
                        style={{ width: '32px', height: '32px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playTickDown();
                          setAnimatingId(player.id);
                          setTimeout(() => setAnimatingId(null), 300);
                          onAdjustScore(player.id, -1);
                        }}
                      >
                        <Minus size={13} />
                      </button>
                    )}

                    <span
                      className={isAnimating ? 'animate-pop' : ''}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '24px',
                        fontWeight: 850,
                        minWidth: '40px',
                        textAlign: 'center',
                        color: activeRoundScore > 0 ? `hsl(var(${player.colorVar}))` : 'hsl(var(--text-muted))',
                        textShadow: activeRoundScore > 0 ? `0 0 12px hsl(var(${player.colorVar}) / 0.3)` : 'none'
                      }}
                    >
                      {activeRoundScore > 0 ? `+${activeRoundScore}` : activeRoundScore}
                    </span>

                    {onAdjustScore && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn-premium"
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            borderRadius: '6px', 
                            minWidth: '32px',
                            background: 'hsl(var(--bg-app) / 0.6)',
                            borderColor: `hsl(var(${player.colorVar}) / 0.3)`,
                            color: `hsl(var(${player.colorVar}))`
                          }}
                          onClick={() => {
                            sound.playDing();
                            setAnimatingId(player.id);
                            setTimeout(() => setAnimatingId(null), 300);
                            onAdjustScore(player.id, 1);
                          }}
                        >
                          +1
                        </button>
                        
                        <button
                          className="btn-premium"
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            borderRadius: '6px', 
                            minWidth: '32px',
                            background: 'hsl(var(--bg-app) / 0.6)',
                            borderColor: `hsl(var(${player.colorVar}) / 0.5)`,
                            color: `hsl(var(${player.colorVar}))`
                          }}
                          onClick={() => {
                            sound.playDing();
                            setAnimatingId(player.id);
                            setTimeout(() => setAnimatingId(null), 300);
                            onAdjustScore(player.id, 5);
                          }}
                        >
                          +5
                        </button>

                        <button
                          className="btn-premium"
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            borderRadius: '6px', 
                            minWidth: '34px',
                            background: `hsl(var(${player.colorVar}))`, 
                            border: 'none',
                            color: '#fff',
                            boxShadow: `0 3px 8px hsl(var(${player.colorVar}) / 0.2)`
                          }}
                          onClick={() => {
                            sound.playDing();
                            setAnimatingId(player.id);
                            setTimeout(() => setAnimatingId(null), 300);
                            onAdjustScore(player.id, 10);
                          }}
                        >
                          +10
                        </button>
                      </div>
                    )}
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className="btn-premium" 
                  style={{ padding: '6px 12px', fontSize: '12px', color: 'hsl(var(--accent-success))', borderColor: 'hsl(var(--accent-success) / 0.3)' }}
                  onClick={(e) => handleSaveRound(e)}
                >
                  Save
                </button>
                <button 
                  type="button"
                  className="btn-premium" 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => setShowInputModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveRound} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activePlayers.map((player) => (
                  <div key={player.id} className="flex-row-center" style={{ gap: '15px', padding: '6px 0', borderBottom: '1px solid hsl(var(--border-light) / 0.3)' }}>
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

                    {/* Quick increment / decrement buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn-premium"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '30px' }}
                        onClick={() => adjustInputValue(player.id, -1)}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        className="btn-premium"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '30px', color: 'hsl(var(--accent-primary))', borderColor: 'hsl(var(--accent-primary) / 0.3)' }}
                        onClick={() => adjustInputValue(player.id, 1)}
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        className="btn-premium"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '30px', color: 'hsl(var(--accent-secondary))', borderColor: 'hsl(var(--accent-secondary) / 0.3)' }}
                        onClick={() => adjustInputValue(player.id, 5)}
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        className="btn-premium"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '34px', color: 'hsl(var(--accent-success))', borderColor: 'hsl(var(--accent-success) / 0.3)' }}
                        onClick={() => adjustInputValue(player.id, 10)}
                      >
                        +10
                      </button>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="^-?[0-9]*$"
                      placeholder="0"
                      className="input-premium"
                      style={{ width: '70px', textAlign: 'center', padding: '8px', fontFamily: 'var(--font-mono)' }}
                      value={roundInputs[player.id] ?? ''}
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

      {/* EDIT ROUNDS MODAL */}
      {showEditRoundsModal && (
        <div className="action-sheet-overlay" onClick={() => setShowEditRoundsModal(false)}>
          <div className="action-sheet animate-slideup" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex-row-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Manage Rounds</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', background: 'hsl(var(--border-light) / 0.5)', borderRadius: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  {rounds.length} Total
                </span>
              </h2>
              <button 
                className="btn-icon-circle"
                onClick={() => setShowEditRoundsModal(false)}
                style={{ background: 'hsl(var(--border-light) / 0.3)', width: '30px', height: '30px' }}
              >
                <X size={14} />
              </button>
            </div>

            {editingRoundId !== null ? (
              /* SUB-SHEET FOR EDITING A SPECIFIC ROUND */
              <div className="animate-scalein" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex-row-center" style={{ padding: '8px 12px', background: 'hsl(var(--accent-primary) / 0.08)', borderRadius: '8px', border: '1px solid hsl(var(--accent-primary) / 0.2)' }}>
                  <span style={{ fontWeight: 700, color: 'hsl(var(--accent-primary))' }}>Editing Round {editingRoundId} Scores</span>
                  <button 
                    className="btn-premium"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => setEditingRoundId(null)}
                  >
                    Back
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activePlayers.map(player => (
                    <div key={player.id} className="flex-row-center" style={{ gap: '15px', padding: '6px 0', borderBottom: '1px solid hsl(var(--border-light) / 0.3)' }}>
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

                      {/* Quick Adjust Buttons */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn-premium"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '30px' }}
                          onClick={() => {
                            setEditRoundInputs(prev => {
                              const cur = parseInt(prev[player.id]) || 0;
                              return { ...prev, [player.id]: (cur - 1).toString() };
                            });
                            sound.playTick();
                          }}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="btn-premium"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '30px', color: 'hsl(var(--accent-primary))', borderColor: 'hsl(var(--accent-primary) / 0.3)' }}
                          onClick={() => {
                            setEditRoundInputs(prev => {
                              const cur = parseInt(prev[player.id]) || 0;
                              return { ...prev, [player.id]: (cur + 1).toString() };
                            });
                            sound.playTick();
                          }}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          className="btn-premium"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '30px', color: 'hsl(var(--accent-secondary))', borderColor: 'hsl(var(--accent-secondary) / 0.3)' }}
                          onClick={() => {
                            setEditRoundInputs(prev => {
                              const cur = parseInt(prev[player.id]) || 0;
                              return { ...prev, [player.id]: (cur + 5).toString() };
                            });
                            sound.playTick();
                          }}
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          className="btn-premium"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', minWidth: '34px', color: 'hsl(var(--accent-success))', borderColor: 'hsl(var(--accent-success) / 0.3)' }}
                          onClick={() => {
                            setEditRoundInputs(prev => {
                              const cur = parseInt(prev[player.id]) || 0;
                              return { ...prev, [player.id]: (cur + 10).toString() };
                            });
                            sound.playTick();
                          }}
                        >
                          +10
                        </button>
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="^-?[0-9]*$"
                        placeholder="0"
                        className="input-premium"
                        style={{ width: '70px', textAlign: 'center', padding: '8px', fontFamily: 'var(--font-mono)' }}
                        value={editRoundInputs[player.id] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
                            setEditRoundInputs(prev => ({ ...prev, [player.id]: val }));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    className="btn-premium"
                    style={{ flex: 1, padding: '12px' }}
                    onClick={() => setEditingRoundId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-premium btn-primary-glow"
                    style={{ flex: 2, padding: '12px' }}
                    onClick={() => {
                      if (editingRoundId !== null && onEditRound) {
                        const updated: Record<string, number> = {};
                        activePlayers.forEach(p => {
                          updated[p.id] = parseInt(editRoundInputs[p.id]) || 0;
                        });
                        onEditRound(editingRoundId, updated);
                        setEditingRoundId(null);
                      }
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* LIST OF ROUNDS TO EDIT OR DELETE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rounds.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                    No rounds logged yet.
                  </div>
                ) : (
                  [...rounds].reverse().map(round => (
                    <div 
                      key={round.id}
                      className="glass-card"
                      style={{ 
                        padding: '12px 16px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px', 
                        background: 'hsl(var(--bg-app) / 0.4)',
                        borderColor: 'hsl(var(--border-light) / 0.4)'
                      }}
                    >
                      <div className="flex-row-center">
                        <span style={{ fontWeight: 800, fontSize: '15px' }}>Round {round.id}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-icon-circle"
                            style={{ width: '30px', height: '30px', color: 'hsl(var(--accent-primary))', background: 'hsl(var(--accent-primary) / 0.1)', borderColor: 'hsl(var(--accent-primary) / 0.2)' }}
                            onClick={() => {
                              sound.playDing();
                              setEditingRoundId(round.id);
                              const inputs: Record<string, string> = {};
                              activePlayers.forEach(p => {
                                inputs[p.id] = (round.scores[p.id] || 0).toString();
                              });
                              setEditRoundInputs(inputs);
                            }}
                            title="Edit scores"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn-icon-circle"
                            style={{ width: '30px', height: '30px', color: 'hsl(var(--accent-danger))', background: 'hsl(var(--accent-danger) / 0.1)', borderColor: 'hsl(var(--accent-danger) / 0.2)' }}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete Round ${round.id}? This will shift down all subsequent rounds.`)) {
                                if (onDeleteRound) {
                                  onDeleteRound(round.id);
                                }
                              }
                            }}
                            title="Delete round"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px' }}>
                        {activePlayers.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>{p.name.slice(0, 3)}:</span>
                            <strong style={{ fontFamily: 'var(--font-mono)', color: `hsl(var(${p.colorVar}))` }}>
                              {round.scores[p.id] || 0}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
