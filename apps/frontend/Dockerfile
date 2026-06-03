FROM node:22

WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/domain/package*.json ./packages/domain/

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev:frontend"]