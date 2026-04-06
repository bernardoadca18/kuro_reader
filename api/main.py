import io
import os
import re
import rarfile
import zipfile
import base64
from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kuro Reader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComicProcessor:
    ALLOWED_EXTENSIONS = {'.cbr', '.cbz', '.rar', '.zip'}

    @staticmethod
    def natural_sort_key(s):
        """Chave para ordenação natural (ex: 'page10' vem depois de 'page2')."""
        return [int(text) if text.isdigit() else text.lower() for text in re.split('([0-9]+)', s)]

    @staticmethod
    def is_image(filename: str) -> bool:
        return filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif'))

    def _to_base64(self, data: bytes) -> str:
        encoded = base64.b64encode(data).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"

    def process(self, file_bytes: bytes, filename: str):
        extension = os.path.splitext(filename)[1].lower()
        
        # Seleciona o extrator correto
        if extension in {'.cbr', '.rar'}:
            return self._extract(rarfile.RarFile, file_bytes)
        else:
            return self._extract(zipfile.ZipFile, file_bytes)

    def _extract(self, handler, data: bytes):
        try:
            with handler(io.BytesIO(data)) as archive:
                # Ordenação Natural aplicada aqui
                names = sorted(
                    [n for n in archive.namelist() if self.is_image(n)], 
                    key=self.natural_sort_key
                )
                return [self._to_base64(archive.open(name).read()) for name in names]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

processor = ComicProcessor()

@app.post("/extract")
async def extract_comic(file: UploadFile = File(...)):
    if not any(file.filename.lower().endswith(ext) for ext in ComicProcessor.ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Formato inválido.")
    
    content = await file.read()
    pages = processor.process(content, file.filename)
    return {"pages": pages}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)