import { useState, useEffect } from 'react';
import { 
  Hash, 
  RotateCcw, 
  TrendingUp, 
  Users, 
  Sliders, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Download, 
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { PlayerManager } from './components/PlayerManager';
import type { Player } from './components/PlayerManager';
import { QuickCounter } from './components/QuickCounter';
import { RoundBasedGame } from './components/RoundBasedGame';
import { VersusGame } from './components/VersusGame';
import { AnalyticsPane } from './components/AnalyticsPane';
import { sound } from './utils/SoundManager';
import './App.css';

interface GameStateSnapshot {
  scores: Record<string, number>;
  rounds: any[];
}

export interface GamePreset {
  id: string;
  name: string;
  mode: 'counters' | 'rounds' | 'versus';
  targetScore: number; // 0 for no limit
  winCondition: 'highest' | 'lowest';
  allowNegative?: boolean;
}

export interface MatchSummary {
  id: string;
  date: string;
  presetName: string;
  targetScore: number;
  winnerId: string;
  winnerName: string;
  players: Array<{ name: string; score: number; colorVar: string }>;
}

const DEFAULT_PRESETS: GamePreset[] = [
  { id: 'tally', name: 'Classic Tally', mode: 'counters', targetScore: 0, winCondition: 'highest' },
  { id: 'nertz', name: 'Nertz', mode: 'rounds', targetScore: 100, winCondition: 'highest' },
  { id: 'hearts', name: 'Hearts', mode: 'rounds', targetScore: 100, winCondition: 'lowest' },
  { id: 'scrabble', name: 'Scrabble', mode: 'rounds', targetScore: 0, winCondition: 'highest' },
  { id: 'golf', name: 'Golf (Cards)', mode: 'rounds', targetScore: 50, winCondition: 'lowest' },
  { id: 'pingpong', name: 'Ping Pong', mode: 'versus', targetScore: 11, winCondition: 'highest' }
];

function App() {
  // Screens / Tab Routing
  const [activeTab, setActiveTab] = useState<'counters' | 'rounds' | 'versus' | 'players' | 'analytics'>('players');

  // Base State
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIds, setActivePlayerIds] = useState<string[]>([]);
  
  // Game Play State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [rounds, setRounds] = useState<any[]>([]);
  const [targetScore, setTargetScore] = useState<number>(100);

  // Preset States
  const [presets, setPresets] = useState<GamePreset[]>(DEFAULT_PRESETS);
  const [activePreset, setActivePreset] = useState<GamePreset>(DEFAULT_PRESETS[1]); // Default to Nertz
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);

  // Custom Preset Form States
  const [customName, setCustomName] = useState<string>('');
  const [customMode, setCustomMode] = useState<'counters' | 'rounds' | 'versus'>('rounds');
  const [customTarget, setCustomTarget] = useState<number>(100);
  const [customWinCond, setCustomWinCond] = useState<'highest' | 'lowest'>('highest');
  
  // Undo/Redo State stack
  const [undoStack, setUndoStack] = useState<GameStateSnapshot[]>([]);

  // Match History Logs
  const [matchHistory, setMatchHistory] = useState<MatchSummary[]>([]);

  // Preferences State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isSpeechOn, setIsSpeechOn] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your entire match history? This will delete all past match logs permanently, but won't change your current players' lifetime statistics.")) {
      setMatchHistory([]);
      localStorage.removeItem('talli_match_history');
      sound.playUndo();
    }
  };

  // Initialize data from LocalStorage
  useEffect(() => {
    const savedPlayers = localStorage.getItem('talli_players');
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    } else {
      // Mock initial players for demonstration
      const initial: Player[] = [
        { id: '1', name: 'Steven', colorVar: '--player-1', gamesPlayed: 8, gamesWon: 4, avgScore: 125, maxScore: 210 },
        { id: '2', name: 'Alex', colorVar: '--player-2', gamesPlayed: 6, gamesWon: 2, avgScore: 98, maxScore: 185 }
      ];
      setPlayers(initial);
      localStorage.setItem('talli_players', JSON.stringify(initial));
    }

    const savedActive = localStorage.getItem('talli_active_players');
    if (savedActive) {
      setActivePlayerIds(JSON.parse(savedActive));
    } else {
      setActivePlayerIds(['1', '2']);
    }

    const savedPresets = localStorage.getItem('talli_presets');
    let loadedPresets = DEFAULT_PRESETS;
    if (savedPresets) {
      try {
        loadedPresets = JSON.parse(savedPresets);
        setPresets(loadedPresets);
      } catch (e) {
        console.error(e);
      }
    }

    const savedActivePreset = localStorage.getItem('talli_active_preset');
    if (savedActivePreset) {
      try {
        const parsed = JSON.parse(savedActivePreset) as GamePreset;
        setActivePreset(parsed);
        setTargetScore(parsed.targetScore);
        setActiveTab(parsed.mode);
      } catch (e) {
        console.error(e);
      }
    } else {
      const nertzPreset = loadedPresets.find(p => p.id === 'nertz') || loadedPresets[1];
      setActivePreset(nertzPreset);
      setTargetScore(nertzPreset.targetScore);
      setActiveTab(nertzPreset.mode);
    }

    const savedTheme = localStorage.getItem('talli_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkTheme = savedTheme !== null ? savedTheme === 'dark' : systemPrefersDark;
    setIsDarkMode(darkTheme);
    if (!darkTheme) {
      document.body.classList.add('light-theme');
    }

    // Audio states init
    setIsSoundOn(sound.getSoundEnabled());
    setIsSpeechOn(sound.getSpeechEnabled());

    // Match history logs init
    const savedHistory = localStorage.getItem('talli_match_history');
    if (savedHistory) {
      try {
        setMatchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }

    // Listen for PWA installer prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  // Save players to storage
  const savePlayersToStorage = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    localStorage.setItem('talli_players', JSON.stringify(updatedPlayers));
  };

  // Add a snapshot of current game to undo stack
  const pushToUndoStack = (currentScores: Record<string, number>, currentRounds: any[]) => {
    setUndoStack(prev => [...prev, { scores: { ...currentScores }, rounds: [...currentRounds] }]);
  };

  // Trigger undo last action
  const handleGlobalUndo = () => {
    if (undoStack.length === 0) return;

    sound.playUndo();
    const prevStack = [...undoStack];
    const lastSnapshot = prevStack.pop();

    if (lastSnapshot) {
      setScores(lastSnapshot.scores);
      setRounds(lastSnapshot.rounds);
      setUndoStack(prevStack);
    }
  };

  // Player Manager Actions
  const handleAddPlayer = (name: string, colorVar: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      colorVar,
      gamesPlayed: 0,
      gamesWon: 0,
      avgScore: 0,
      maxScore: 0
    };
    const updated = [...players, newPlayer];
    savePlayersToStorage(updated);
    // Auto-active new player
    const nextActive = [...activePlayerIds, newPlayer.id];
    setActivePlayerIds(nextActive);
    localStorage.setItem('talli_active_players', JSON.stringify(nextActive));
  };

  const handleDeletePlayer = (id: string) => {
    if (confirm("Are you sure you want to delete this player from the directory? All historical stats will be lost.")) {
      const updated = players.filter(p => p.id !== id);
      savePlayersToStorage(updated);
      
      const nextActive = activePlayerIds.filter(activeId => activeId !== id);
      setActivePlayerIds(nextActive);
      localStorage.setItem('talli_active_players', JSON.stringify(nextActive));
    }
  };

  const handleToggleActivePlayer = (id: string) => {
    const isCurrentlyActive = activePlayerIds.includes(id);
    let nextActive: string[];
    if (isCurrentlyActive) {
      nextActive = activePlayerIds.filter(activeId => activeId !== id);
    } else {
      nextActive = [...activePlayerIds, id];
    }
    setActivePlayerIds(nextActive);
    localStorage.setItem('talli_active_players', JSON.stringify(nextActive));
  };

  // Score management actions
  const handleUpdateScore = (playerId: string, newScore: number) => {
    pushToUndoStack(scores, rounds);
    setScores(prev => ({
      ...prev,
      [playerId]: newScore
    }));
  };

  const handleResetScores = () => {
    pushToUndoStack(scores, rounds);
    const reset: Record<string, number> = {};
    activePlayerIds.forEach(id => {
      reset[id] = 0;
    });
    setScores(reset);
  };

  // Game rules presets actions
  const handleSelectPreset = (preset: GamePreset) => {
    sound.playDing();
    setActivePreset(preset);
    localStorage.setItem('talli_active_preset', JSON.stringify(preset));
    
    // Switch to appropriate tab
    setActiveTab(preset.mode);
    
    // Set target score in the app
    setTargetScore(preset.targetScore);
    
    // Reset/Setup game scores
    if (rounds.length > 0 || Object.keys(scores).some(k => scores[k] > 0)) {
      if (confirm(`Switch to '${preset.name}' and reset current scores?`)) {
        setRounds([]);
        const reset: Record<string, number> = {};
        activePlayerIds.forEach(id => {
          reset[id] = 0;
        });
        setScores(reset);
      }
    } else {
      // Clear history cleanly without prompt since it is empty
      setRounds([]);
      const reset: Record<string, number> = {};
      activePlayerIds.forEach(id => {
        reset[id] = 0;
      });
      setScores(reset);
    }
  };

  const handleCreatePreset = (name: string, mode: 'counters' | 'rounds' | 'versus', target: number, winCond: 'highest' | 'lowest') => {
    const newPreset: GamePreset = {
      id: 'custom-' + Date.now().toString(),
      name,
      mode,
      targetScore: target,
      winCondition: winCond
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('talli_presets', JSON.stringify(updatedPresets));
    
    handleSelectPreset(newPreset);
    setShowPresetModal(false);
  };

  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent choosing it
    if (confirm("Delete this custom game ruleset?")) {
      sound.playUndo();
      const updated = presets.filter(p => p.id !== presetId);
      setPresets(updated);
      localStorage.setItem('talli_presets', JSON.stringify(updated));
      
      if (activePreset.id === presetId) {
        handleSelectPreset(presets[0]);
      }
    }
  };

  const handleSetTargetScore = (newTarget: number) => {
    setTargetScore(newTarget);
    const updatedPreset = { ...activePreset, targetScore: newTarget };
    setActivePreset(updatedPreset);
    localStorage.setItem('talli_active_preset', JSON.stringify(updatedPreset));
  };

  // Round-based game actions
  const handleAddRound = (roundScores: Record<string, number>) => {
    pushToUndoStack(scores, rounds);
    const newRound = {
      id: rounds.length + 1,
      scores: roundScores
    };

    const nextRounds = [...rounds, newRound];
    setRounds(nextRounds);

    // Calculate dynamic standings totals
    const totals: Record<string, number> = {};
    activePlayerIds.forEach(id => { totals[id] = 0; });
    nextRounds.forEach(r => {
      activePlayerIds.forEach(id => {
        totals[id] += r.scores[id] || 0;
      });
    });

    // Check game over win conditions (only if targetScore is set > 0)
    if (targetScore > 0) {
      const exceededPlayers = activePlayers.filter(p => (totals[p.id] || 0) >= targetScore);
      
      if (exceededPlayers.length > 0) {
        // Find absolute winner (lowest or highest based on preset!)
        let absoluteWinner = activePlayers[0];
        let winningVal = totals[absoluteWinner.id] || 0;

        activePlayers.forEach(p => {
          const val = totals[p.id] || 0;
          if (activePreset.winCondition === 'highest') {
            if (val > winningVal) {
              winningVal = val;
              absoluteWinner = p;
            }
          } else {
            if (val < winningVal) {
              winningVal = val;
              absoluteWinner = p;
            }
          }
        });

        // Celebrate!
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.65 }
          });
          sound.playWinFanfare();
          
          if (isSpeechOn) {
            sound.speak(`${absoluteWinner.name} wins the game of ${activePreset.name} with ${winningVal} points!`);
          }
        }, 300);

        // Save stats to historical records
        const updatedPlayers = players.map(p => {
          const isActive = activePlayerIds.includes(p.id);
          if (!isActive) return p;

          const isWinner = p.id === absoluteWinner.id;
          const gameScore = totals[p.id] || 0;
          const nextPlayed = p.gamesPlayed + 1;
          const nextWon = p.gamesWon + (isWinner ? 1 : 0);
          const nextMax = Math.max(p.maxScore, gameScore);
          const nextAvg = (p.avgScore * p.gamesPlayed + gameScore) / nextPlayed;

          return {
            ...p,
            gamesPlayed: nextPlayed,
            gamesWon: nextWon,
            maxScore: nextMax,
            avgScore: nextAvg
          };
        });

        savePlayersToStorage(updatedPlayers);

        // Compile match history record
        const newMatch: MatchSummary = {
          id: `match_${Date.now()}`,
          date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          presetName: activePreset.name,
          targetScore: targetScore,
          winnerId: absoluteWinner.id,
          winnerName: absoluteWinner.name,
          players: activePlayers.map(p => ({
            name: p.name,
            score: totals[p.id] || 0,
            colorVar: p.colorVar
          }))
        };
        setMatchHistory(prev => {
          const nextHistory = [newMatch, ...prev];
          localStorage.setItem('talli_match_history', JSON.stringify(nextHistory));
          return nextHistory;
        });
      }
    }
  };

  const handleVersusMatchCompleted = (winnerPlayer: Player, p1Sets: number, p2Sets: number) => {
    const p1 = activePlayers[0];
    const p2 = activePlayers[1];
    if (!p1 || !p2) return;

    const newMatch: MatchSummary = {
      id: `match_${Date.now()}`,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      presetName: activePreset.name,
      targetScore: activePreset.targetScore || 0,
      winnerId: winnerPlayer.id,
      winnerName: winnerPlayer.name,
      players: [
        { name: p1.name, score: p1Sets, colorVar: p1.colorVar },
        { name: p2.name, score: p2Sets, colorVar: p2.colorVar }
      ]
    };

    setMatchHistory(prev => {
      const nextHistory = [newMatch, ...prev];
      localStorage.setItem('talli_match_history', JSON.stringify(nextHistory));
      return nextHistory;
    });

    // Save stats to historical records for players
    const updatedPlayers = players.map(p => {
      const isActive = activePlayerIds.includes(p.id);
      if (!isActive) return p;

      const isWinner = p.id === winnerPlayer.id;
      const gameScore = p.id === p1.id ? p1Sets : p2Sets;
      const nextPlayed = p.gamesPlayed + 1;
      const nextWon = p.gamesWon + (isWinner ? 1 : 0);
      const nextMax = Math.max(p.maxScore, gameScore);
      const nextAvg = (p.avgScore * p.gamesPlayed + gameScore) / nextPlayed;

      return {
        ...p,
        gamesPlayed: nextPlayed,
        gamesWon: nextWon,
        maxScore: nextMax,
        avgScore: nextAvg
      };
    });

    savePlayersToStorage(updatedPlayers);
  };

  const handleDeleteLastRound = () => {
    if (rounds.length > 0) {
      pushToUndoStack(scores, rounds);
      setRounds(prev => prev.slice(0, -1));
    }
  };

  const handleResetGame = () => {
    pushToUndoStack(scores, rounds);
    setRounds([]);
  };

  // Preference Toggles
  const handleToggleTheme = () => {
    sound.playTick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem('talli_theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  };

  const handleToggleSound = () => {
    const nextVal = !isSoundOn;
    setIsSoundOn(nextVal);
    sound.setSoundEnabled(nextVal);
    sound.playTick();
  };

  const handleToggleSpeech = () => {
    const nextVal = !isSpeechOn;
    setIsSpeechOn(nextVal);
    sound.setSpeechEnabled(nextVal);
    sound.playTick();
    if (nextVal) {
      sound.speak("Talli score announcer active!");
    }
  };

  // PWA Install Click Handler
  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    sound.playDing();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Get active player objects
  const activePlayers = players.filter(p => activePlayerIds.includes(p.id));

  // Determine game over state
  const getTotals = () => {
    const totals: Record<string, number> = {};
    activePlayers.forEach(p => { totals[p.id] = 0; });
    rounds.forEach(r => {
      activePlayers.forEach(p => {
        totals[p.id] += r.scores[p.id] || 0;
      });
    });
    return totals;
  };
  const totals = getTotals();
  const exceededCount = targetScore > 0 
    ? activePlayers.filter(p => (totals[p.id] || 0) >= targetScore).length
    : 0;
  const isGameOver = rounds.length > 0 && targetScore > 0 && exceededCount > 0;
  
  const getWinner = () => {
    if (!isGameOver) return null;
    let winner = activePlayers[0];
    let winningScore = totals[winner.id] || 0;
    
    activePlayers.forEach(p => {
      const score = totals[p.id] || 0;
      if (activePreset.winCondition === 'highest') {
        if (score > winningScore) {
          winningScore = score;
          winner = p;
        }
      } else {
        if (score < winningScore) {
          winningScore = score;
          winner = p;
        }
      }
    });
    return winner;
  };
  const winner = getWinner();

  return (
    <div className="app-container">
      
      {/* HEADER SECTION */}
      <header className="app-header glass-panel" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderRadius: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              color: '#fff',
              boxShadow: '0 2px 8px hsl(var(--accent-primary) / 0.4)'
            }}
          >
            T
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Talli</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Game Rules Preset Selector */}
          <button
            className="btn-premium btn-primary-glow"
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              borderRadius: '10px'
            }}
            onClick={() => {
              sound.playTick();
              setShowPresetModal(true);
            }}
            title="Switch Game Rules"
          >
            🎮 {activePreset.name}
          </button>

          {/* Undo Global */}
          {undoStack.length > 0 && (
            <button 
              className="btn-premium"
              style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700 }}
              onClick={handleGlobalUndo}
              title="Undo Action"
            >
              Undo
            </button>
          )}

          {/* Quick Settings Icon */}
          <button 
            className="btn-premium" 
            style={{ padding: '8px' }}
            onClick={() => {
              sound.playTick();
              setShowSettingsModal(true);
            }}
          >
            <Sliders size={16} />
          </button>
        </div>
      </header>

      {/* PWA In-App Install Ribbon */}
      {showInstallBtn && (
        <div 
          className="animate-slideup"
          style={{ 
            background: 'linear-gradient(90deg, hsl(var(--accent-primary) / 0.15) 0%, hsl(var(--accent-secondary) / 0.15) 100%)', 
            padding: '10px 16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'between',
            borderBottom: '1px solid hsl(var(--border-light))',
            fontSize: '13px'
          }}
        >
          <span style={{ flex: 1, fontWeight: 600 }}>Install Talli for an offline-optimized fullscreen experience!</span>
          <button 
            className="btn-premium btn-primary-glow"
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
            onClick={handlePwaInstall}
          >
            <Download size={14} /> Install
          </button>
        </div>
      )}

      {/* MAIN VIEW CONTROLLER */}
      <main className="app-content">
        
        {activeTab === 'counters' && (
          <QuickCounter
            activePlayers={activePlayers}
            scores={scores}
            onUpdateScore={handleUpdateScore}
            onResetScores={handleResetScores}
          />
        )}

        {activeTab === 'rounds' && (
          <RoundBasedGame
            activePlayers={activePlayers}
            rounds={rounds}
            targetScore={targetScore}
            isGameOver={isGameOver}
            winner={winner}
            onAddRound={handleAddRound}
            onDeleteLastRound={handleDeleteLastRound}
            onResetGame={handleResetGame}
            onSetTargetScore={handleSetTargetScore}
          />
        )}

        {activeTab === 'versus' && (
          <VersusGame
            activePlayers={activePlayers}
            scores={scores}
            onUpdateScore={handleUpdateScore}
            onResetScores={handleResetScores}
            onMatchCompleted={handleVersusMatchCompleted}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManager
            players={players}
            activePlayerIds={activePlayerIds}
            onAddPlayer={handleAddPlayer}
            onDeletePlayer={handleDeletePlayer}
            onToggleActivePlayer={handleToggleActivePlayer}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPane
            activePlayers={activePlayers}
            rounds={rounds}
            scores={scores}
            gameMode={rounds.length > 0 ? 'round' : (activePreset.mode === 'versus' ? 'versus' : 'tally')}
            matchHistory={matchHistory}
            onClearHistory={handleClearHistory}
          />
        )}

      </main>

      {/* TAB FOOTER NAVIGATION BAR */}
      <nav 
        className="glass-panel" 
        style={{ 
          height: '68px', 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center', 
          borderRadius: 0, 
          borderLeft: 'none', 
          borderRight: 'none',
          borderBottom: 'none',
          paddingBottom: 'var(--safe-bottom)'
        }}
      >
        <button
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'players' ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'color 0.2s'
          }}
          onClick={() => {
            sound.playTick();
            setActiveTab('players');
          }}
        >
          <Users size={20} />
          <span>Players</span>
        </button>

        <button
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'counters' ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'color 0.2s'
          }}
          onClick={() => {
            sound.playTick();
            setActiveTab('counters');
          }}
        >
          <Hash size={20} />
          <span>Tally</span>
        </button>

        <button
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'rounds' ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'color 0.2s'
          }}
          onClick={() => {
            sound.playTick();
            setActiveTab('rounds');
          }}
        >
          <RotateCcw size={20} />
          <span>Rounds</span>
        </button>

        <button
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'versus' ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'color 0.2s'
          }}
          onClick={() => {
            sound.playTick();
            setActiveTab('versus');
          }}
        >
          <ChevronRight size={20} style={{ transform: 'rotate(-45deg)' }} />
          <span>Versus</span>
        </button>

        <button
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'analytics' ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'color 0.2s'
          }}
          onClick={() => {
            sound.playTick();
            setActiveTab('analytics');
          }}
        >
          <TrendingUp size={20} />
          <span>Stats</span>
        </button>
      </nav>

      {/* QUICK SETTINGS SHEET */}
      {showSettingsModal && (
        <div className="action-sheet-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="action-sheet animate-slideup" onClick={(e) => e.stopPropagation()}>
            <div className="flex-row-center">
              <h2>Preferences</h2>
              <button 
                className="btn-premium" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setShowSettingsModal(false)}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Dark mode */}
              <div className="flex-row-center" style={{ padding: '8px 0', borderBottom: '1px solid hsl(var(--border-light))' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '15px' }}>Visual Theme</strong>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Toggle Dark & Light modes</span>
                </div>
                <button className="btn-premium" onClick={handleToggleTheme} style={{ padding: '8px 16px' }}>
                  {isDarkMode ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Moon size={16} /> Dark</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sun size={16} /> Light</span>
                  )}
                </button>
              </div>

              {/* Sound synth */}
              <div className="flex-row-center" style={{ padding: '8px 0', borderBottom: '1px solid hsl(var(--border-light))' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '15px' }}>Sound Effects</strong>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Satisfying beeps and success fanfares</span>
                </div>
                <button className="btn-premium" onClick={handleToggleSound} style={{ padding: '8px' }}>
                  {isSoundOn ? <Volume2 size={18} style={{ color: 'hsl(var(--accent-secondary))' }} /> : <VolumeX size={18} />}
                </button>
              </div>

              {/* Text-To-Speech speech */}
              <div className="flex-row-center" style={{ padding: '8px 0', borderBottom: '1px solid hsl(var(--border-light))' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '15px' }}>TTS Score Reader</strong>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Announce scores aloud in game</span>
                </div>
                <button className="btn-premium" onClick={handleToggleSpeech} style={{ padding: '8px 16px' }}>
                  {isSpeechOn ? (
                    <span style={{ color: 'hsl(var(--accent-success))', fontWeight: 700 }}>Active</span>
                  ) : (
                    <span>Muted</span>
                  )}
                </button>
              </div>

              {/* About section */}
              <div style={{ background: 'hsl(var(--bg-app) / 0.4)', padding: '12px', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                <Info size={18} style={{ color: 'hsl(var(--accent-primary))', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                  <strong>Talli Scorekeeper v1.0.0</strong><br />
                  A premium, 100% offline-functional scoring app. Created with React, TypeScript, and HTML5 Web Audio synth engines. Compatible with iOS and Android home-screen frameworks.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME PRESET SELECTION & CREATION MODAL */}
      {showPresetModal && (
        <div className="action-sheet-overlay" onClick={() => setShowPresetModal(false)}>
          <div 
            className="action-sheet animate-slideup" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="flex-row-center">
              <h2>Select Game Rules</h2>
              <button 
                className="btn-premium" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setShowPresetModal(false)}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              
              {/* Presets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', letterSpacing: '0.5px' }}>GAME PRESETS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {presets.map((preset) => {
                    const isActive = activePreset.id === preset.id;
                    const isCustom = preset.id.startsWith('custom-');
                    return (
                      <div 
                        key={preset.id}
                        onClick={() => {
                          handleSelectPreset(preset);
                          setShowPresetModal(false);
                        }}
                        className={`glass-card ${isActive ? 'btn-primary-glow' : ''}`}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          border: isActive ? '1px solid hsl(var(--accent-primary))' : '1px solid hsl(var(--border-light))',
                          background: isActive ? 'hsl(var(--accent-primary) / 0.1)' : 'hsl(var(--bg-app) / 0.3)',
                          position: 'relative'
                        }}
                      >
                        {isCustom && (
                          <button
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: 'hsl(var(--accent-danger))',
                              fontSize: '18px',
                              cursor: 'pointer',
                              padding: '0 6px',
                              fontWeight: 'bold',
                              zIndex: 10
                            }}
                            title="Delete Preset"
                          >
                            ×
                          </button>
                        )}
                        <strong style={{ fontSize: '14px', color: isActive ? 'hsl(var(--accent-primary))' : 'inherit' }}>
                          {preset.name}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>
                          Type: {preset.mode === 'counters' ? 'Tally' : preset.mode === 'rounds' ? 'Rounds' : 'Versus'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                          {preset.targetScore > 0 ? `Target: ${preset.targetScore} pts` : 'No Limit'} • {preset.winCondition === 'highest' ? 'High Wins' : 'Low Wins'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create Custom Preset Form */}
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '16px', 
                  background: 'hsl(var(--bg-app) / 0.3)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px' 
                }}
              >
                <h3 style={{ fontSize: '13px', color: 'hsl(var(--accent-primary))', letterSpacing: '0.5px' }}>CREATE CUSTOM GAME RULES</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Game Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nertz to 100, Rummy"
                    className="input-premium"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{ padding: '10px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Scoring Screen</label>
                    <select
                      className="input-premium"
                      value={customMode}
                      onChange={(e) => setCustomMode(e.target.value as any)}
                      style={{ padding: '10px', height: '42px', background: 'hsl(var(--bg-app))', color: 'inherit' }}
                    >
                      <option value="rounds">Round-Based</option>
                      <option value="counters">Quick Counters</option>
                      <option value="versus">1v1 Split Versus</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Target Score Limit</label>
                    <input
                      type="number"
                      min="0"
                      className="input-premium"
                      value={customTarget}
                      onChange={(e) => setCustomTarget(Math.max(0, parseInt(e.target.value) || 0))}
                      style={{ padding: '10px', height: '42px' }}
                      title="0 means no score limit"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Win Rule</label>
                  <select
                    className="input-premium"
                    value={customWinCond}
                    onChange={(e) => setCustomWinCond(e.target.value as any)}
                    style={{ padding: '10px', height: '42px', background: 'hsl(var(--bg-app))', color: 'inherit' }}
                  >
                    <option value="highest">Highest Score Wins</option>
                    <option value="lowest">Lowest Score Wins (e.g. Golf, Hearts)</option>
                  </select>
                </div>

                <button
                  className="btn-premium btn-primary-glow"
                  style={{ padding: '12px', marginTop: '4px' }}
                  onClick={() => {
                    if (!customName.trim()) {
                      alert("Please enter a game name.");
                      return;
                    }
                    handleCreatePreset(customName, customMode, customTarget, customWinCond);
                    // clear form
                    setCustomName('');
                  }}
                >
                  Create & Start Playing!
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
