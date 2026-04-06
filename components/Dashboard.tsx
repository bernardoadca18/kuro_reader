'use client';

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Book, Clock, Trash2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComicMetadata, getRecentReads, removeRecentRead } from '@/lib/db';

interface DashboardProps {
  onFileSelect: (file: File) => void;
  onRecentSelect: (metadata: ComicMetadata) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onFileSelect, onRecentSelect }) => {
  const [recent, setRecent] = useState<ComicMetadata[]>([]);

  useEffect(() => {
    getRecentReads().then(setRecent);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: {
      'application/x-cbr': ['.cbr'],
      'application/x-cbz': ['.cbz'],
      'application/zip': ['.cbz'],
      'application/x-rar-compressed': ['.cbr'],
    },
    multiple: false,
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeRecentRead(id);
    setRecent(await getRecentReads());
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Kuro Reader</h1>
          <p className="text-white/40 font-medium">Minimalist, private, high-performance comic reader.</p>
        </header>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-500 p-12 md:p-24 flex flex-col items-center justify-center gap-6 ${
            isDragActive ? 'border-white bg-white/5 scale-[0.99]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="p-6 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <Upload className={`w-10 h-10 transition-transform duration-500 ${isDragActive ? 'scale-110' : 'group-hover:-translate-y-1'}`} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-medium">Drop your .cbr or .cbz file here</p>
            <p className="text-white/40 text-sm">or click to browse your computer</p>
          </div>
        </div>

        {/* Recent Reads */}
        {recent.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-white/40" /> Recent Reads
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              <AnimatePresence>
                {recent.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => onRecentSelect(item)}
                    className="group relative cursor-pointer space-y-3"
                  >
                    <div className="aspect-[2/3] bg-white/5 rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-all">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-white/10" />
                        </div>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                        <div 
                          className="h-full bg-white transition-all" 
                          style={{ width: `${((item.currentPage + 1) / item.totalPages) * 100}%` }} 
                        />
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium truncate group-hover:text-white transition-colors">{item.name}</h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        Page {item.currentPage + 1} of {item.totalPages}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Footer / Info */}
        <footer className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between gap-8 text-white/20 text-xs font-mono uppercase tracking-widest">
          <div className="flex gap-8">
            <span className="flex items-center gap-2"><Book className="w-3 h-3" /> WASM Powered</span>
            <span>Client-side only</span>
          </div>
          <div>
            &copy; 2026 Kuro Reader
          </div>
        </footer>
      </div>
    </div>
  );
};
