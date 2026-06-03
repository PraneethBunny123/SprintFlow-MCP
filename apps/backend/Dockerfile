FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/domain/package*.json ./packages/domain/

RUN npm install

CMD ["npm", "run", "dev:backend"]