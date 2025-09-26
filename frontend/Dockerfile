# Frontend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY vite.config.js ./
COPY index.html ./
COPY src ./src
RUN npm install && npm run build
EXPOSE 5173
CMD ["npx", "vite", "preview", "--host"]
