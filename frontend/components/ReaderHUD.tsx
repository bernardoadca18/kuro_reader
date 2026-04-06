'use client';

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Settings, 
  Layout, 
  Scroll, 
  ArrowLeftRight,
  Sun,
  Contrast,
  Palette,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReaderHUDProps {
  isVisible: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  readingMode: 'single' | 'scroll';
  setReadingMode: (mode: 'single' | 'scroll') => void;
  mangaMode: boolean;
  setMangaMode: (mode: boolean) => void;
  filters: { brightness: number; contrast: number; sepia: number };
  setFilters: (filters: any) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export const ReaderHUD: React.FC<ReaderHUDProps> = ({
  isVisible,
  currentPage,
  totalPages,
  onPageChange,
  onClose,
  readingMode,
  setReadingMode,
  mangaMode,
  setMangaMode,
  filters,
  setFilters,
  isFullscreen,
  toggleFullscreen,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Top Bar */}
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-white/10"
          >
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Settings className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isFullscreen ? <Minimize className="w-6 h-6 text-white" /> : <Maximize className="w-6 h-6 text-white" />}
              </button>
            </div>
          </motion.div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center px-6 border-t border-white/10"
          >
            <div className="w-full max-w-2xl flex items-center gap-4">
              <span className="text-xs text-white/60 font-mono w-12 text-right">
                {currentPage + 1}
              </span>
              <input
                type="range"
                min={0}
                max={totalPages - 1}
                value={currentPage}
                onChange={(e) => onPageChange(parseInt(e.target.value))}
                className="flex-1 accent-white h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-xs text-white/60 font-mono w-12">
                {totalPages}
              </span>
            </div>
          </motion.div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="fixed top-20 right-6 w-72 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-50 shadow-2xl"
              >
                <h3 className="text-white font-medium mb-6 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Reading Settings
                </h3>

                <div className="space-y-6">
                  {/* Mode Toggle */}
                  <div className="space-y-3">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setReadingMode('single')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                          readingMode === 'single' ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Layout className="w-4 h-4" /> <span className="text-sm">Classic</span>
                      </button>
                      <button
                        onClick={() => setReadingMode('scroll')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                          readingMode === 'scroll' ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Scroll className="w-4 h-4" /> <span className="text-sm">Scroll</span>
                      </button>
                    </div>
                  </div>

                  {/* Manga Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white">Manga Mode (RTL)</span>
                    </div>
                    <button
                      onClick={() => setMangaMode(!mangaMode)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${mangaMode ? 'bg-white' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${mangaMode ? 'right-1 bg-black' : 'left-1 bg-white'}`} />
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/60">
                        <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                        <span>{filters.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={150}
                        value={filters.brightness}
                        onChange={(e) => setFilters({ ...filters, brightness: parseInt(e.target.value) })}
                        className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/60">
                        <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                        <span>{filters.contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={150}
                        value={filters.contrast}
                        onChange={(e) => setFilters({ ...filters, contrast: parseInt(e.target.value) })}
                        className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/60">
                        <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Sepia</span>
                        <span>{filters.sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filters.sepia}
                        onChange={(e) => setFilters({ ...filters, sepia: parseInt(e.target.value) })}
                        className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
