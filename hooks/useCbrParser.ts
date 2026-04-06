'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ComicPage {
  name: string;
  blob: Blob;
  url?: string;
}

export function useCbrParser(onSuccess?: (pages: ComicPage[]) => void) {
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/unrar.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { type, pages: extractedPages, message } = e.data;
      if (type === 'success') {
        setPages(extractedPages);
        setIsLoading(false);
        if (onSuccess) onSuccess(extractedPages);
      } else {
        setError(message || 'Failed to parse comic');
        setIsLoading(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [onSuccess]);

  const parseFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setPages([]);
    workerRef.current?.postMessage({ file });
  }, []);

  const clearPages = useCallback(() => {
    pages.forEach((p) => {
      if (p.url) URL.revokeObjectURL(p.url);
    });
    setPages([]);
  }, [pages]);

  return { parseFile, pages, isLoading, error, clearPages };
}
