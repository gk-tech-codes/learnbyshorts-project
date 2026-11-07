#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const siteRoot = path.resolve('frontend');
const htmlFiles = [];
const jsonFiles = [];
const failures = [];

function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.isFile()) {
            if (entry.name.endsWith('.html')) htmlFiles.push(fullPath);
            if (entry.name.endsWith('.json')) jsonFiles.push(fullPath);
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

function checkHtmlIntegrity(file, html) {
    const relative = path.relative(siteRoot, file);
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    for (const id of new Set(duplicates)) {
        failures.push(`${relative} contains duplicate id "${id}"`);
    }

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
        if (!/\balt=["'][^"']*["']/i.test(match[0])) {
            failures.push(`${relative} contains an image without alt text`);
        }
    }

    for (const match of html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)) {
        if (!/\brel=["'][^"']*\bnoopener\b[^"']*["']/i.test(match[0])) {
            failures.push(`${relative} opens a new tab without rel="noopener"`);
        }
    }

    if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
        failures.push(`${relative} is missing an html lang attribute`);
    }
    if (!/<meta\b[^>]*\bname=["']viewport["']/i.test(html)) {
        failures.push(`${relative} is missing a viewport meta tag`);
    }
    if (!/<title\b[^>]*>[^<]+<\/title>/i.test(html)) {
        failures.push(`${relative} is missing a document title`);
    }
}

walk(siteRoot);

for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    checkJsonLd(file, html);
    checkLocalLinks(file, html);
    checkHtmlIntegrity(file, html);
}

for (const file of jsonFiles) {
    try {
        JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        failures.push(`${path.relative(siteRoot, file)} has invalid JSON: ${error.message}`);
    }
}

if (failures.length > 0) {
    console.error([...new Set(failures)].join('\n'));
    process.exit(1);
}

console.log(
    `Validated links, metadata, accessibility basics, ${jsonFiles.length} JSON files, ` +
    `and JSON-LD in ${htmlFiles.length} HTML files.`
);
