'use client';

import React, { useState, useCallback } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Reader } from '@/components/Reader';
import { useCbrParser } from '@/hooks/useCbrParser';
import { saveRecentRead } from '@/lib/db';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [initialPage, setInitialPage] = useState(0);

  const { parseFile, pages, isLoading, error, clearPages } = useCbrParser();

  const handleFileSelect = async (file: File) => {
    setCurrentFile(file);
    setInitialPage(0);
    
    // Chama a API e aguarda o resultado
    const extractedPages = await parseFile(file);
    
    if (extractedPages && extractedPages.length > 0) {
      setIsReaderOpen(true);
      
      // Salva no histórico usando o Base64 da primeira página como thumbnail
      await saveRecentRead({
        id: `${file.name}-${file.size}`,
        name: file.name,
        lastRead: Date.now(),
        currentPage: 0,
        totalPages: extractedPages.length,
        thumbnail: extractedPages[0].url // Já é a string Base64
      });
    }
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
              <p className="text-xl font-medium text-white">Processing Archive</p>
              <p className="text-white/40 text-sm font-mono uppercase tracking-widest text-balance">
                The Python API is decompressing and optimizing your images
              </p>
            </div>
          </motion.div>
        ) : isReaderOpen && pages.length > 0 && currentFile ? (
          <motion.div
            key="reader"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              onRecentSelect={(m) => alert("Please re-upload: " + m.name)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600 text-white rounded-xl shadow-2xl z-[200]">
          {error}
        </div>
      )}
    </main>
  );
}