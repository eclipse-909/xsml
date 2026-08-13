#!/usr/bin/env node
/**
 * Simple static file server for a client-side-routed SPA.
 *
 * Serves everything (js, css, assets, etc.) from a given directory and
 * falls back to index.html for any route that isn't a real file, so your
 * CSR router can handle the path on the client.
 *
 * Usage:
 *   node server.js <directory> [port]
 *   node server.js ./dist 3000
 *
 * Env vars (used if args aren't given):
 *   SERVE_DIR   - directory to serve (default: ./dist)
 *   PORT        - port to listen on (default: 3000)
 */

const path = require('path');
const fs = require('fs');
const express = require('express');

// --- Resolve config from CLI args / env vars / defaults ---
const dirArg = process.argv[2] || process.env.SERVE_DIR || './dist';
const portArg = process.argv[3] || process.env.PORT || 3000;

const serveDir = path.resolve(process.cwd(), dirArg);
const port = Number(portArg);

if (!fs.existsSync(serveDir)) {
    console.error(`Directory not found: ${serveDir}`);
    process.exit(1);
}

const indexPath = path.join(serveDir, 'index.html');
if (!fs.existsSync(indexPath)) {
    console.error(`No index.html found in: ${serveDir}`);
    process.exit(1);
}

const app = express();

// Serve static assets (js, css, images, fonts, etc.) with sane caching.
app.use(
    express.static(serveDir, {
        index: 'index.html',
        // Don't cache index.html itself so deploys/updates show up immediately.
        setHeaders: (res, filePath) => {
            if (path.basename(filePath) === 'index.html') {
                res.setHeader('Cache-Control', 'no-cache');
            }
        },
    })
);

// SPA fallback: any request that isn't a static file falls through to
// index.html so the client-side router can take over.
app.use((req, res) => {
    res.sendFile(indexPath);
});

app.listen(port, () => {
    console.log(`Serving "${serveDir}"`);
    console.log(`Listening on http://localhost:${port}`);
});