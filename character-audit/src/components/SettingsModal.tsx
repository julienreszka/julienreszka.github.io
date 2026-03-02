import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Check, AlertCircle, Eye, EyeOff, Copy, CheckCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: string, provider: 'gemini' | 'xai', apiKey: string) => void;
  initialModel?: string;
  initialProvider?: 'gemini' | 'xai';
  initialGeminiKey?: string;
  initialXaiKey?: string;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialModel = 'gemini-2.5-flash',
  initialProvider = 'gemini',
  initialGeminiKey = '',
  initialXaiKey = ''
}: SettingsModalProps) {
  const [model, setModel] = useState(initialModel);
  const [provider, setProvider] = useState<'gemini' | 'xai'>(initialProvider);
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey);
  const [xaiKey, setXaiKey] = useState(initialXaiKey);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setModel(initialModel);
    setProvider(initialProvider);
    setGeminiKey(initialGeminiKey);
    setXaiKey(initialXaiKey);
  }, [initialModel, initialProvider, initialGeminiKey, initialXaiKey, isOpen]);

  const handleCopy = async () => {
    const currentKey = provider === 'gemini' ? geminiKey : xaiKey;
    if (currentKey) {
      try {
        await navigator.clipboard.writeText(currentKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) {
      setError('Model name cannot be empty');
      return;
    }
    
    const currentKey = provider === 'gemini' ? geminiKey.trim() : xaiKey.trim();
    if (!currentKey) {
      setError(`${provider === 'gemini' ? 'Gemini' : 'xAI'} API Key is required`);
      return;
    }
    
    onSave(model.trim(), provider, currentKey);
    onClose();
  };

  const handleProviderChange = (newProvider: 'gemini' | 'xai') => {
    setProvider(newProvider);
    // Set default model for the new provider
    if (newProvider === 'gemini') {
      setModel('gemini-2.5-flash');
    } else {
      setModel('grok-4-1-fast-reasoning');
    }
    setError('');
  };

  const geminiModels = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Experimental' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ];

  const xaiModels = [
    { value: 'grok-4-1-fast-reasoning', label: 'Grok 4.1 Fast Reasoning (Recommended)' },
    { value: 'grok-4', label: 'Grok 4' },
    { value: 'grok-3', label: 'Grok 3' },
    { value: 'grok-3-mini', label: 'Grok 3 Mini' },
  ];

  const commonModels = provider === 'gemini' ? geminiModels : xaiModels;

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
                  <Settings className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">AI Provider</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`flex-1 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      provider === 'gemini'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderChange('xai')}
                    className={`flex-1 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      provider === 'xai'
                        ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500/50 text-sky-700 dark:text-sky-400'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    xAI (Grok)
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {provider === 'gemini' ? 'Gemini' : 'xAI'} API Key
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Your key is stored locally in your browser and never sent to our servers.
                </p>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={provider === 'gemini' ? geminiKey : xaiKey}
                    onChange={(e) => {
                      if (provider === 'gemini') {
                        setGeminiKey(e.target.value);
                      } else {
                        setXaiKey(e.target.value);
                      }
                      setError('');
                    }}
                    placeholder={provider === 'gemini' ? 'AIza...' : 'xai-...'}
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 pr-24 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!(provider === 'gemini' ? geminiKey : xaiKey)}
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
                <p className="text-xs text-zinc-500 dark:text-zinc-600">
                  {provider === 'gemini' ? (
                    <>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-500 hover:underline">Google AI Studio</a></>
                  ) : (
                    <>Get your API key from <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-500 hover:underline">xAI Console</a></>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">AI Model</label>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Choose or enter the {provider === 'gemini' ? 'Gemini' : 'Grok'} model to use for character audits.
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-1 gap-2">
                {commonModels.map((modelOption) => (
                  <button
                    key={modelOption.value}
                    type="button"
                    onClick={() => {
                      setModel(modelOption.value);
                      setError('');
                    }}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      model === modelOption.value
                        ? (provider === 'gemini' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
                          : 'bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500/50 text-sky-700 dark:text-sky-400')
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium text-sm">{modelOption.label}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{modelOption.value}</div>
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">Or enter a custom model:</div>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setError('');
                  }}
                  placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : 'grok-4-1-fast-reasoning'}
                  className={`w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
                    provider === 'gemini' ? 'focus:ring-emerald-500/50' : 'focus:ring-sky-500/50'
                  } font-mono text-sm`}
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs mt-2">
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
                  Save Settings
                </button>
              </div>
              
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-600">
                {provider === 'gemini' ? (
                  <>Learn more about <a href="https://ai.google.dev/gemini-api/docs/models/gemini" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-500 hover:underline">available Gemini models</a></>
                ) : (
                  <>Learn more about <a href="https://docs.x.ai/docs" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-500 hover:underline">xAI API and Grok models</a></>
                )}
              </p>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
