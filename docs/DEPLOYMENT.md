# Deployment

This document covers publishing LombokQRCode to npm, CDN (unpkg), Docker, static hosts, and notes for other platforms.

## npm & unpkg

```bash
npm run build                # generates dist/ with .js, .mjs, .d.ts
npm version patch            # bump version in package.json, git tag
npm publish                  # requires npm login
```

After publishing, the package is instantly available at:
- **npm:** `npm install lombokqrcode`
- **unpkg:** `https://unpkg.com/lombokqrcode/dist/index.mjs` (ESM), or the `.js` CommonJS build
- **jsdelivr:** `https://cdn.jsdelivr.net/npm/lombokqrcode`

Packagist (PHP): create a thin `composer.json` wrapper in a separate repo that fetches the npm package:
```json
{
  "name": "codinglombok/lombokqrcode",
  "type": "library",
  "description": "QR/barcode encoder JS library (npm package wrapper)",
  "require": { "php": ">=7.0" },
  "dist": {
    "url": "https://registry.npmjs.org/lombokqrcode/-/lombokqrcode-{version}.tgz",
    "type": "tar"
  }
}
```

Register the repo at https://packagist.org.

## GitHub Actions CI/CD

See `.github/workflows/ci.yml` and `.github/workflows/publish.yml` for:
- Build + typecheck on every push
- Automated npm publish on git tag (`v*`)
- (Optional) docs site deploy to GitHub Pages

## Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.build.json ./
COPY src ./src
RUN npm ci && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and push:
```bash
docker build -t codinglombok/lombokqrcode:latest .
docker push codinglombok/lombokqrcode:latest
```

## Static hosting (Niagahoster, shared hosting, VPS)

The npm package itself is already static (no server runtime needed). To serve the dist files:

1. Build locally: `npm run build`
2. Upload `dist/` and `README.md` to your host via FTP/sftp/rsync
3. Serve from a CDN or static-file HTTP server (nginx, Apache)

Example nginx config:
```nginx
server {
  listen 80;
  server_name cdn.example.com;
  root /var/www/lombokqrcode;
  
  location / {
    add_header Cache-Control "public, max-age=31536000";
    expires 1y;
  }
  
  location /latest/ {
    add_header Cache-Control "public, max-age=3600";
    rewrite ^/latest/(.*)$ /$1 break;
  }
}
```

## AWS (S3 + CloudFront)

```bash
aws s3 sync dist/ s3://your-bucket/lombokqrcode/ --cache-control max-age=31536000
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

## Packagist / PHP

Already covered above under npm & unpkg.

## Google, SourceForge

These are legacy mirrors; if you choose to post there:
- **Google Code Archive:** static snapshot import only (no longer accepts new projects)
- **SourceForge:** via their web upload or git mirror

Neither is recommended for active maintenance.

## Version pinning for production

Always pin to a specific version in `package.json`:
```json
{
  "dependencies": {
    "lombokqrcode": "0.1.2"
  }
}
```

Not `^0.1.2` or `~0.1.2` until you've tested the newer version.
