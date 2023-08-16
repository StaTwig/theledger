FROM node:lts-alpine3.13

ENV NODE_ENV=production

WORKDIR /src

COPY package.json .

RUN yarn --production

COPY . .

EXPOSE 3005

CMD ["yarn", "start"]