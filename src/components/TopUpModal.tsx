import React, { useState } from 'react';
import { Copy, Check, X, Phone, MessageCircle, Coins, ShieldCheck, Sparkles } from 'lucide-react';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTokens: (amount: number) => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onAddTokens }) => {
  const [copied, setCopied] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ tokens: number; price: string }>({
    tokens: 10,
    price: '₦1,000',
  });
  const [creditedNotice, setCreditedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText('7014333563');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstantCredit = (amount: number) => {
    onAddTokens(amount);
    setCreditedNotice(`+${amount} Tokens credited successfully! 🎉`);
    setTimeout(() => {
      setCreditedNotice(null);
      onClose();
    }, 1500);
  };

  const PACKAGES = [
    { tokens: 5, price: '₦500', popular: false },
    { tokens: 10, price: '₦1,000', popular: true },
    { tokens: 25, price: '₦2,000', popular: false },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#1d0e3a] border-2 border-amber-400/30 rounded-3xl p-6 sm:p-7 text-white shadow-2xl shadow-purple-950/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 mb-2 border border-amber-400/30">
            <Coins className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-amber-300 tracking-tight">Top up Tokens</h2>
          <p className="text-sm text-purple-200/80 mt-1">Get more game tokens to keep playing with Jesse</p>
        </div>

        {/* Main Details Card Requested by User */}
        <div className="bg-[#2a1354]/90 border border-purple-400/30 rounded-2xl p-4 sm:p-5 mb-5 shadow-inner">
          <div className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-1">
            Account / Top up Recipient
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
            Jesse alhassan
          </div>

          <div className="mt-3 flex items-center justify-between bg-[#180933] border border-amber-400/40 rounded-xl px-4 py-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-400/80 font-bold">
                Account Number / Phone
              </div>
              <div className="text-2xl font-mono font-black text-amber-300 tracking-wider">
                7014333563
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-amber-400 text-purple-950 hover:bg-amber-300 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 text-xs text-purple-200/90 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bank Transfer: OPay / Palmpay / Any Nigerian Bank</span>
          </div>
        </div>

        {/* Token Packages */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
            Select Token Bundle
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPackage.tokens === pkg.tokens;
              return (
                <button
                  key={pkg.tokens}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/40'
                      : 'bg-[#26104d] border-purple-400/20 text-white/80 hover:bg-[#321566]'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider bg-amber-400 text-purple-950 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="text-lg font-black text-white">{pkg.tokens} 🪙</div>
                  <div className="text-xs font-bold text-amber-300 mt-0.5">{pkg.price}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Alert if Credited */}
        {creditedNotice && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-sm font-bold text-emerald-300 animate-bounce">
            {creditedNotice}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Main Top up Button */}
          <button
            onClick={() => handleInstantCredit(selectedPackage.tokens)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-purple-950 font-black text-base shadow-lg shadow-amber-500/30 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-purple-900" />
            Top up {selectedPackage.tokens} Tokens ({selectedPackage.price})
          </button>

          {/* Quick Contact Jesse */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://wa.me/2347014333563?text=Hi%20Jesse%2C%20I%20want%20to%20top%20up%20tokens%20for%20Play%20with%20Jesse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40 text-xs font-bold transition-all"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Jesse
            </a>
            <a
              href="tel:07014333563"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 hover:bg-purple-600/40 text-xs font-bold transition-all"
            >
              <Phone className="w-4 h-4" /> Call 7014333563
            </a>
          </div>
        </div>

        <p className="text-[11px] text-center text-purple-300/60 mt-4">
          Transfer to <b>Jesse alhassan (7014333563)</b> then click <b>Top up</b> to play immediately!
        </p>
      </div>
    </div>
  );
};
