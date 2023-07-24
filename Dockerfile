FROM node:18

WORKDIR /user/src/app

COPY package*.json ./

RUN npm ci --omit-dev

COPY . .

RUN npx tsc

CMD ["node", "build/index.js"]
