import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  externalQuery?: string;
}

export function SearchInput({ onSearch, isLoading, externalQuery }: SearchInputProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-300 dark:border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-zinc-200 dark:ring-white/5 focus-within:ring-emerald-500/50 transition-all duration-200">
        <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500 ml-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a name for character audit..."
          className="flex-1 bg-transparent border-none outline-none text-lg px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={cn(
            "px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2",
            isLoading || !query.trim()
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg shadow-zinc-900/10 dark:shadow-white/10"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Auditing...
            </>
          ) : (
            "Run Audit"
          )}
        </button>
      </div>
      
      <div className="mt-4 flex justify-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
        <span>Try:</span>
        <button 
          type="button" 
          onClick={() => {
            setQuery("Elon Musk");
            onSearch("Elon Musk");
          }}
          className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:underline transition-colors"
        >
          Elon Musk
        </button>
        <span>or</span>
        <button 
          type="button" 
          onClick={() => {
            setQuery("Walter White");
            onSearch("Walter White");
          }}
          className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:underline transition-colors"
        >
          Walter White
        </button>
      </div>
    </motion.form>
  );
}
