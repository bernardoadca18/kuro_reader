import { get, set, del, keys } from 'idb-keyval';

export interface ComicMetadata {
  id: string;
  name: string;
  lastRead: number;
  currentPage: number;
  totalPages: number;
  thumbnail?: string; // Base64 or Object URL (though Object URL is temporary)
}

const METADATA_KEY = 'kuro_recent_reads';

export async function saveRecentRead(metadata: ComicMetadata) {
  const recent = (await get<ComicMetadata[]>(METADATA_KEY)) || [];
  const filtered = recent.filter((m) => m.id !== metadata.id);
  const updated = [metadata, ...filtered].slice(0, 20); // Keep last 20
  await set(METADATA_KEY, updated);
}

export async function getRecentReads(): Promise<ComicMetadata[]> {
  return (await get<ComicMetadata[]>(METADATA_KEY)) || [];
}

export async function removeRecentRead(id: string) {
  const recent = (await get<ComicMetadata[]>(METADATA_KEY)) || [];
  const updated = recent.filter((m) => m.id !== id);
  await set(METADATA_KEY, updated);
}

// For caching the actual blobs if we want, but CBRs can be huge.
// For now, we'll just store metadata and re-load the file.
// If the user uploads the same file, we can match by name/size hash.
