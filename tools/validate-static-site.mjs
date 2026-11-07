#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const siteRoot = path.resolve('frontend');
const htmlFiles = [];
const failures = [];

function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            htmlFiles.push(fullPath);
        }
    }
}

function checkJsonLd(file, html) {
    const jsonLdPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    for (const match of html.matchAll(jsonLdPattern)) {
        try {
            JSON.parse(match[1]);
        } catch (error) {
            failures.push(`${path.relative(siteRoot, file)} has invalid JSON-LD: ${error.message}`);
        }
    }
}

function checkLocalLinks(file, html) {
    const assetPattern = /\b(?:href|src)=["']([^"']+)["']/gi;

    for (const match of html.matchAll(assetPattern)) {
        const originalUrl = match[1];
        if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(originalUrl)) {
            continue;
        }
        if (originalUrl.includes('${')) {
            continue;
        }

        const cleanUrl = originalUrl.split(/[?#]/)[0];
        if (!cleanUrl) {
            continue;
        }

        let target = cleanUrl.startsWith('/')
            ? path.join(siteRoot, cleanUrl)
            : path.resolve(path.dirname(file), cleanUrl);

        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
            target = path.join(target, 'index.html');
        }

        if (!fs.existsSync(target)) {
            failures.push(`${path.relative(siteRoot, file)} links to missing ${originalUrl}`);
        }
    }
}

walk(siteRoot);

for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    checkJsonLd(file, html);
    checkLocalLinks(file, html);
}

if (failures.length > 0) {
    console.error([...new Set(failures)].join('\n'));
    process.exit(1);
}

console.log(`Validated JSON-LD and local links in ${htmlFiles.length} HTML files.`);
