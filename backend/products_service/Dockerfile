FROM node:16-bullseye-slim

ENV NODE_ENV=production

WORKDIR /src

COPY . /src

RUN mkdir images

RUN yarn --production

EXPOSE 3010

CMD ["yarn", "start"]