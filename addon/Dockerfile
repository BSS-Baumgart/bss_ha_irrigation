ARG BUILD_FROM
FROM ${BUILD_FROM}

RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    nodejs \
    npm

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent

COPY frontend/ ./
RUN npm run build

RUN mkdir -p /app/frontend && cp -r /build/frontend/dist /app/frontend/dist

COPY backend /app/backend

COPY rootfs /
RUN chmod a+x /etc/s6-overlay/s6-rc.d/irrigation-bss/run

WORKDIR /app
EXPOSE 8099
