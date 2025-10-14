FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install && npm audit fix

COPY . .

CMD ["node", "index.js"]
