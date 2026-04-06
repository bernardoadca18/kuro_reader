'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComicPage } from '@/hooks/useCbrParser';
import { ReaderHUD } from './ReaderHUD';

interface ReaderProps {
  pages: ComicPage[];
  onClose: () => void;
  initialPage?: number;
  comicId: string;
}

interface ComicPageItemProps {
  blob: Blob;
  index: number;
  currentPage: number;
  readingMode: 'single' | 'scroll';
  filterStyle: React.CSSProperties;
  zoom?: number;
}

const ComicPageItem: React.FC<ComicPageItemProps> = ({ blob, index, currentPage, readingMode, filterStyle, zoom = 1 }) => {
  const [url, setUrl] = useState<string | null>(null);
  const isVisible = Math.abs(index - currentPage) <= 5;

  useEffect(() => {
    if (isVisible && !url) {
      const newUrl = URL.createObjectURL(blob);
      setTimeout(() => setUrl(newUrl), 0);
    } else if (!isVisible && url) {
      URL.revokeObjectURL(url);
      setTimeout(() => setUrl(null), 0);
    }
  }, [isVisible, blob, url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (!url && !isVisible) return <div className="w-full h-screen bg-black/20 animate-pulse" />;
  if (!url) return null;

  return (
    <img
      src={url}
      alt={`Page ${index + 1}`}
      className={`${readingMode === 'single' ? 'max-w-full max-h-full shadow-2xl' : 'w-full h-auto'} object-contain`}
      style={{ ...filterStyle, transform: readingMode === 'single' ? `scale(${zoom})` : undefined }}
      loading="lazy"
    />
  );
};

export const Reader: React.FC<ReaderProps> = ({ pages, onClose, initialPage = 0, comicId }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [readingMode, setReadingMode] = useState<'single' | 'scroll'>('single');
  const [mangaMode, setMangaMode] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, sepia: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle HUD visibility
  const showHud = useCallback(() => {
    setHudVisible(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      if (readingMode === 'single') setHudVisible(false);
    }, 3000);
  }, [readingMode]);

  useEffect(() => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      if (readingMode === 'single') setHudVisible(false);
    }, 3000);
    return () => { if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current); };
  }, [readingMode]);

  const nextPage = useCallback(() => setCurrentPage(p => Math.min(pages.length - 1, p + 1)), [pages.length]);
  const prevPage = useCallback(() => setCurrentPage(p => Math.max(0, p - 1)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (mangaMode) prevPage(); else nextPage();
      } else if (e.key === 'ArrowLeft') {
        if (mangaMode) nextPage(); else prevPage();
      } else if (e.key === 'm' || e.key === 'M') {
        setHudVisible(v => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mangaMode, nextPage, prevPage, toggleFullscreen]);

  const filterStyle = {
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) sepia(${filters.sepia}%)`,
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-hidden cursor-none select-none"
      onMouseMove={showHud}
      onClick={showHud}
      style={{ cursor: hudVisible ? 'default' : 'none' }}
    >
      <ReaderHUD
        isVisible={hudVisible}
        currentPage={currentPage}
        totalPages={pages.length}
        onPageChange={setCurrentPage}
        onClose={onClose}
        readingMode={readingMode}
        setReadingMode={setReadingMode}
        mangaMode={mangaMode}
        setMangaMode={setMangaMode}
        filters={filters}
        setFilters={setFilters}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      {readingMode === 'single' ? (
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Click areas for navigation */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); mangaMode ? nextPage() : prevPage(); }} />
          <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); mangaMode ? prevPage() : nextPage(); }} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: mangaMode ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mangaMode ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center p-4"
            >
              <ComicPageItem 
                blob={pages[currentPage].blob}
                index={currentPage}
                currentPage={currentPage}
                readingMode="single"
                filterStyle={filterStyle}
                zoom={zoom}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div 
          ref={scrollRef}
          className="w-full h-full overflow-y-auto scroll-smooth bg-[#0a0a0a]"
          onScroll={(e) => {
            const target = e.currentTarget;
            const scrollPos = target.scrollTop + target.clientHeight / 2;
            const pageHeight = target.scrollHeight / pages.length;
            const newPage = Math.floor(scrollPos / pageHeight);
            if (newPage !== currentPage) setCurrentPage(newPage);
          }}
        >
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            {pages.map((page, index) => (
              <div key={index} className="w-full min-h-screen flex items-center justify-center py-2">
                <ComicPageItem 
                  blob={page.blob}
                  index={index}
                  currentPage={currentPage}
                  readingMode="scroll"
                  filterStyle={filterStyle}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Indicator (Floating) */}
      {!hudVisible && (
        <div className="fixed bottom-6 right-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-mono text-white/60 border border-white/10">
          {currentPage + 1} / {pages.length}
        </div>
      )}
    </div>
  );
};
