/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SearchInput } from './components/SearchInput';
import { AuditReport } from './components/AuditReport';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Shield, History, Sun, Moon, Settings } from 'lucide-react';
import { saveAudit, type AuditData } from '@/lib/db';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [provider, setProvider] = useState<'gemini' | 'xai'>('gemini');

  useEffect(() => {
    // Load theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    // Load provider from localStorage
    const savedProvider = localStorage.getItem('ai_provider') as 'gemini' | 'xai' | null;
    if (savedProvider) {
      setProvider(savedProvider);
    }

    // Load API keys from localStorage
    const envKey = process.env.GEMINI_API_KEY;
    const localKeyGemini = localStorage.getItem('gemini_api_key') || '';
    const localKeyXAI = localStorage.getItem('xai_api_key') || '';
    
    setGeminiApiKey(envKey || localKeyGemini);
    setXaiApiKey(localKeyXAI);

    // Set current API key based on provider
    const currentProvider = savedProvider || 'gemini';
    if (currentProvider === 'gemini') {
      setApiKey(envKey || localKeyGemini);
      if (!envKey && !localKeyGemini) {
        const timer = setTimeout(() => setShowSettingsModal(true), 1000);
        return () => clearTimeout(timer);
      }
    } else if (currentProvider === 'xai') {
      setApiKey(localKeyXAI);
      if (!localKeyXAI) {
        const timer = setTimeout(() => setShowSettingsModal(true), 1000);
        return () => clearTimeout(timer);
      }
    }

    // Load model from localStorage
    const savedModel = localStorage.getItem('ai_model');
    if (savedModel) {
      setModel(savedModel);
    } else {
      // Set default model based on provider
      setModel(currentProvider === 'xai' ? 'grok-4-1-fast-reasoning' : 'gemini-2.5-flash');
    }
  }, []);

  const handleSaveSettings = (newModel: string, newProvider: 'gemini' | 'xai', newApiKey: string) => {
    // Save API key for the provider
    if (newProvider === 'gemini') {
      setGeminiApiKey(newApiKey);
      localStorage.setItem('gemini_api_key', newApiKey);
    } else {
      setXaiApiKey(newApiKey);
      localStorage.setItem('xai_api_key', newApiKey);
    }
    
    // Set current API key
    setApiKey(newApiKey);
    
    // If provider changed, update it
    if (newProvider !== provider) {
      setProvider(newProvider);
      localStorage.setItem('ai_provider', newProvider);
    }
    
    // Save model
    setModel(newModel);
    localStorage.setItem('ai_model', newModel);
  };

  const handleAudit = async (name: string, context?: string) => {
    if (!apiKey) {
      setShowSettingsModal(true);
      return;
    }

    const queryName = context ? `${name} (${context})` : name;
    setSearchQuery(queryName);
    setLoading(true);
    setError(null);
    setData(null);

    try {
      let parsedData;
      let sources = [];

      if (provider === 'gemini') {
        const result = await handleGeminiAudit(queryName);
        parsedData = result.data;
        sources = result.sources;
      } else {
        const result = await handleXAIAudit(queryName);
        parsedData = result.data;
        sources = result.sources;
      }

      const newAudit = {
        name,
        summary: parsedData.summary,
        whereabouts: parsedData.whereabouts,
        friends: parsedData.friends || [],
        associates: parsedData.associates || [],
        enemies: parsedData.enemies || [],
        sources
      };

      setData(newAudit as AuditData);
      
      // Save to IndexedDB
      await saveAudit(newAudit);

    } catch (err: any) {
      console.error("Audit failed:", err);
      setError(err.message || "An error occurred during the audit.");
      
      // If error is related to API key, prompt to update
      if (err.message?.includes('API key') || err.status === 403 || err.status === 401) {
        setShowSettingsModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAuditPrompt = (queryName: string) => {
    return `
Research the person: "${queryName}".
Identify their known friends, close associates, and public enemies or rivals.
Also determine their current whereabouts (location, what they're doing now, current position/role).

For each person identified, provide a brief description of:
1. Past relationship (how it started/was)
2. Present relationship (current status)
3. Future outlook (likely trajectory)
4. Whether they are deceased and the cause of death (if applicable)

Based on these associations, provide an executive summary judging the person's character.

You MUST return a valid JSON object. Do not include any other text, markdown formatting, or code blocks.
The JSON object must follow this structure exactly:
{
  "whereabouts": "Current location, status, and what they are doing now",
  "friends": [
    { 
      "name": "Name", 
      "past": "Description...", 
      "present": "Description...", 
      "future": "Description...",
      "isDeceased": boolean,
      "causeOfDeath": "Cause or null"
    }
  ],
  "associates": [
    { 
      "name": "Name", 
      "past": "Description...", 
      "present": "Description...", 
      "future": "Description...",
      "isDeceased": boolean,
      "causeOfDeath": "Cause or null"
    }
  ],
  "enemies": [
    { 
      "name": "Name", 
      "past": "Description...", 
      "present": "Description...", 
      "future": "Description...",
      "isDeceased": boolean,
      "causeOfDeath": "Cause or null"
    }
  ],
  "summary": "A detailed character audit summary based on their connections."
}
`;
  };

  const handleGeminiAudit = async (queryName: string) => {
    // Initialize API with current key
    const ai = new GoogleGenAI({ apiKey });
    const prompt = generateAuditPrompt(queryName);

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const text = result.text;
      
      if (!text) {
        throw new Error("No response generated");
      }
      
      let parsedData;
      try {
        // Find the first '{' and the last '}' to extract the JSON object
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonString = text.substring(firstBrace, lastBrace + 1);
          // Remove any potential trailing commas before closing braces/brackets which are invalid in JSON
          const cleanJson = jsonString.replace(/,\s*([\]}])/g, '$1');
          parsedData = JSON.parse(cleanJson);
        } else {
          parsedData = JSON.parse(text);
        }
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.log("Raw text:", text);
        
        // Attempt to fix common JSON errors
        try {
            // Sometimes models forget the comma between properties
            const fixedText = text.replace(/}\s*"/g, '}, "').replace(/]\s*"/g, '], "');
            const firstBrace = fixedText.indexOf('{');
            const lastBrace = fixedText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonString = fixedText.substring(firstBrace, lastBrace + 1);
                parsedData = JSON.parse(jsonString);
            } else {
                throw e;
            }
        } catch (retryError) {
            throw new Error("Failed to parse the audit report. The AI response was not valid JSON.");
        }
      }

      // Extract grounding metadata (sources)
      const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
      const sources = groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web?.uri ? { title: chunk.web.title, uri: chunk.web.uri } : null)
        .filter(Boolean) || [];

      return { data: parsedData, sources };
  };

  const handleXAIAudit = async (queryName: string) => {
    const prompt = generateAuditPrompt(queryName);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are Grok, a highly intelligent AI assistant that provides detailed, accurate character audits based on public information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `xAI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("No response generated from xAI");
    }

    let parsedData;
    try {
      // Find the first '{' and the last '}' to extract the JSON object
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonString = text.substring(firstBrace, lastBrace + 1);
        // Remove any potential trailing commas before closing braces/brackets which are invalid in JSON
        const cleanJson = jsonString.replace(/,\s*([\]}])/g, '$1');
        parsedData = JSON.parse(cleanJson);
      } else {
        parsedData = JSON.parse(text);
      }
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      console.log("Raw text:", text);
      
      // Attempt to fix common JSON errors
      try {
        // Sometimes models forget the comma between properties
        const fixedText = text.replace(/}\s*"/g, '}, "').replace(/]\s*"/g, '], "');
        const firstBrace = fixedText.indexOf('{');
        const lastBrace = fixedText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonString = fixedText.substring(firstBrace, lastBrace + 1);
          parsedData = JSON.parse(jsonString);
        } else {
          throw e;
        }
      } catch (retryError) {
        throw new Error("Failed to parse the audit report. The AI response was not valid JSON.");
      }
    }

    // xAI doesn't provide grounding metadata like Gemini, so return empty sources
    return { data: parsedData, sources: [] };
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-emerald-500/30 transition-colors">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20 flex flex-col min-h-screen">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16 space-y-4 relative"
        >
          <div className="absolute right-0 top-0 hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm font-medium backdrop-blur-sm"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm font-medium backdrop-blur-sm"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm font-medium backdrop-blur-sm"
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>

          <div className="inline-flex items-center justify-center p-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-300 dark:border-white/5 mb-4 shadow-2xl">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 dark:from-white to-zinc-500 dark:to-white/40">
            Character Audit
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            AI-powered investigative profiling based on public associations.
            <br className="hidden md:block" />
            <span className="text-zinc-500 dark:text-zinc-500 text-sm">Powered by Gemini, Grok & Google Search</span>
          </p>

          <div className="md:hidden flex justify-center gap-2 mt-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm font-medium backdrop-blur-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm font-medium backdrop-blur-sm"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm font-medium backdrop-blur-sm"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </motion.header>

        {/* Search Section */}
        <div className="mb-12">
          <SearchInput onSearch={handleAudit} isLoading={loading} externalQuery={searchQuery} />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="flex-1">
          {data && <AuditReport data={data} onAudit={handleAudit} />}
          
          {!data && !loading && !error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-center text-zinc-400 dark:text-zinc-600 mt-20"
            >
              <p className="font-mono text-sm uppercase tracking-widest opacity-50">
                System Ready • Awaiting Target
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-zinc-500 dark:text-zinc-600 text-sm py-8 border-t border-zinc-200 dark:border-white/5 space-y-2">
          <p>&copy; {new Date().getFullYear()} Character Audit Protocol. All rights reserved.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-700 max-w-md mx-auto">
            Disclaimer: This report is generated by AI using public search results. 
            Assessments are for entertainment and informational purposes only and may not reflect actual character.
          </p>
        </footer>
      </div>

      <HistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        onSelect={setData}
      />
      
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={(newModel, newProvider, newApiKey) => handleSaveSettings(newModel, newProvider, newApiKey)}
        initialModel={model}
        initialProvider={provider}
        initialGeminiKey={geminiApiKey}
        initialXaiKey={xaiApiKey}
      />
    </div>
  );
}

