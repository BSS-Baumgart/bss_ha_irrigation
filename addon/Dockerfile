ARG BUILD_FROM
FROM ${BUILD_FROM}

# ── System deps ──────────────────────────────────────────────────────────────
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    nodejs \
    npm

# ── Python dependencies ───────────────────────────────────────────────────────
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# ── Frontend build (inside container) ────────────────────────────────────────
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent

COPY frontend/ ./
RUN npm run build

# ── Copy artifacts ────────────────────────────────────────────────────────────
RUN mkdir -p /app/frontend && cp -r /build/frontend/dist /app/frontend/dist

# ── Backend source ────────────────────────────────────────────────────────────
COPY backend /app/backend

# ── Startup ───────────────────────────────────────────────────────────────────
COPY run.sh /run.sh
RUN chmod +x /run.sh

WORKDIR /app
EXPOSE 8099
CMD ["/run.sh"]
