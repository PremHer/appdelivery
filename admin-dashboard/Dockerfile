# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Only copy package.json to force fresh install for Linux
COPY package.json ./

# Install dependencies fresh for this platform
RUN npm install

COPY . .

RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
