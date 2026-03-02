import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ChevronRight, Trash2, AlertTriangle, History } from 'lucide-react';
import { getAudits, deleteAudit, clearAudits, type AuditData } from '@/lib/db';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (audit: AuditData) => void;
}

export function HistoryModal({ isOpen, onClose, onSelect }: HistoryModalProps) {
  const [history, setHistory] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setConfirmClear(false);
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const audits = await getAudits();
      setHistory(audits.reverse()); // Newest first
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteAudit(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Failed to delete audit:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAudits();
      setHistory([]);
      setConfirmClear(false);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
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
            className="fixed inset-0 m-auto w-full max-w-2xl h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Audit History</h2>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  confirmClear ? (
                    <div className="flex items-center gap-2 mr-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Are you sure?</span>
                      <button
                        onClick={handleClearAll}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg transition-colors border border-red-300 dark:border-red-500/20"
                      >
                        Yes, Clear All
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 mr-2"
                      title="Clear all history"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.length > 0 ? (
                history.map((audit) => (
                  <div
                    key={audit.id}
                    onClick={() => {
                      onSelect(audit);
                      onClose();
                    }}
                    className="w-full text-left group bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 hover:border-emerald-500/50 dark:hover:border-emerald-500/30 rounded-xl p-4 transition-all duration-300 flex items-center justify-between cursor-pointer relative pr-12 shadow-sm"
                  >
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {audit.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-mono">
                        {new Date(audit.createdAt).toLocaleDateString()} • {new Date(audit.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => audit.id && handleDelete(e, audit.id)}
                        className="p-2 text-zinc-400 dark:text-zinc-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 absolute right-12 top-1/2 -translate-y-1/2"
                        title="Delete audit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-500 flex flex-col items-center gap-4">
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <History className="w-8 h-8 text-zinc-400 dark:text-zinc-700" />
                  </div>
                  <p>No previous audits found.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
