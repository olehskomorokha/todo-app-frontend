FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS final
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/dist/todo-app ./dist/todo-app

EXPOSE 4000
CMD ["node", "dist/todo-app/server/server.mjs"]
