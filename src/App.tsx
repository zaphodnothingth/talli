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
  
  // Undo/Redo State stack
  const [undoStack, setUndoStack] = useState<GameStateSnapshot[]>([]);

  // Preferences State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isSpeechOn, setIsSpeechOn] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);

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

  // Round-based game actions
  const handleAddRound = (roundScores: Record<string, number>) => {
    pushToUndoStack(scores, rounds);
    const newRound = {
      id: rounds.length + 1,
      scores: roundScores
    };

    const nextRounds = [...rounds, newRound];
    setRounds(nextRounds);

    // Check game over win conditions
    const totals: Record<string, number> = {};
    activePlayerIds.forEach(id => { totals[id] = 0; });
    nextRounds.forEach(r => {
      activePlayerIds.forEach(id => {
        totals[id] += r.scores[id] || 0;
      });
    });

    // Find if anyone exceeded target limit
    const exceededPlayers = activePlayers.filter(p => (totals[p.id] || 0) >= targetScore);
    
    if (exceededPlayers.length > 0) {
      // Find absolute winner (lowest or highest? Standard in Hearts/Uno is lowest score wins when someone hits limit. Let's make it standard card game rule: lowest score wins!)
      let absoluteWinner = activePlayers[0];
      let minVal = totals[absoluteWinner.id] || 0;

      activePlayers.forEach(p => {
        const val = totals[p.id] || 0;
        if (val < minVal) {
          minVal = val;
          absoluteWinner = p;
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
    }
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
      sound.speak("Talli: Text-to-speech enabled!");
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
  const exceededCount = activePlayers.filter(p => (totals[p.id] || 0) >= targetScore).length;
  const isGameOver = rounds.length > 0 && exceededCount > 0;
  
  const getWinner = () => {
    if (!isGameOver) return null;
    let winner = activePlayers[0];
    let minScore = totals[winner.id] || 0;
    activePlayers.forEach(p => {
      if ((totals[p.id] || 0) < minScore) {
        minScore = totals[p.id] || 0;
        winner = p;
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
            onSetTargetScore={setTargetScore}
          />
        )}

        {activeTab === 'versus' && (
          <VersusGame
            activePlayers={activePlayers}
            scores={scores}
            onUpdateScore={handleUpdateScore}
            onResetScores={handleResetScores}
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
            gameMode={rounds.length > 0 ? 'round' : 'tally'}
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

    </div>
  );
}

export default App;
