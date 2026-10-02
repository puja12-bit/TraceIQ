FROM node:24-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --omit=dev

# Copy server and built scripts (wait, ts-node or tsx can run it directly)
RUN npm install -g tsx typescript

# Copy source
COPY src/lib/intelligence/ ./src/lib/intelligence/
COPY scripts/vertex-embed.ts ./scripts/vertex-embed.ts
COPY server/index.ts ./server/index.ts
COPY tsconfig*.json ./

# Expose port
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Run server
CMD ["tsx", "server/index.ts"]
