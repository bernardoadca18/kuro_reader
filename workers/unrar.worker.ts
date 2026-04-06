import { createExtractorFromData } from 'unrar-js';
import JSZip from 'jszip';

self.onmessage = async (e: MessageEvent) => {
  const { file, type } = e.data;

  try {
    if (type === 'cbz' || file.name.toLowerCase().endsWith('.cbz')) {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const files = Object.keys(content.files)
        .filter((name) => /\.(jpg|jpeg|png|webp|gif)$/i.test(name))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      const pages = await Promise.all(
        files.map(async (name) => {
          const blob = await content.files[name].async('blob');
          return { name, blob };
        })
      );

      self.postMessage({ type: 'success', pages });
    } else if (type === 'cbr' || file.name.toLowerCase().endsWith('.cbr')) {
      const arrayBuffer = await file.arrayBuffer();
      const extractor = await createExtractorFromData(new Uint8Array(arrayBuffer));
      const list = extractor.getFileList();
      
      const fileHeaders = [...list.fileHeaders]
        .filter((h) => !h.flags.directory && /\.(jpg|jpeg|png|webp|gif)$/i.test(h.name))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      const extracted = extractor.extractFiles(fileHeaders.map(h => h.name));
      const pages = Array.from(extracted.files).map((f: any) => {
        return {
          name: f.fileHeader.name,
          blob: new Blob([f.extraction], { type: 'image/jpeg' }) // Most CBRs are JPEGs
        };
      });

      self.postMessage({ type: 'success', pages });
    } else {
      throw new Error('Unsupported file format');
    }
  } catch (error: any) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
