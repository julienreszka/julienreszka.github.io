import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, X, Check, AlertCircle, Eye, EyeOff, Copy, CheckCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey?: string;
}

export function ApiKeyModal({ isOpen, onClose, onSave, initialKey = '' }: ApiKeyModalProps) {
  const [key, setKey] = useState(initialKey);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setKey(initialKey);
  }, [initialKey, isOpen]);

  const handleCopy = async () => {
    if (key) {
      try {
        await navigator.clipboard.writeText(key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('API Key cannot be empty');
      return;
    }
    if (!key.startsWith('AIza')) {
      setError('Invalid API Key format (usually starts with AIza)');
      return;
    }
    onSave(key.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl">
                  <Key className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Set API Key</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Enter your Gemini API key to continue. Your key is stored locally in your browser and never sent to our servers.
              </p>
              
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={key}
                    onChange={(e) => {
                      setKey(e.target.value);
                      setError('');
                    }}
                    placeholder="AIza..."
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 pr-24 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!key}
                      className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Copy API key"
                    >
                      {copied ? <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      title={showKey ? "Hide API key" : "Show API key"}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold py-3 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save API Key
                </button>
              </div>
              
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-600">
                Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-500 hover:underline">Get one from Google AI Studio</a>
              </p>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
