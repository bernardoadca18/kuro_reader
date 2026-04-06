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
  url: string; // Mudamos de blob para url (string base64)
  index: number;
  currentPage: number;
  readingMode: 'single' | 'scroll';
  filterStyle: React.CSSProperties;
  zoom?: number;
}

const ComicPageItem: React.FC<ComicPageItemProps> = ({ url, index, currentPage, readingMode, filterStyle, zoom = 1 }) => {
  // A lógica de createObjectURL foi removida porque o Base64 já é a URL final.
  // Mantemos o controle de visibilidade apenas para performance de renderização.
  const isVisible = Math.abs(index - currentPage) <= 3;

  if (!isVisible && readingMode === 'single') return null;

  return (
    <img
      src={url}
      alt={`Page ${index + 1}`}
      className={`${readingMode === 'single' ? 'max-w-full max-h-full shadow-2xl' : 'w-full h-auto'} object-contain`}
      style={{ ...filterStyle, transform: readingMode === 'single' ? `scale(${zoom})` : undefined }}
      // 'lazy' ajuda no carregamento do modo scroll
      loading="lazy" 
      // Desabilitamos o aviso do Next.js pois são imagens dinâmicas e locais (base64)
      decoding="async"
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

  const showHud = useCallback(() => {
    setHudVisible(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    
    if (readingMode === 'single') {
      hudTimeoutRef.current = setTimeout(() => {
        setHudVisible(false);
      }, 3000);
    }
  }, [readingMode]);

  useEffect(() => {
    return () => {
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, []);

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

  const handleModeChange = (mode: 'single' | 'scroll') => {
    setReadingMode(mode);
    showHud();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') mangaMode ? prevPage() : nextPage();
      else if (e.key === 'ArrowLeft') mangaMode ? nextPage() : prevPage();
      else if (e.key === 'm' || e.key === 'M') setHudVisible(v => !v);
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
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
      className="fixed inset-0 bg-[#050505] z-50 overflow-hidden select-none"
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
        <div className="w-full h-full flex items-center justify-center relative p-4">
          <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); mangaMode ? nextPage() : prevPage(); }} />
          <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); mangaMode ? prevPage() : nextPage(); }} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: mangaMode ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mangaMode ? 10 : -10 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex items-center justify-center"
            >
              <ComicPageItem 
                url={pages[currentPage].url}
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
            const scrollPos = target.scrollTop + target.clientHeight / 3;
            const pageHeight = target.scrollHeight / pages.length;
            const newPage = Math.floor(scrollPos / pageHeight);
            if (newPage !== currentPage) setCurrentPage(newPage);
          }}
        >
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 py-8">
            {pages.map((page, index) => (
              <ComicPageItem 
                key={index}
                url={page.url}
                index={index}
                currentPage={currentPage}
                readingMode="scroll"
                filterStyle={filterStyle}
              />
            ))}
          </div>
        </div>
      )}

      {!hudVisible && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full text-[12px] font-mono text-white/80 border border-white/10">
          {currentPage + 1} / {pages.length}
        </div>
      )}
    </div>
  );
};