import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Coins, Users, ThumbsUp, ThumbsDown, ArrowRight, RotateCcw, Plus, X, UserPlus, Beer, BookOpen } from 'lucide-react';

// --- Types ---

type Player = {
  id: string;
  name: string;
  penalties: number;
};

type GamePhase = 'WELCOME' | 'SETUP' | 'TURN_START' | 'ROLLING' | 'REVEAL' | 'VOTING' | 'RESULT';

type CoinSide = 'HEAD' | 'TAIL';
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

type TurnData = {
  coin: CoinSide | null;
  dice: DiceValue | null;
  ayes: number;
  nays: number;
  forfeitType?: 'DRINK' | 'SECRET';
};

const DEGREES: Record<DiceValue, string> = {
  1: "Closest (best friend, sibling, daily person)",
  2: "Tight circle (core friends/family weekly)",
  3: "Regular circle (good friends, work crew)",
  4: "Loose associates (gym, neighbours, old classmates)",
  5: "Distant network (online, mutuals)",
  6: "Public/Celebrity (influencers, famous people)",
};

// --- Components ---

function Button({ onClick, children, className = '', variant = 'primary', disabled = false }: any) {
  const baseStyle = "px-6 py-3 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-[#FFD700] text-[#3E2723] hover:bg-[#FFC107]",
    secondary: "bg-[#3E2723] text-[#FFD700] border-2 border-[#FFD700] hover:bg-[#2c1b17]",
    danger: "bg-[#8B0000] text-white hover:bg-[#a00000]",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    ghost: "bg-transparent text-[#F5F5DC] hover:bg-white/10",
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = '' }: any) {
  return (
    <div className={`bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#FFD700]/20 rounded-2xl p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('WELCOME');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [turnData, setTurnData] = useState<TurnData>({ coin: null, dice: null, ayes: 0, nays: 0 });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const currentPlayer = players[currentPlayerIndex];

  // Ensure current player index is valid if players are removed
  useEffect(() => {
    if (players.length > 0 && currentPlayerIndex >= players.length) {
      setCurrentPlayerIndex(0);
    }
  }, [players.length, currentPlayerIndex]);

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { id: crypto.randomUUID(), name: newPlayerName.trim(), penalties: 0 }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (playerId: string) => {
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    // Adjust current player index if necessary
    if (playerIndex < currentPlayerIndex) {
      setCurrentPlayerIndex(prev => Math.max(0, prev - 1));
    } else if (playerIndex === currentPlayerIndex) {
      // If removing current player, reset turn state to avoid weird states
      setTurnData({ coin: null, dice: null, ayes: 0, nays: 0 });
      // If we are in a turn-based phase, maybe reset to TURN_START of the *next* player (who slides into this index)
      if (phase !== 'SETUP' && phase !== 'WELCOME') {
         setPhase('TURN_START');
      }
    }
    
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const startGame = () => {
    if (players.length > 0) {
      setPhase('TURN_START');
    }
  };

  const startRoll = () => {
    setPhase('ROLLING');
  };

  useEffect(() => {
    if (phase === 'ROLLING') {
      const timer = setTimeout(() => {
        const coinResult = Math.random() > 0.5 ? 'HEAD' : 'TAIL';
        const diceResult = Math.ceil(Math.random() * 6) as DiceValue;
        setTurnData(prev => ({ ...prev, coin: coinResult, dice: diceResult }));
        setPhase('REVEAL');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const startVoting = () => {
    setTurnData(prev => ({ ...prev, ayes: 0, nays: 0 }));
    setPhase('VOTING');
  };

  const forfeitTurn = (type: 'DRINK' | 'SECRET') => {
    const newPlayers = [...players];
    newPlayers[currentPlayerIndex].penalties += 1;
    setPlayers(newPlayers);
    setTurnData(prev => ({ ...prev, forfeitType: type }));
    setPhase('RESULT');
  };

  const submitVote = (type: 'AYE' | 'NAY') => {
    if (type === 'AYE') {
      setTurnData(prev => ({ ...prev, ayes: prev.ayes + 1 }));
    } else {
      setTurnData(prev => ({ ...prev, nays: prev.nays + 1 }));
    }
  };

  const finishVoting = () => {
    setPhase('RESULT');
  };

  const nextTurn = () => {
    // If penalty, update score (only if not forfeited, as forfeit already applied penalty)
    if (!turnData.forfeitType && turnData.nays > turnData.ayes) {
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex].penalties += 1;
      setPlayers(newPlayers);
    }

    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    setTurnData({ coin: null, dice: null, ayes: 0, nays: 0, forfeitType: undefined });
    setPhase('TURN_START');
  };

  // --- Render Phases ---

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-fixed text-[#F5F5DC] font-sans selection:bg-[#FFD700] selection:text-[#3E2723]">
      <div className="min-h-screen bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        
        {/* Manage Crew Button */}
        {phase !== 'WELCOME' && phase !== 'SETUP' && (
          <div className="fixed top-4 right-4 z-40">
            <Button onClick={() => setIsManagePlayersOpen(true)} variant="secondary" className="px-3 py-2 text-sm">
              <UserPlus size={20} /> <span className="hidden sm:inline">Manage Crew</span>
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {phase === 'WELCOME' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-md w-full"
            >
              <div className="mb-8 flex justify-center">
                <Skull size={80} className="text-[#FFD700]" />
              </div>
              <h1 className="text-6xl font-display font-bold text-[#FFD700] mb-4 drop-shadow-lg tracking-wider">
                Aye or Nay
              </h1>
              <p className="text-xl text-[#F5F5DC]/80 mb-8 font-light">
                Reveal your friends and foes. <br/> Discover who stands with you.
              </p>
              <div className="flex flex-col gap-4">
                <Button onClick={() => setPhase('SETUP')} className="w-full text-xl py-4">
                  Enter the Tavern
                </Button>
                <Button onClick={() => setIsRulesOpen(true)} variant="ghost" className="w-full text-lg">
                  Explain the Game <BookOpen size={20} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Rules Modal */}
          {isRulesOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              >
                <Card>
                  <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#1a1a1a]/95 backdrop-blur py-2 border-b border-white/10">
                    <h2 className="text-3xl font-display text-[#FFD700]">Pirate's Code</h2>
                    <button onClick={() => setIsRulesOpen(false)} className="text-[#F5F5DC]/50 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-6 text-[#F5F5DC]/90 text-lg leading-relaxed">
                    <section>
                      <h3 className="text-[#FFD700] font-bold text-xl mb-2 flex items-center gap-2">
                        <Skull size={20} /> The Goal
                      </h3>
                      <p>Reveal your friends and foes. Discover common allies and enemies within the crew.</p>
                    </section>

                    <section>
                      <h3 className="text-[#FFD700] font-bold text-xl mb-2 flex items-center gap-2">
                        <Coins size={20} /> The Roll
                      </h3>
                      <p className="mb-2">Every turn, you flip a coin and roll a dice:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-base opacity-80">
                        <li><span className="text-emerald-400 font-bold">Heads (Friend)</span> or <span className="text-red-400 font-bold">Tails (Enemy)</span></li>
                        <li><span className="font-bold">Dice (1-6)</span> determines the closeness (from Best Friend to Celebrity)</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-[#FFD700] font-bold text-xl mb-2 flex items-center gap-2">
                        <Users size={20} /> The Reveal
                      </h3>
                      <p>You must name a person fitting the description and <strong>explain why</strong>.</p>
                      <p className="mt-2 italic text-sm opacity-70">If you can't or won't answer, you must Drink or Spill a Secret!</p>
                    </section>

                    <section>
                      <h3 className="text-[#FFD700] font-bold text-xl mb-2 flex items-center gap-2">
                        <ThumbsUp size={20} /> The Vote
                      </h3>
                      <p>The crew votes <strong>AYE</strong> (Agree) or <strong>NAY</strong> (Disagree).</p>
                      <p className="mt-2">If <strong>NAYS</strong> win, you are Rejected! You must Drink or recruit a stranger who agrees with you.</p>
                    </section>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10">
                    <Button onClick={() => setIsRulesOpen(false)} className="w-full">
                      I Understand
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {phase === 'SETUP' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card>
                <h2 className="text-3xl font-display text-[#FFD700] mb-6 text-center">Recruit Crew</h2>
                
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                    placeholder="Enter name..."
                    className="flex-1 bg-black/40 border border-[#FFD700]/30 rounded-xl px-4 py-3 text-[#F5F5DC] placeholder:text-[#F5F5DC]/30 focus:outline-none focus:border-[#FFD700]"
                  />
                  <Button onClick={addPlayer} variant="secondary" className="px-4">
                    <Plus size={24} />
                  </Button>
                </div>

                <div className="space-y-2 mb-8 max-h-60 overflow-y-auto pr-2">
                  {players.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        {player.penalties > 0 && (
                          <span className="text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded-full flex items-center gap-1">
                            <Skull size={12} /> {player.penalties}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => removePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                  {players.length === 0 && (
                    <p className="text-center text-white/30 italic py-4">No crew members yet...</p>
                  )}
                </div>

                <Button 
                  onClick={startGame} 
                  disabled={players.length < 2} 
                  className="w-full"
                >
                  Set Sail <ArrowRight size={20} />
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Manage Players Modal */}
          {isManagePlayersOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="w-full max-w-md"
              >
                <Card>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-display text-[#FFD700]">Manage Crew</h2>
                    <button onClick={() => setIsManagePlayersOpen(false)} className="text-[#F5F5DC]/50 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                      placeholder="Enter name..."
                      className="flex-1 bg-black/40 border border-[#FFD700]/30 rounded-xl px-4 py-3 text-[#F5F5DC] placeholder:text-[#F5F5DC]/30 focus:outline-none focus:border-[#FFD700]"
                    />
                    <Button onClick={addPlayer} variant="secondary" className="px-4">
                      <Plus size={24} />
                    </Button>
                  </div>

                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                    {players.map((player) => (
                      <div key={player.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          {player.penalties > 0 && (
                            <span className="text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded-full flex items-center gap-1">
                              <Skull size={12} /> {player.penalties}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => removePlayer(player.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    {players.length === 0 && (
                      <p className="text-center text-white/30 italic py-4">No crew members...</p>
                    )}
                  </div>
                  
                  <Button onClick={() => setIsManagePlayersOpen(false)} className="w-full">
                    Done
                  </Button>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {phase === 'TURN_START' && (
            <motion.div 
              key="turn_start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h3 className="text-2xl text-[#F5F5DC]/60 mb-2 font-display">It's your turn</h3>
              <h2 className="text-5xl font-bold text-[#FFD700] mb-2 font-display">{currentPlayer?.name}</h2>
              
              <div className="flex justify-center items-center gap-2 mb-8 text-[#F5F5DC]/50">
                <Skull size={16} />
                <span>Penalties: {currentPlayer?.penalties}</span>
              </div>

              <Button onClick={startRoll} className="text-xl px-12 py-6">
                Roll the Bones
              </Button>
            </motion.div>
          )}

          {phase === 'ROLLING' && (
            <motion.div 
              key="rolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
               <div className="flex justify-center gap-8 mb-12">
                 <motion.div 
                   animate={{ rotateY: [0, 1080] }}
                   transition={{ duration: 2, ease: "easeOut" }}
                   className="w-32 h-32 rounded-full bg-[#FFD700] flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)] border-4 border-[#B8860B]"
                 >
                   <Coins size={48} className="text-[#3E2723]" />
                 </motion.div>
                 <motion.div 
                   animate={{ rotate: [0, 720], scale: [1, 1.2, 1] }}
                   transition={{ duration: 2, ease: "easeOut" }}
                   className="w-32 h-32 rounded-2xl bg-[#F5F5DC] flex items-center justify-center shadow-[0_0_30px_rgba(245,245,220,0.2)] text-black font-bold text-4xl border-4 border-[#D2B48C]"
                 >
                   ?
                 </motion.div>
               </div>
               <h3 className="text-2xl text-[#FFD700] animate-pulse font-display">Fate is deciding...</h3>
            </motion.div>
          )}

          {phase === 'REVEAL' && turnData.coin && turnData.dice && (
            <motion.div 
              key="reveal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg text-center"
            >
              <div className="mb-8">
                <h3 className="text-xl text-[#F5F5DC]/60 uppercase tracking-widest mb-4">The Oracle Speaks</h3>
                
                <div className="flex flex-col gap-6">
                  <Card className="bg-gradient-to-br from-[#3E2723] to-black border-[#FFD700]/30">
                    <div className="flex items-center justify-center gap-4 mb-2">
                      {turnData.coin === 'HEAD' ? (
                        <ThumbsUp size={32} className="text-emerald-400" />
                      ) : (
                        <ThumbsDown size={32} className="text-[#8B0000]" />
                      )}
                      <span className={`text-3xl font-bold ${turnData.coin === 'HEAD' ? 'text-emerald-400' : 'text-[#8B0000]'}`}>
                        {turnData.coin === 'HEAD' ? 'FRIEND' : 'ENEMY'}
                      </span>
                    </div>
                    <div className="w-full h-px bg-white/10 my-4" />
                    <div className="text-center">
                      <span className="text-5xl font-bold text-[#FFD700] block mb-2">{turnData.dice}</span>
                      <p className="text-lg text-[#F5F5DC] leading-relaxed">
                        {DEGREES[turnData.dice]}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              <p className="text-xl mb-8 font-light italic">
                "{currentPlayer?.name}, name a person who fits this description and explain why..."
              </p>

              <div className="flex flex-col gap-4 w-full">
                <Button onClick={startVoting} className="w-full">
                  I have a Name <Users size={20} />
                </Button>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => forfeitTurn('DRINK')} variant="danger" className="bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-sm px-2">
                    I'll Drink <Beer size={20} />
                  </Button>
                  <Button onClick={() => forfeitTurn('SECRET')} variant="danger" className="bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-sm px-2">
                    I'll Share a Secret <Skull size={20} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'VOTING' && (
            <motion.div 
              key="voting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <h2 className="text-3xl font-display text-[#FFD700] mb-2">Cast Your Votes</h2>
              <p className="text-[#F5F5DC]/60 mb-8">Do you agree with the choice?</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => submitVote('AYE')}
                  className="bg-emerald-900/50 border-2 border-emerald-500/50 hover:bg-emerald-900 hover:border-emerald-400 text-emerald-100 p-8 rounded-2xl transition-all active:scale-95 flex flex-col items-center gap-4 group"
                >
                  <ThumbsUp size={48} className="group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold">AYE</span>
                  <span className="text-sm opacity-60">({turnData.ayes})</span>
                </button>

                <button 
                  onClick={() => submitVote('NAY')}
                  className="bg-red-900/50 border-2 border-red-500/50 hover:bg-red-900 hover:border-red-400 text-red-100 p-8 rounded-2xl transition-all active:scale-95 flex flex-col items-center gap-4 group"
                >
                  <ThumbsDown size={48} className="group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold">NAY</span>
                  <span className="text-sm opacity-60">({turnData.nays})</span>
                </button>
              </div>

              <Button onClick={finishVoting} variant="secondary" className="w-full">
                Reveal Verdict
              </Button>
            </motion.div>
          )}

          {phase === 'RESULT' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <div className="mb-8">
                {turnData.forfeitType ? (
                   <div className="animate-bounce">
                    {turnData.forfeitType === 'DRINK' ? (
                      <>
                        <Beer size={80} className="text-[#FFD700] mx-auto mb-4" />
                        <h2 className="text-5xl font-display font-bold text-[#FFD700] mb-4">BOTTOMS UP!</h2>
                        <p className="text-xl text-[#F5F5DC]">
                          You chose the bottle. <br/>
                          <span className="font-bold text-[#FFD700]">Drink up!</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <Skull size={80} className="text-purple-400 mx-auto mb-4" />
                        <h2 className="text-5xl font-display font-bold text-purple-400 mb-4">SPILL YOUR GUTS!</h2>
                        <p className="text-xl text-[#F5F5DC]">
                          You chose to share. <br/>
                          <span className="font-bold text-[#FFD700]">Tell us your secret!</span>
                        </p>
                      </>
                    )}
                  </div>
                ) : turnData.nays > turnData.ayes ? (
                  <div className="animate-bounce">
                    <Skull size={80} className="text-[#8B0000] mx-auto mb-4" />
                    <h2 className="text-5xl font-display font-bold text-[#8B0000] mb-4">REJECTED!</h2>
                    <p className="text-xl text-[#F5F5DC]">
                      The crew disagrees. <br/>
                      <span className="font-bold text-[#FFD700]">Drink or recruit a random stranger who agrees!</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <ThumbsUp size={80} className="text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-5xl font-display font-bold text-emerald-500 mb-4">ACCEPTED!</h2>
                    <p className="text-xl text-[#F5F5DC]">
                      The crew agrees. <br/>
                      <span className="font-bold text-[#FFD700]">Safe... for now.</span>
                    </p>
                  </div>
                )}
              </div>

              {!turnData.forfeitType && (
                <div className="flex justify-center gap-8 text-sm text-[#F5F5DC]/50 mb-8">
                  <div>Ayes: {turnData.ayes}</div>
                  <div>Nays: {turnData.nays}</div>
                </div>
              )}

              <Button onClick={nextTurn} className="w-full">
                Next Player <RotateCcw size={20} />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer / Status */}
        {phase !== 'WELCOME' && phase !== 'SETUP' && (
          <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
            <div className="inline-block bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-xs text-[#F5F5DC]/50">
              Round in progress • {players.length} Players
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
