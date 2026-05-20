import React, { useState } from 'react';
import { Minus, Plus, RotateCcw, Volume2 } from 'lucide-react';
import type { Player } from './PlayerManager';
import { sound } from '../utils/SoundManager';

interface QuickCounterProps {
  activePlayers: Player[];
  totalScores: Record<string, number>;
  onAdjustScore: (playerId: string, delta: number) => void;
  onResetScores: () => void;
  onMatchCompleted: () => void;
}

export const QuickCounter: React.FC<QuickCounterProps> = ({
  activePlayers,
  totalScores,
  onAdjustScore,
  onResetScores,
  onMatchCompleted
}) => {
  const [step, setStep] = useState<number>(1);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleIncrement = (playerId: string) => {
    sound.playDing();
    
    // Trigger pop animation
    setAnimatingId(playerId);
    setTimeout(() => setAnimatingId(null), 300);

    onAdjustScore(playerId, step);
  };

  const handleDecrement = (playerId: string) => {
    sound.playTickDown();
    
    setAnimatingId(playerId);
    setTimeout(() => setAnimatingId(null), 300);

    onAdjustScore(playerId, -step);
  };

  const handleSpeakLeader = () => {
    if (activePlayers.length === 0) return;
    
    // Find player with highest score
    let leader = activePlayers[0];
    let max = totalScores[leader.id] || 0;
    let isTie = false;

    for (let i = 1; i < activePlayers.length; i++) {
      const s = totalScores[activePlayers[i].id] || 0;
      if (s > max) {
        max = s;
        leader = activePlayers[i];
        isTie = false;
      } else if (s === max) {
        isTie = true;
      }
    }

    if (max === 0) {
      sound.speak("The game has just started! Everyone is tied at zero.");
    } else if (isTie) {
      sound.speak(`We have a tie for the lead at ${max} points!`);
    } else {
      sound.speak(`${leader.name} is leading with ${max} points!`);
    }
  };

  return (
    <div className="animate-fadein flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      
      {/* Steps & Controls */}
      <div className="glass-panel flex-row-center" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', fontWeight: 700 }}>STEP:</span>
          {[1, 5, 10].map((s) => (
            <button
              key={s}
              className="btn-premium"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                background: step === s ? 'hsl(var(--accent-primary) / 0.15)' : 'transparent',
                borderColor: step === s ? 'hsl(var(--accent-primary))' : 'hsl(var(--border-light))',
                color: step === s ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-secondary))'
              }}
              onClick={() => {
                sound.playTick();
                setStep(s);
              }}
            >
              {s > 0 ? `+${s}` : s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-premium"
            style={{ padding: '8px', color: 'hsl(var(--accent-secondary))' }}
            onClick={handleSpeakLeader}
            title="Speak Leader"
          >
            <Volume2 size={16} />
          </button>
          
          <button
            className="btn-premium"
            style={{ padding: '8px 12px', fontSize: '11px', color: 'hsl(var(--accent-success))' }}
            onClick={() => {
              if (window.confirm("Finish match and save to history?")) {
                onMatchCompleted();
              }
            }}
            title="End Match"
          >
            End Match
          </button>
          
          <button
            className="btn-premium"
            style={{ padding: '8px', color: 'hsl(var(--text-muted))' }}
            onClick={() => {
              sound.playUndo();
              if (window.confirm("Are you sure you want to reset all counters to 0?")) {
                onResetScores();
              }
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Counters Grid */}
      {activePlayers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3>No Active Players</h3>
          <p style={{ marginTop: '8px' }}>Go to the Players tab to create and activate players for this match!</p>
        </div>
      ) : (
        <div className="player-grid" style={{ flex: 1, overflowY: 'auto' }}>
          {activePlayers.map((player) => {
            const score = totalScores[player.id] || 0;
            const isAnimating = animatingId === player.id;

            return (
              <div
                key={player.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderColor: `hsl(var(${player.colorVar}) / 0.3)`,
                  background: `linear-gradient(90deg, hsl(var(${player.colorVar}) / 0.04) 0%, hsl(var(--bg-card)) 100%)`
                }}
              >
                {/* Player details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '4px',
                      background: `hsl(var(${player.colorVar}))`,
                      boxShadow: `0 0 10px hsl(var(${player.colorVar}) / 0.5)`
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>{player.name}</span>
                </div>

                {/* Score Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    className="btn-icon-circle"
                    style={{ width: '38px', height: '38px' }}
                    onClick={() => handleDecrement(player.id)}
                  >
                    <Minus size={16} />
                  </button>

                  <span
                    className={isAnimating ? 'animate-pop' : ''}
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      minWidth: '50px',
                      textAlign: 'center',
                      color: `hsl(var(${player.colorVar}))`,
                      textShadow: `0 0 15px hsl(var(${player.colorVar}) / 0.2)`
                    }}
                  >
                    {score}
                  </span>

                  <button
                    className="btn-icon-circle"
                    style={{ 
                      width: '38px', 
                      height: '38px', 
                      background: `hsl(var(${player.colorVar}))`, 
                      border: 'none',
                      color: '#fff',
                      boxShadow: `0 4px 10px hsl(var(${player.colorVar}) / 0.2)`
                    }}
                    onClick={() => handleIncrement(player.id)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
