FROM node:20-alpine
RUN apk add --no-cache tzdata
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
COPY shared/ /app/shared/
EXPOSE 4000
CMD ["node", "src/server.js"]
