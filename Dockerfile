# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

# Tools stage (includes devDependencies) for one-off commands like db:push.
FROM deps AS tools
COPY . .

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# tini handles signal forwarding and zombie reaping
RUN apk add --no-cache tini

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./.env.example
COPY package*.json ./

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||5000;const req=http.get({host:'127.0.0.1',port,path:'/'},res=>process.exit(res.statusCode<500?0:1));req.on('error',()=>process.exit(1));req.setTimeout(3000,()=>{req.destroy();process.exit(1);});"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.cjs"]
