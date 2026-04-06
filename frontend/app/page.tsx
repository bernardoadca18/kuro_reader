'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Reader } from '@/components/Reader';
import { useCbrParser } from '@/hooks/useCbrParser';
import { saveRecentRead, ComicMetadata } from '@/lib/db';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [initialPage, setInitialPage] = useState(0);

  const handleSuccess = useCallback((extractedPages: any[]) => {
    if (currentFile) {
      setIsReaderOpen(true);
      
      // Generate a thumbnail (first page)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const thumbnail = reader.result as string;
        await saveRecentRead({
          id: `${currentFile.name}-${currentFile.size}`,
          name: currentFile.name,
          lastRead: Date.now(),
          currentPage: initialPage,
          totalPages: extractedPages.length,
          thumbnail: thumbnail
        });
      };
      reader.readAsDataURL(extractedPages[0].blob);
    }
  }, [currentFile, initialPage]);

  const { parseFile, pages, isLoading, error, clearPages } = useCbrParser(handleSuccess);

  const handleFileSelect = (file: File) => {
    setCurrentFile(file);
    parseFile(file);
    setInitialPage(0);
  };

  const handleRecentSelect = (metadata: ComicMetadata) => {
    // Since we don't store the file in IDB (too big), we ask the user to re-upload
    // or we could use the File System Access API if supported.
    // For now, we'll just show a message or if we had the file handle we'd use it.
    // Actually, a better UX is to just open the file picker again if the file isn't in memory.
    // But for this demo, let's assume the user just uploaded it.
    alert('In a full app, we would use the File System Access API to re-open this file. For now, please re-upload the file.');
  };

  const handleCloseReader = () => {
    setIsReaderOpen(false);
    clearPages();
    setCurrentFile(null);
  };

  return (
    <main className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
          >
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-xl font-medium text-white">Decompressing Archive</p>
              <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Processing pages on-device</p>
            </div>
          </motion.div>
        ) : isReaderOpen && pages.length > 0 && currentFile ? (
          <motion.div
            key="reader"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Reader 
              pages={pages} 
              onClose={handleCloseReader} 
              initialPage={initialPage}
              comicId={`${currentFile.name}-${currentFile.size}`}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard 
              onFileSelect={handleFileSelect} 
              onRecentSelect={handleRecentSelect} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 backdrop-blur-md text-white rounded-2xl shadow-2xl z-[200] flex items-center gap-3 border border-red-400/20">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => window.location.reload()} className="text-xs underline opacity-80 hover:opacity-100">Retry</button>
        </div>
      )}
    </main>
  );
}
