import React, { useState, useEffect, useRef } from 'react';
import { JESSE_PHOTO_BASE64 } from './assets/jessePhoto';
import { TopUpModal } from './components/TopUpModal';
import { Coins, Sparkles, Volume2, VolumeX, RotateCcw, PlusCircle } from 'lucide-react';

interface Prize {
  icon: string;
  text: string;
  isDud?: boolean;
}

const GOOD_PRIZES: Prize[] = [
  { icon: '💵', text: '₦2,000 cash' },
  { icon: '💰', text: '₦1,000 cash' },
  { icon: '🍛', text: 'A full meal' },
  { icon: '📱', text: '₦5,000 airtime' },
  { icon: '🥤', text: 'Chilled drink' },
  { icon: '🛍️', text: 'Shopping treat' },
  { icon: '🎧', text: 'Brand new earphones' },
  { icon: '🍕', text: 'Pizza' },
  { icon: '👟', text: 'Fresh sneakers' },
  { icon: '🎟️', text: 'Cinema ticket' },
  { icon: '📶', text: '2GB data' },
  { icon: '🍗', text: 'Chicken & chips' },
  { icon: '⌚', text: 'Nice wristwatch' },
  { icon: '💸', text: '₦3,000 transfer' },
];

const DUD_PRIZE: Prize = { icon: '📞', text: '₦100 Recharge Card', isDud: true };

const DUD_MESSAGES = [
  'Ahh! You ran out of luck 😅',
  'Wrong card! Luck no dey your side today 😂',
  'Jesse read your mind… and moved! 🤭',
  'Oops! Better luck next time 🍀',
  'Jesse always wins this one! Try again 😎',
];

const NUM_CARDS = 6;
const START_TOKENS = 3;
const SHUFFLE_ROUNDS = 5;

// Sound synthesizer using Web Audio API
class SoundPlayer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playFlip() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playShuffle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playDud() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [240, 210, 180, 150].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0.15, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.2);
    });
  }
}

const sound = new SoundPlayer();

interface GameCard {
  id: number;
  prize: Prize;
  faceUp: boolean;
  dim: boolean;
  isChosen: boolean;
  x: number;
  y: number;
  rot: number;
  zIndex: number;
  transitionFast: boolean;
}

