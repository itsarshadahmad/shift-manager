# Deployment Guide

ShiftFlow is designed to be cloud-agnostic and can be deployed on any platform that supports Node.js and PostgreSQL.

## Environment Loading

- Local development: the app reads `.env` automatically.
- Cloud hosting: set environment variables in your provider dashboard/CLI (do not commit `.env`).
- Required: `DATABASE_URL` and `SESSION_SECRET`.

## Build for Production

```bash
npm run build
```

This creates:
- `dist/index.cjs` - Compiled server
- `dist/public/` - Static frontend assets

## Start Production Server

```bash
NODE_ENV=production node dist/index.cjs
```

## Deployment Options

### Option 1: AWS (Amazon Web Services)

#### Using AWS EC2

1. **Launch EC2 Instance** (Ubuntu 22.04 LTS, t3.small or larger)

2. **Install Node.js 20+:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Set up PostgreSQL (RDS):**
   - Create an RDS PostgreSQL 15 instance
   - Note the endpoint, port, username, and password

4. **Deploy the application:**
   ```bash
   git clone <repo-url> /opt/shiftflow
   cd /opt/shiftflow
   npm install --production=false
   npm run build
   ```

5. **Configure environment:**
   ```bash
   cat > .env <<EOF
   DATABASE_URL=postgresql://admin:password@your-rds-endpoint:5432/shiftflow?sslmode=require
   SESSION_SECRET=$(openssl rand -hex 32)
   PORT=5000
   NODE_ENV=production
   EOF
   ```

6. **Initialize database:**
   ```bash
   npm run db:push
   ```

7. **Set up systemd service:**
   ```bash
   sudo cat > /etc/systemd/system/shiftflow.service <<EOF
   [Unit]
   Description=ShiftFlow Employee Scheduler
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/opt/shiftflow
   EnvironmentFile=/opt/shiftflow/.env
   ExecStart=/usr/bin/node dist/index.cjs
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   EOF

   sudo systemctl enable shiftflow
   sudo systemctl start shiftflow
   ```

8. **Set up Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Using AWS Elastic Beanstalk

1. Install the EB CLI: `pip install awsebcli`
2. Initialize: `eb init --platform node.js`
3. Create environment: `eb create shiftflow-prod`
4. Set environment variables:
   ```bash
   eb setenv DATABASE_URL=postgresql://... SESSION_SECRET=... NODE_ENV=production
   ```

### Option 2: Microsoft Azure

#### Using Azure App Service

1. **Create App Service:**
   ```bash
   az webapp create \
     --resource-group myResourceGroup \
     --plan myAppServicePlan \
     --name shiftflow-app \
     --runtime "NODE:20-lts"
   ```

2. **Create Azure Database for PostgreSQL:**
   ```bash
   az postgres flexible-server create \
     --resource-group myResourceGroup \
     --name shiftflow-db \
     --admin-user adminuser \
     --admin-password YourPassword123!
   ```

3. **Configure environment variables:**
   ```bash
   az webapp config appsettings set \
     --resource-group myResourceGroup \
     --name shiftflow-app \
     --settings \
       DATABASE_URL="postgresql://adminuser:YourPassword123!@shiftflow-db.postgres.database.azure.com:5432/shiftflow?sslmode=require" \
       SESSION_SECRET="$(openssl rand -hex 32)" \
       NODE_ENV="production"
   ```

4. **Deploy:**
   ```bash
   npm run build
   az webapp deployment source config-zip \
     --resource-group myResourceGroup \
     --name shiftflow-app \
     --src deploy.zip
   ```

### Option 3: IBM Cloud

#### Using IBM Cloud Code Engine

1. **Create a Code Engine project:**
   ```bash
   ibmcloud ce project create --name shiftflow
   ```

2. **Create IBM Cloud Databases for PostgreSQL** from the IBM Cloud dashboard

3. **Build and deploy:**
   ```bash
   npm run build
   ibmcloud ce application create \
     --name shiftflow \
     --build-source . \
     --env DATABASE_URL="postgresql://..." \
     --env SESSION_SECRET="$(openssl rand -hex 32)" \
     --env NODE_ENV="production" \
     --port 5000
   ```

### Option 4: Docker (Any Platform)

This repo already includes a hardened multi-stage `Dockerfile` and `docker-compose.yml`.

Build and run:

```bash
docker compose up --build -d
```

Initialize the database schema:

```bash
docker compose exec app npm run db:push
```

View logs:

```bash
docker compose logs -f app
```

Stop:

```bash
docker compose down
```

### Option 5: Railway / Render / Fly.io

These platforms auto-detect Node.js and can deploy directly from Git:

1. Connect your repository
2. Set environment variables (DATABASE_URL, SESSION_SECRET, NODE_ENV=production)
3. Set build command: `npm run build`
4. Set start command: `node dist/index.cjs`
5. Add a PostgreSQL database from the platform's addon marketplace

## Health Check

The application serves on a single port. You can use `/api/auth/me` as a health check endpoint (returns 401 for unauthenticated requests, confirming the server is running).

## SSL/TLS

For production, always use HTTPS. Options:
- **Cloud load balancers**: AWS ALB, Azure Application Gateway, etc.
- **Reverse proxy**: Nginx with Let's Encrypt certificates
- **Platform-managed**: Railway, Render, Fly.io handle SSL automatically

## Backup

For database backups:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

Restore:
```bash
psql $DATABASE_URL < backup_file.sql
```

## Monitoring

Recommended monitoring tools (all cloud-agnostic):
- **Application**: PM2 with `pm2 start dist/index.cjs`
- **Uptime**: UptimeRobot, Pingdom, or similar
- **Logs**: Use `NODE_ENV=production` for structured logging
