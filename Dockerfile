FROM node:22-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY feesaathi-src.tar.gz .
RUN tar xzf feesaathi-src.tar.gz --strip-components=1 && rm feesaathi-src.tar.gz
RUN npm ci
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm","start"]
