FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng libreoffice-writer && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
COPY web ./web
COPY docs ./docs
COPY README.md ./README.md
RUN useradd -m -u 10001 talent && mkdir -p /app/data/resumes && chown -R talent:talent /app
USER talent
EXPOSE 8091
CMD ["uvicorn","backend.app:app","--host","0.0.0.0","--port","8091"]
