FROM node:24

WORKDIR /user/src/app

COPY . .

RUN npm ci --omit-dev

RUN npx tsc

CMD ["node", "build/index.js"]