export default function App() {
  const [tokens, setTokens] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jessePlayTokens');
      if (saved !== null && !isNaN(+saved)) return +saved;
    } catch {}
    return START_TOKENS;
  });

  const [screen, setScreen] = useState<'intro' | 'game'>('intro');
  const [status, setStatus] = useState<string>('');
  const [subText, setSubText] = useState<string>('Can you guess what Jesse will give you?');
  const [note, setNote] = useState<string>('');
  const [attempt, setAttempt] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false);
  const [pickable, setPickable] = useState<boolean>(false);
  const [result, setResult] = useState<{ title: string; text: string } | null>(null);
  const [tokenPop, setTokenPop] = useState<boolean>(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Cards state
  const [cards, setCards] = useState<GameCard[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('jessePlayTokens', String(tokens));
    } catch {}
  }, [tokens]);

  const addTokens = (amount: number) => {
    setTokens((prev) => prev + amount);
    setTokenPop(true);
    sound.playCoin();
    setTimeout(() => setTokenPop(false), 600);
    setNote('');
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startRound = async () => {
    if (busy) return;
    if (tokens < 1) {
      setNote('No tokens left! Click "+ Add Token" below.');
      return;
    }

    setTokens((prev) => prev - 1);
    setTokenPop(true);
    setTimeout(() => setTokenPop(false), 500);

    setBusy(true);
    setAttempt((prev) => prev + 1);
    setResult(null);
    setNote('');
    setSubText('Remember these cards…');
    setScreen('game');

    // Create cards with good prizes + 1 dud
    const picks = shuffleArray(GOOD_PRIZES).slice(0, NUM_CARDS - 1);
    const lineup = shuffleArray([...picks, DUD_PRIZE]);

    const initialCards: GameCard[] = lineup.map((p, index) => ({
      id: index,
      prize: p,
      faceUp: false,
      dim: false,
      isChosen: false,
      x: 0,
      y: 0,
      rot: 0,
      zIndex: 1,
      transitionFast: false,
    }));

    setCards(initialCards);

    setStatus("Jesse's goodies are coming up… 👀");
    await sleep(400);

    // Flip face up one by one
    sound.playFlip();
    setCards((prev) => prev.map((c) => ({ ...c, faceUp: true })));

    setStatus('Look carefully and remember! 👀');
    await sleep(2800);

    // Flip back face down
    setStatus('Flipping them over… 🔄');
    sound.playFlip();
    setCards((prev) => prev.map((c) => ({ ...c, faceUp: false })));
    await sleep(800);

    // Perform animated shuffle
    await runShuffleAnimation();

    setSubText('Guess what Jesse is thinking…');
    setStatus('Pick ONE card 👆');
    setPickable(true);
    setBusy(false);
  };

  const runShuffleAnimation = async () => {
    setStatus('Jesse is gathering the cards… 🃏');
    sound.playShuffle();

    // 1. Gather all cards into central stack with small rotation jitter
    setCards((prev) =>
      prev.map((c, i) => {
        // approximate center
        const col = i % 3;
        const row = Math.floor(i / 3);
        const dx = (1 - col) * 115;
        const dy = (0.5 - row) * 155;
        return {
          ...c,
          x: dx + rand(-4, 4),
          y: dy + rand(-4, 4),
          rot: rand(-4, 4),
          zIndex: i + 1,
          transitionFast: false,
        };
      })
    );

    await sleep(750);

    // 2. Multi-phase shuffle
    setStatus('Shuffling… 🔀');
    for (let r = 0; r < SHUFFLE_ROUNDS; r++) {
      sound.playShuffle();
      // Pull side cuts
      setCards((prev) =>
        prev.map((c, idx) => {
          if (idx % 2 === 0) {
            return {
              ...c,
              x: c.x - 90,
              y: c.y + rand(-8, 8),
              rot: rand(-8, 8),
              transitionFast: true,
            };
          } else {
            return {
              ...c,
              x: c.x + 90,
              y: c.y + rand(-8, 8),
              rot: rand(-8, 8),
              transitionFast: true,
            };
          }
        })
      );
      await sleep(260);

      // Slide back into pile with randomized zIndex
      setCards((prev) => {
        const shuffled = shuffleArray(prev);
        return shuffled.map((c, k) => ({
          ...c,
          x: rand(-5, 5),
          y: rand(-5, 5),
          rot: rand(-3, 3),
          zIndex: k + 1,
          transitionFast: false,
        }));
      });
      await sleep(300);
    }

    // 3. Deal out cards back to original positions
    setStatus('Dealing them out… ✨');
    sound.playShuffle();
    const positions = shuffleArray([0, 1, 2, 3, 4, 5]);
    for (let i = 0; i < NUM_CARDS; i++) {
      setCards((prev) =>
        prev.map((c, idx) => {
          if (idx === positions[i]) {
            return {
              ...c,
              x: 0,
              y: 0,
              rot: 0,
              zIndex: 1,
              transitionFast: false,
            };
          }
          return c;
        })
      );
      await sleep(100);
    }
    await sleep(400);
  };

  const handlePickCard = async (chosenId: number) => {
    if (busy || !pickable) return;
    setBusy(true);
    setPickable(false);
    setStatus('Jesse is checking his mind… 🤔');

    // Jesse's mind-reading trick: chosen card always becomes the ₦100 dud card!
    setCards((prev) => {
      const chosen = prev.find((c) => c.id === chosenId);
      const dud = prev.find((c) => c.prize.isDud);

      return prev.map((c) => {
        if (c.id === chosenId) {
          return {
            ...c,
            isChosen: true,
            prize: DUD_PRIZE,
          };
        }
        if (c.prize.isDud && chosen && !chosen.prize.isDud) {
          return {
            ...c,
            prize: chosen.prize,
          };
        }
        return c;
      });
    });

    await sleep(1100);

    // Flip the chosen card face up
    sound.playDud();
    setCards((prev) =>
      prev.map((c) => (c.id === chosenId ? { ...c, faceUp: true } : c))
    );
    await sleep(800);

    // Reveal the other cards dimmed so user sees what they missed
    setCards((prev) =>
      prev.map((c) => (c.id === chosenId ? c : { ...c, faceUp: true, dim: true }))
    );

    const message = DUD_MESSAGES[(attempt - 1) % DUD_MESSAGES.length];
    setResult({
      title: message,
      text: `You got a ₦100 Recharge Card. Look at what you missed! 😭`,
    });
    setStatus('');
    setSubText('Jesse wins this round 😎');
    setBusy(false);
  };

  return (
    <div className="relative min-h-screen text-white font-sans flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden select-none">
      {/* Background with Jesse's Photo & Gradient */}
      <div
        className={`fixed inset-0 z-0 pointer-events-none transition-all duration-700 bg-center bg-bottom bg-no-repeat ${
          screen === 'game' ? 'opacity-35 blur-[1px]' : 'opacity-90'
        }`}
        style={{
          backgroundImage: `url("${JESSE_PHOTO_BASE64}")`,
          backgroundSize: 'auto 100%',
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#1b0b3acc] via-transparent to-[#1b0b3ae6]"
        aria-hidden="true"
      />

      {/* Main Wrap Container */}
      <div className="relative z-10 w-full max-w-[500px] flex flex-col flex-1 my-auto">
        {/* App Title */}
        <header className="text-center pt-2 pb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-300/80 uppercase tracking-widest">
              Classic Card Guess
            </span>
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                sound.enabled = next;
              }}
              className="p-1.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all text-xs flex items-center gap-1"
              title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-amber-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tracking-tight">
            🎁 Play with Jesse
          </h1>
          <p className="text-sm sm:text-base font-semibold text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] mt-1">
            {subText}
          </p>
        </header>

        {/* Token Bar with + Add Token Button */}
        <div className="flex items-center justify-between gap-3 bg-[#1b0b3acc] border-2 border-white/20 rounded-full px-4 sm:px-5 py-2.5 my-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold">
            <span>🪙 Tokens:</span>
            <span
              className={`text-xl font-black text-amber-300 transition-transform ${
                tokenPop ? 'scale-125 text-amber-200' : ''
              }`}
            >
              {tokens}
            </span>
          </div>

          {/* Add Token Button Requested by User */}
          <button
            onClick={() => setIsTopUpOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-900/50 active:translate-y-0.5 transition-all cursor-pointer ring-2 ring-emerald-300/30"
          >
            <PlusCircle className="w-4 h-4" />
            + Add Token
          </button>
        </div>

        {/* Screen 1: Intro */}
        {screen === 'intro' && (
          <div className="bg-[#1b0b3ad9] border-2 border-white/15 rounded-3xl p-6 sm:p-7 text-center backdrop-blur-md shadow-2xl animate-fadeIn my-auto">
            <p className="text-base sm:text-lg text-white/95 leading-relaxed mb-6 font-medium">
              Jesse has hidden some goodies in these cards.
              <br />
              Remember them, then guess the one Jesse is thinking of.
              <br />
              <span className="inline-block mt-2 font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Each game costs 1 token 🪙
              </span>
            </p>

            <button
              onClick={startRound}
              className="w-full py-4 px-6 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-purple-950 font-black text-lg sm:text-xl shadow-[0_5px_0_#9a6a00] hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#9a6a00] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-purple-900" />
              Start Game (1 🪙)
            </button>

            {note && (
              <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-sm font-bold flex flex-col items-center gap-2">
                <span>{note}</span>
                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className="px-4 py-1.5 rounded-full bg-amber-400 text-purple-950 font-black text-xs hover:bg-amber-300"
                >
                  Top up Tokens Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Screen 2: Game Grid & Reveal */}
        {screen === 'game' && (
          <div className="flex flex-col items-center my-auto w-full">
            {/* Status Text */}
            <div className="min-h-[2rem] text-center mb-3">
              <p className="text-base sm:text-lg font-bold text-amber-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] animate-pulse">
                {status}
              </p>
            </div>

            {/* 3x2 Card Grid */}
            <div ref={gridRef} className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full relative">
              {cards.map((c) => {
                return (
                  <div
                    key={c.id}
                    onClick={() => pickable && handlePickCard(c.id)}
                    style={{
                      transform: `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`,
                      zIndex: c.zIndex,
                    }}
                    className={`aspect-[3/4] relative perspective-1000 transition-all ${
                      c.transitionFast ? 'duration-200' : 'duration-500'
                    } ${pickable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'} ${
                      c.dim ? 'opacity-80' : 'opacity-100'
                    }`}
                  >
                    {/* Flippable Inner Container */}
                    <div
                      className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
                        c.faceUp ? 'rotate-y-180' : ''
                      } ${pickable ? 'animate-bounce-subtle' : ''}`}
                    >
                      {/* Back Face (Pink patterned with ❓) */}
                      <div className="absolute inset-0 backface-hidden rounded-2xl p-2 flex flex-col items-center justify-center border-2 sm:border-3 border-white shadow-xl bg-[repeating-linear-gradient(45deg,#ff4d8d_0_10px,#d1236b_10px_20px)]">
                        <span className="text-3xl sm:text-4xl filter drop-shadow">❓</span>
                      </div>

                      {/* Front Face (White/Red with Prize Details) */}
                      <div
                        className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-xl border-2 sm:border-3 ${
                          c.prize.isDud
                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                            : 'bg-white text-purple-950 border-amber-300'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl mb-1">{c.prize.icon}</span>
                        <span className="text-xs sm:text-sm font-extrabold leading-tight">
                          {c.prize.text}
                        </span>
                        {c.isChosen && (
                          <span className="mt-1 text-[10px] font-black uppercase bg-purple-900 text-amber-300 px-1.5 py-0.5 rounded">
                            Your Pick
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Result Area */}
            {result && (
              <div className="w-full mt-5 bg-[#1b0b3ad9] border-2 border-amber-400/30 rounded-3xl p-5 sm:p-6 text-center backdrop-blur-md shadow-2xl animate-fadeIn">
                <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-2 drop-shadow">
                  {result.title}
                </h2>
                <p className="text-sm sm:text-base font-semibold text-white/90 mb-4">
                  {result.text}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={startRound}
                    className="py-3 px-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-purple-950 font-black text-base shadow-[0_4px_0_#9a6a00] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-purple-900" />
                    Play Again (1 🪙)
                  </button>
                  <button
                    onClick={() => setIsTopUpOpen(true)}
                    className="py-3 px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-[0_4px_0_#15803d] active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-4 h-4" />
                    Top up Tokens
                  </button>
                </div>

                {note && (
                  <p className="mt-3 text-rose-300 text-xs font-bold">{note}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-white/70 drop-shadow">
          <span>Just for fun. Jesse&apos;s Play 🎉</span>
        </footer>
      </div>

      {/* Top Up Modal for Add Token Button */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onAddTokens={addTokens}
      />
    </div>
  );
}
