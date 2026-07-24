# Deployment Checklist

Use this checklist before deploying LombokQRCode to production.

## Pre-release

- [ ] Run `npm run lint` — ensure no TypeScript errors
- [ ] Run `npm run build` — dist/ compiles successfully
- [ ] Review `docs/VALIDATION.md` — confirm test results are acceptable
- [ ] Update `CHANGELOG.md` with version and date
- [ ] Bump version in `package.json` (follow semver)
- [ ] Commit changes: `git commit -am "chore: v0.x.x"`
- [ ] Tag release: `git tag v0.x.x`
- [ ] Push commits and tags: `git push && git push --tags`

## npm Registry

- [ ] Ensure `NPM_TOKEN` is set in GitHub Actions secrets (for auto-publish on tag)
- [ ] Verify `package.json` fields:
  - `name` is unique and lowercase
  - `version` matches git tag (without `v` prefix)
  - `license` is "Apache-2.0"
  - `main` points to `dist/index.js` (CommonJS)
  - `module` points to `dist/index.mjs` (ESM)
  - `types` points to `dist/index.d.ts`
  - `files` array excludes source, docs, examples
- [ ] Test local publish: `npm pack` and inspect tarball contents
- [ ] GitHub Actions workflow runs and publishes automatically on tag push

## CDN / unpkg

- [ ] After npm publish, verify at https://unpkg.com/lombokqrcode@VERSION/dist/index.mjs
- [ ] Test in a browser: `<script src="https://unpkg.com/lombokqrcode/dist/index.mjs" type="module">`
- [ ] Cache-Control headers are set (long-lived for versioned URLs)

## Docker

- [ ] Build locally: `docker build -t codinglombok/lombokqrcode:latest .`
- [ ] Test container: `docker run -p 3000:3000 codinglombok/lombokqrcode:latest`
- [ ] Push to registry: `docker push codinglombok/lombokqrcode:latest`

## GitHub Pages (optional docs site)

- [ ] Add GitHub Pages deployment workflow (if desired)
- [ ] Or manually upload `docs/` to a static host and set DNS

## Static Hosting (Niagahoster, VPS, etc.)

- [ ] Upload `dist/` folder to web server
- [ ] Set cache headers: `Cache-Control: public, max-age=31536000` for versioned bundles
- [ ] Set cache headers: `Cache-Control: public, max-age=3600` for `latest/` symlink
- [ ] Test accessibility: `curl https://your-cdn.com/lombokqrcode/index.mjs`
- [ ] Verify CORS headers if serving to cross-origin clients

## Packagist (PHP via npm wrapper)

- [ ] Create `composer.json` wrapper repo pointing to npm package
- [ ] Register at https://packagist.org/
- [ ] Test via Composer: `composer require codinglombok/lombokqrcode`

## AWS S3 + CloudFront

- [ ] Create S3 bucket
- [ ] Upload `dist/` with `--cache-control max-age=31536000`
- [ ] Create CloudFront distribution pointing to S3
- [ ] Invalidate cache after new releases
- [ ] Test via CloudFront URL

## Post-deployment

- [ ] Test in all supported frameworks (vanilla, React, Vue, Node)
- [ ] Verify TypeScript types resolve in consumer projects
- [ ] Test deep imports: `import { encodeQR } from 'lombokqrcode/dist/core/qr/encoder.mjs'`
- [ ] Smoke test: generate a QR code, scan with a phone
- [ ] Monitor npm stats and GitHub issues for early problems

## Rollback plan

- [ ] If a critical bug is found, publish a patch immediately (don't wait for a batch of fixes)
- [ ] Tag patch as `v0.x.x+1` following semver
- [ ] Deprecate broken version in npm if needed: `npm deprecate lombokqrcode@0.x.x "Use 0.x.(x+1) instead"`
