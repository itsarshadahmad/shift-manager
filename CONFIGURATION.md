# Configuration Guide

## Environment Variables

ShiftFlow uses environment variables for all configuration. Create a `.env` file in the project root, or set them in your hosting platform.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `SESSION_SECRET` | Secret key for JWT token signing (min 32 chars) | `a-long-random-string-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

## Database Configuration

ShiftFlow uses PostgreSQL. The `DATABASE_URL` should follow this format:

```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=[mode]
```

### Examples

**Local PostgreSQL:**
```
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/shiftflow
```

**AWS RDS:**
```
DATABASE_URL=postgresql://admin:secretpass@mydb.abc123.us-east-1.rds.amazonaws.com:5432/shiftflow?sslmode=require
```

**Azure Database for PostgreSQL:**
```
DATABASE_URL=postgresql://admin@myserver:password@myserver.postgres.database.azure.com:5432/shiftflow?sslmode=require
```

**IBM Cloud Databases:**
```
DATABASE_URL=postgresql://admin:password@host-0.databases.appdomain.cloud:32459/shiftflow?sslmode=verify-full
```

### SSL Configuration

For cloud databases that require SSL:
- Append `?sslmode=require` to the DATABASE_URL
- For strict verification: `?sslmode=verify-full`

## Security Notes

1. **SESSION_SECRET**: Use a cryptographically strong random string (32+ characters). Generate one with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Database passwords**: Use strong passwords with special characters

3. **Production mode**: Always set `NODE_ENV=production` in production to:
   - Enable secure cookies (HTTPS only)
   - Serve static files from the build directory
   - Disable development-only features

## Port Configuration

The server binds to a single port that serves both the API and the frontend:

- **Development**: Vite dev server with HMR is proxied through Express
- **Production**: Static files are served from the `dist/public` directory

If running behind a reverse proxy (Nginx, Apache, etc.), configure the proxy to forward to the configured port.


## Local Setup Checklist

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your local or cloud Postgres URL.
3. Run `npm run db:push`.
4. Run `npm run dev`.

If you see `DATABASE_URL must be set`, your `.env` file is missing, is in the wrong folder, or does not include `DATABASE_URL`.
