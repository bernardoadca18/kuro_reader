'use client';

import { useState, useCallback } from 'react';

export interface ComicPage {
  name: string;
  url: string;
}

export function useCbrParser() {
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha na extração pelo servidor');

      const data = await response.json();
      const comicPages = data.pages.map((b64: string, index: number) => ({
        name: `Page ${index}`,
        url: b64 
      }));
      
      setPages(comicPages);
      return comicPages;
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com a API');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPages = useCallback(() => setPages([]), []);

  return { parseFile, pages, isLoading, error, clearPages };
}