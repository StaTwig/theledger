FROM node:lts AS react_build 

ENV NODE_ENV=production

WORKDIR /app

COPY . /app/

RUN yarn install && yarn run build

FROM nginx:stable-alpine

COPY --from=react_build /app /usr/share/nginx/html

# COPY . /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/conf.d

EXPOSE 80 

CMD ["nginx","-g","daemon off;"]