import React, { useState } from 'react';
import { Minus, RotateCcw, Award } from 'lucide-react';
import type { Player } from './PlayerManager';
import { sound } from '../utils/SoundManager';

interface SetHistory {
  player1: number;
  player2: number;
}

interface VersusGameProps {
  activePlayers: Player[];
  scores: Record<string, number>;
  onUpdateScore: (playerId: string, newScore: number) => void;
  onResetScores: () => void;
  onMatchCompleted?: (winner: Player, p1Sets: number, p2Sets: number) => void;
}

export const VersusGame: React.FC<VersusGameProps> = ({
  activePlayers,
  scores,
  onUpdateScore,
  onResetScores,
  onMatchCompleted
}) => {
  // Ensure we have exactly two players, if not fallback
  const p1 = activePlayers[0];
  const p2 = activePlayers[1];

  const s1 = p1 ? (scores[p1.id] || 0) : 0;
  const s2 = p2 ? (scores[p2.id] || 0) : 0;

  // Versus game custom states (not global)
  const [sets, setSets] = useState<SetHistory[]>([]);
  const [setsToWin, setSetsToWin] = useState<number>(2); // Best of 3 (needs 2 sets to win)
  const [pointsToWin, setPointsToWin] = useState<number>(11); // Standard ping pong is 11
  const [serveInterval, setServeInterval] = useState<number>(2); // Swaps server every 2 points
  const [server, setServer] = useState<1 | 2>(1); // Active server: 1 or 2

  if (!p1 || !p2) {
    return (
      <div className="glass-panel animate-fadein" style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3>1v1 Mode Requires 2 Players</h3>
        <p style={{ marginTop: '8px' }}>Please activate exactly two players in the Players tab to play Versus mode.</p>
      </div>
    );
  }

  // Calculate won sets
  const p1SetsWon = sets.filter(s => s.player1 > s.player2).length;
  const p2SetsWon = sets.filter(s => s.player2 > s.player1).length;

  const isMatchOver = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;
  const matchWinner = p1SetsWon >= setsToWin ? p1 : (p2SetsWon >= setsToWin ? p2 : null);

  // Automatic serve calculation
  const totalPoints = s1 + s2;
  const activeServer = (() => {
    // In deuce (both >= pointsToWin - 1), serve rotates every single point
    const isDeuce = s1 >= pointsToWin - 1 && s2 >= pointsToWin - 1;
    const interval = isDeuce ? 1 : serveInterval;
    const rotations = Math.floor(totalPoints / interval);
    
    // Server starts at 1, rotates on each interval
    return (rotations % 2 === 0) ? server : (server === 1 ? 2 : 1);
  })();

  const handlePoint = (playerNum: 1 | 2) => {
    if (isMatchOver) return;

    sound.playDing();
    const targetPlayer = playerNum === 1 ? p1 : p2;
    const currentScore = scores[targetPlayer.id] || 0;
    const nextScore = currentScore + 1;

    // Check set win condition
    const opponentScore = playerNum === 1 ? s2 : s1;
    
    // Standard Win: reached target score AND leading by at least 2 points
    if (nextScore >= pointsToWin && (nextScore - opponentScore) >= 2) {
      sound.playMatchPoint();
      
      const newSet: SetHistory = {
        player1: playerNum === 1 ? nextScore : s1,
        player2: playerNum === 2 ? nextScore : s2
      };

      const nextSets = [...sets, newSet];
      setSets(nextSets);

      // Check if this won the entire match
      const nextP1SetsWon = nextSets.filter(s => s.player1 > s.player2).length;
      const nextP2SetsWon = nextSets.filter(s => s.player2 > s.player1).length;
      
      if (nextP1SetsWon >= setsToWin || nextP2SetsWon >= setsToWin) {
        sound.playWinFanfare();
        sound.speak(`Match over! ${playerNum === 1 ? p1.name : p2.name} won the match!`);
        if (onMatchCompleted) {
          onMatchCompleted(playerNum === 1 ? p1 : p2, nextP1SetsWon, nextP2SetsWon);
        }
      } else {
        sound.speak(`Set completed! ${playerNum === 1 ? p1.name : p2.name} wins the set.`);
      }

      // Reset current point scores
      onUpdateScore(p1.id, 0);
      onUpdateScore(p2.id, 0);
      
      // Winner of set serves first in next set
      setServer(playerNum);
    } else {
      // Normal point increment
      onUpdateScore(targetPlayer.id, nextScore);
      
      // Voice leader check on crucial points
      if (nextScore >= pointsToWin - 2 && nextScore > opponentScore) {
        sound.speak(`${targetPlayer.name} has set point!`);
      }
    }
  };

  const handlePointMinus = (playerNum: 1 | 2, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering pane tap increment
    if (isMatchOver) return;

    const targetPlayer = playerNum === 1 ? p1 : p2;
    const currentScore = scores[targetPlayer.id] || 0;
    
    if (currentScore > 0) {
      sound.playTickDown();
      onUpdateScore(targetPlayer.id, currentScore - 1);
    }
  };

  const handleRestart = () => {
    sound.playUndo();
    if (confirm("Reset current set scores and set history?")) {
      setSets([]);
      onResetScores();
    }
  };

  return (
    <div className="animate-fadein flex flex-col gap-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
      
      {/* Versus Custom Configurations */}
      {!isMatchOver && sets.length === 0 && s1 === 0 && s2 === 0 && (
        <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', fontSize: '12px' }}>
          <div>
            <span style={{ color: 'hsl(var(--text-muted))' }}>PLAY TO: </span>
            <select 
              value={pointsToWin} 
              onChange={(e) => setPointsToWin(Number(e.target.value))}
              style={{ background: 'transparent', color: 'inherit', border: 'none', borderBottom: '1px solid hsl(var(--border-light))', fontWeight: 700, outline: 'none' }}
            >
              <option value="11">11 points</option>
              <option value="21">21 points</option>
              <option value="15">15 points</option>
            </select>
          </div>

          <div>
            <span style={{ color: 'hsl(var(--text-muted))' }}>SERVES: </span>
            <select 
              value={serveInterval} 
              onChange={(e) => setServeInterval(Number(e.target.value))}
              style={{ background: 'transparent', color: 'inherit', border: 'none', borderBottom: '1px solid hsl(var(--border-light))', fontWeight: 700, outline: 'none' }}
            >
              <option value="2">Every 2 pts</option>
              <option value="5">Every 5 pts</option>
              <option value="1">Every point</option>
            </select>
          </div>

          <div>
            <span style={{ color: 'hsl(var(--text-muted))' }}>BEST OF: </span>
            <select 
              value={setsToWin * 2 - 1} 
              onChange={(e) => setSetsToWin(Math.ceil(Number(e.target.value) / 2))}
              style={{ background: 'transparent', color: 'inherit', border: 'none', borderBottom: '1px solid hsl(var(--border-light))', fontWeight: 700, outline: 'none' }}
            >
              <option value="3">3 Sets</option>
              <option value="5">5 Sets</option>
              <option value="1">1 Set</option>
            </select>
          </div>
        </div>
      )}

      {/* Set Score History Ribbon */}
      {(sets.length > 0 || isMatchOver) && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '10px 16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            fontSize: '13px'
          }}
        >
          <span style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>SETS LOG:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {sets.map((set, idx) => (
              <span 
                key={idx} 
                style={{ 
                  background: 'hsl(var(--bg-app) / 0.5)', 
                  padding: '3px 8px', 
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700
                }}
              >
                {set.player1} - {set.player2}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MATCH WINNER SPLASH */}
      {isMatchOver ? (
        <div className="glass-panel animate-scalein" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: '64px' }}>🏆</div>
          <div>
            <h2 style={{ fontSize: '28px' }}>Match Complete</h2>
            <p style={{ fontSize: '18px', color: `hsl(var(${matchWinner?.colorVar}))`, fontWeight: 800, marginTop: '8px' }}>
              {matchWinner?.name} is victorious!
            </p>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginTop: '4px' }}>
              Final score: {p1SetsWon} sets to {p2SetsWon}
            </p>
          </div>

          <button 
            className="btn-premium btn-primary-glow" 
            style={{ width: '80%' }}
            onClick={handleRestart}
          >
            New Versus Match
          </button>
        </div>
      ) : (
        /* DUAL PLAY PANES (Horizontal splitscreen) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          
          {/* Player 1 Active Pane */}
          <div
            className="glass-card animate-scalein"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '20px',
              borderWidth: activeServer === 1 ? '2px' : '1px',
              borderColor: activeServer === 1 ? 'hsl(var(--accent-secondary) / 0.5)' : `hsl(var(${p1.colorVar}) / 0.25)`,
              background: `linear-gradient(180deg, hsl(var(${p1.colorVar}) / 0.05) 0%, hsl(var(--bg-card)) 100%)`,
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => handlePoint(1)}
          >
            {/* Top row server indicator & Name */}
            <div className="flex-row-center" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: 'full', background: `hsl(var(${p1.colorVar}))` }} />
                <span style={{ fontSize: '18px', fontWeight: 800 }}>{p1.name}</span>
              </div>
              
              {activeServer === 1 && (
                <span 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    background: 'hsl(var(--accent-secondary) / 0.2)', 
                    color: 'hsl(var(--accent-secondary))',
                    padding: '3px 8px',
                    borderRadius: '99px',
                    letterSpacing: '0.5px'
                  }}
                >
                  SERVING
                </span>
              )}
            </div>

            {/* Score block */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '72px', fontWeight: 900, lineHeight: 1, color: `hsl(var(${p1.colorVar}))` }}>
                  {s1}
                </span>
                
                {/* Sets check bubble */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  {Array.from({ length: setsToWin }).map((_, idx) => (
                    <Award 
                      key={idx} 
                      size={16} 
                      style={{ 
                        color: idx < p1SetsWon ? 'hsl(var(--accent-warning))' : 'hsl(var(--text-muted) / 0.3)' 
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom minus button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                className="btn-icon-circle"
                style={{ width: '38px', height: '38px' }}
                onClick={(e) => handlePointMinus(1, e)}
              >
                <Minus size={16} />
              </button>
            </div>
          </div>

          {/* Player 2 Active Pane */}
          <div
            className="glass-card animate-scalein"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '20px',
              borderWidth: activeServer === 2 ? '2px' : '1px',
              borderColor: activeServer === 2 ? 'hsl(var(--accent-secondary) / 0.5)' : `hsl(var(${p2.colorVar}) / 0.25)`,
              background: `linear-gradient(180deg, hsl(var(${p2.colorVar}) / 0.05) 0%, hsl(var(--bg-card)) 100%)`,
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => handlePoint(2)}
          >
            {/* Top row server indicator & Name */}
            <div className="flex-row-center" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: 'full', background: `hsl(var(${p2.colorVar}))` }} />
                <span style={{ fontSize: '18px', fontWeight: 800 }}>{p2.name}</span>
              </div>
              
              {activeServer === 2 && (
                <span 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    background: 'hsl(var(--accent-secondary) / 0.2)', 
                    color: 'hsl(var(--accent-secondary))',
                    padding: '3px 8px',
                    borderRadius: '99px',
                    letterSpacing: '0.5px'
                  }}
                >
                  SERVING
                </span>
              )}
            </div>

            {/* Score block */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '72px', fontWeight: 900, lineHeight: 1, color: `hsl(var(${p2.colorVar}))` }}>
                  {s2}
                </span>
                
                {/* Sets check bubble */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  {Array.from({ length: setsToWin }).map((_, idx) => (
                    <Award 
                      key={idx} 
                      size={16} 
                      style={{ 
                        color: idx < p2SetsWon ? 'hsl(var(--accent-warning))' : 'hsl(var(--text-muted) / 0.3)' 
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom minus button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                className="btn-icon-circle"
                style={{ width: '38px', height: '38px' }}
                onClick={(e) => handlePointMinus(2, e)}
              >
                <Minus size={16} />
              </button>
            </div>
          </div>

          {/* Quick HUD resets */}
          <div className="glass-panel flex-row-center" style={{ padding: '8px 16px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
              PLAYING TO {pointsToWin} PTS. DEUCE ADVANTAGE ENABLED.
            </span>
            
            <button
              className="btn-premium"
              style={{ padding: '6px', color: 'hsl(var(--text-muted))' }}
              onClick={handleRestart}
            >
              <RotateCcw size={14} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
