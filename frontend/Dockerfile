FROM node:16.15.1 AS react_build 

WORKDIR /app

COPY package.json /app/

RUN npm cache clean --force

RUN npm install --legacy-peer-deps

COPY . /app/

ENV NODE_ENV=production

ARG ENVIRONMENT

ENV REACT_APP_ENVIRONMENT=$ENVIRONMENT

ARG SERVER_URL

ENV REACT_APP_SERVER_URL=$SERVER_URL

ARG GOOGLE_CLIENT_ID

ENV REACT_APP_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

RUN npm run build 

FROM nginx:stable-alpine

COPY --from=react_build /app/build/ /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/conf.d

EXPOSE 80 

CMD ["nginx","-g","daemon off;"]
