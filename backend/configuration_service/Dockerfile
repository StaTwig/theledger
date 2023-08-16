FROM node:lts-alpine3.13

WORKDIR /src

COPY . /src

RUN yarn --production

EXPOSE 3020

CMD yarn start