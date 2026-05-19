import React, { useState } from 'react';
import { Plus, Trash2, Award, Hash, Check, Users } from 'lucide-react';
import { sound } from '../utils/SoundManager';

export interface Player {
  id: string;
  name: string;
  colorVar: string; // e.g. '--player-1'
  gamesPlayed: number;
  gamesWon: number;
  avgScore: number;
  maxScore: number;
}

interface PlayerManagerProps {
  players: Player[];
  activePlayerIds: string[];
  onAddPlayer: (name: string, colorVar: string) => void;
  onDeletePlayer: (id: string) => void;
  onToggleActivePlayer: (id: string) => void;
}

// Curated colors matches the CSS tokens
const COLOR_PRESETS = [
  { var: '--player-1', label: 'Crimson' },
  { var: '--player-2', label: 'Sky Blue' },
  { var: '--player-3', label: 'Emerald' },
  { var: '--player-4', label: 'Gold' },
  { var: '--player-5', label: 'Violet' },
  { var: '--player-6', label: 'Flame' },
  { var: '--player-7', label: 'Ocean' },
  { var: '--player-8', label: 'Magenta' }
];

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  activePlayerIds,
  onAddPlayer,
  onDeletePlayer,
  onToggleActivePlayer
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('--player-1');
  const [showStatsId, setShowStatsId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    sound.playDing();
    onAddPlayer(newPlayerName.trim(), selectedColor);
    setNewPlayerName('');
    // Auto-select next color preset
    const currentIndex = COLOR_PRESETS.findIndex(c => c.var === selectedColor);
    const nextIndex = (currentIndex + 1) % COLOR_PRESETS.length;
    setSelectedColor(COLOR_PRESETS[nextIndex].var);
  };

  return (
    <div className="animate-fadein flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Create Player Panel */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} style={{ color: 'hsl(var(--accent-primary))' }} />
          Create New Player
        </h3>
        
        <input
          type="text"
          placeholder="Enter player name..."
          className="input-premium"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value.slice(0, 16))}
          maxLength={16}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>SELECT COLOR THEME</span>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.var}
                type="button"
                className="btn-premium"
                style={{
                  height: '42px',
                  padding: 0,
                  borderWidth: selectedColor === color.var ? '2px' : '1px',
                  borderColor: selectedColor === color.var ? 'hsl(var(--text-primary))' : 'hsl(var(--border-light))',
                  background: `hsl(var(${color.var}))`,
                  boxShadow: selectedColor === color.var ? `0 0 10px hsl(var(${color.var}) / 0.5)` : 'none'
                }}
                onClick={() => {
                  sound.playTick();
                  setSelectedColor(color.var);
                }}
              >
                {selectedColor === color.var && <Check size={18} style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-premium btn-primary-glow" style={{ width: '100%' }}>
          <Plus size={18} /> Add Player
        </button>
      </form>

      {/* Players List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', fontWeight: 700, letterSpacing: '0.5px' }}>
          PLAYERS DIRECTORY ({players.length})
        </h3>
        
        {players.length === 0 ? (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            No players created yet. Add players above to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {players.map((player) => {
              const isActive = activePlayerIds.includes(player.id);
              const isShowingStats = showStatsId === player.id;

              return (
                <div 
                  key={player.id} 
                  className="glass-card animate-scalein"
                  style={{ 
                    padding: '16px',
                    borderColor: isActive ? `hsl(var(${player.colorVar}) / 0.5)` : 'hsl(var(--border-light))',
                    boxShadow: isActive ? `0 4px 15px hsl(var(${player.colorVar}) / 0.1)` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Left details */}
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                      onClick={() => {
                        sound.playTick();
                        setShowStatsId(isShowingStats ? null : player.id);
                      }}
                    >
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '12px', 
                          background: `hsl(var(${player.colorVar}))`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '16px',
                          color: '#fff',
                          boxShadow: `0 4px 10px hsl(var(${player.colorVar}) / 0.3)`
                        }}
                      >
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{player.name}</span>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                          {isShowingStats ? 'Tap to hide stats' : 'Tap to view stats'}
                        </span>
                      </div>
                    </div>

                    {/* Roster Toggle and Trash */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        className="btn-premium"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: '8px',
                          borderColor: isActive ? `hsl(var(${player.colorVar}) / 0.4)` : 'hsl(var(--border-light))',
                          background: isActive ? `hsl(var(${player.colorVar}) / 0.15)` : 'transparent',
                          color: isActive ? `hsl(var(${player.colorVar}))` : 'hsl(var(--text-secondary))',
                          fontWeight: 700
                        }}
                        onClick={() => {
                          sound.playTick();
                          onToggleActivePlayer(player.id);
                        }}
                      >
                        {isActive ? 'Active' : 'Bench'}
                      </button>

                      <button
                        className="btn-premium"
                        style={{ padding: '8px', borderColor: 'transparent', color: 'hsl(var(--accent-danger))' }}
                        onClick={() => {
                          sound.playUndo();
                          onDeletePlayer(player.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Player Stats */}
                  {isShowingStats && (
                    <div 
                      className="animate-slideup"
                      style={{ 
                        marginTop: '15px', 
                        paddingTop: '15px', 
                        borderTop: '1px solid hsl(var(--border-light))',
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '12px' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Hash size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>PLAYED</span>
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>{player.gamesPlayed} games</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={14} style={{ color: 'hsl(var(--accent-warning))' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>WINS</span>
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>{player.gamesWon} ({player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0}%)</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'hsl(var(--accent-secondary))', fontWeight: 800 }}>avg</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>AVG SCORE</span>
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>{Math.round(player.avgScore)} pts</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'hsl(var(--accent-success))', fontWeight: 800 }}>max</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>HIGHEST RECORD</span>
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>{player.maxScore} pts</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
