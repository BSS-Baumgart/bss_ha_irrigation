ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    nodejs \
    npm

# Copy and install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy pre-built frontend (built in CI or locally)
COPY frontend/dist /app/frontend/dist

# Copy backend source
COPY backend /app/backend

# Copy startup script
COPY run.sh /run.sh
RUN chmod +x /run.sh

WORKDIR /app

EXPOSE 8099

CMD ["/run.sh"]
