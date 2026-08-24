FROM node:24-alpine AS angular
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM httpd:alpine

COPY --from=angular /app/dist/todo-app/browser/ /usr/local/apache2/htdocs/
RUN mv /usr/local/apache2/htdocs/index.csr.html /usr/local/apache2/htdocs/index.html
COPY --from=angular /app/dist/todo-app ./
