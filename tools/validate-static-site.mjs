#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const siteRoot = path.resolve('frontend');
const htmlFiles = [];
const jsonFiles = [];
const failures = [];
const courses = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'data/courses.json'), 'utf8')
);
const categories = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'data/categories.json'), 'utf8')
);
const courseIds = new Set(courses.courses.map(course => course.id));
const categoryIds = new Set(categories.categories.map(category => category.id));

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

function resolveLocalTarget(file, originalUrl) {
    const cleanUrl = originalUrl.split(/[?#]/)[0];
    if (!cleanUrl) return file;

    const target = cleanUrl.startsWith('/')
        ? path.resolve(siteRoot, `.${cleanUrl}`)
        : path.resolve(path.dirname(file), cleanUrl);
    const relativeTarget = path.relative(siteRoot, target);
    if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
        return null;
    }
    return target;
}

function htmlTarget(file, originalUrl) {
    let target = resolveLocalTarget(file, originalUrl);
    if (!target) return null;
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        target = path.join(target, 'index.html');
    }
    return target;
}

function checkKnownRouteParameters(file, originalUrl) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(originalUrl)) return;

    let parsed;
    try {
        parsed = new URL(originalUrl, 'https://local.learnbyshorts.test/');
    } catch {
        failures.push(`${path.relative(siteRoot, file)} has invalid URL ${originalUrl}`);
        return;
    }

    const route = path.posix.basename(parsed.pathname);
    const id = parsed.searchParams.get('id');
    if (
        id &&
        (route === 'course-detail.html' || route === 'course-player.html') &&
        !courseIds.has(id)
    ) {
        failures.push(
            `${path.relative(siteRoot, file)} links to unknown course id "${id}"`
        );
    }
    if (id && route === 'category.html' && !categoryIds.has(id)) {
        failures.push(
            `${path.relative(siteRoot, file)} links to unknown category id "${id}"`
        );
    }
}

function checkLocalLinks(file, html) {
    const assetPattern = /\b(?:href|src)=["']([^"']+)["']/gi;

    for (const match of html.matchAll(assetPattern)) {
        const originalUrl = match[1].trim();
        if (
            !originalUrl ||
            /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(originalUrl)
        ) {
            continue;
        }
        if (originalUrl.includes('${')) continue;

        const target = htmlTarget(file, originalUrl);
        if (!target) {
            failures.push(
                `${path.relative(siteRoot, file)} links outside the publish tree: ${originalUrl}`
            );
            continue;
        }
        if (!fs.existsSync(target)) {
            failures.push(`${path.relative(siteRoot, file)} links to missing ${originalUrl}`);
        }

        checkKnownRouteParameters(file, originalUrl);
    }
}

function checkAnchorTargets(file, html) {
    const anchorPattern = /<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi;
    const relative = path.relative(siteRoot, file);

    for (const match of html.matchAll(anchorPattern)) {
        const tag = match[0];
        const originalUrl = match[1].trim();
        if (!originalUrl || originalUrl === '#' || /^javascript:/i.test(originalUrl)) {
            failures.push(`${relative} contains a visible placeholder link: ${originalUrl || '(empty)'}`);
            continue;
        }
        if (/^(?:https?:|mailto:|tel:|data:)/i.test(originalUrl)) continue;

        checkKnownRouteParameters(file, originalUrl);

        const hashIndex = originalUrl.indexOf('#');
        if (hashIndex < 0) continue;

        const fragment = originalUrl.slice(hashIndex + 1);
        if (!fragment) {
            failures.push(`${relative} contains an empty anchor target: ${originalUrl}`);
            continue;
        }

        const marker = tag.match(/\bdata-dynamic-target=["']([^"']+)["']/i);
        const isHiddenDynamicTarget =
            marker?.[1] === `#${fragment}` && /\bhidden(?:\s|=|>)/i.test(tag);
        if (isHiddenDynamicTarget) continue;

        const target = htmlTarget(file, originalUrl);
        if (!target || !fs.existsSync(target) || !target.endsWith('.html')) continue;

        let decodedFragment;
        try {
            decodedFragment = decodeURIComponent(fragment);
        } catch {
            failures.push(`${relative} contains an invalid anchor encoding: ${originalUrl}`);
            continue;
        }
        const targetHtml = fs.readFileSync(target, 'utf8');
        const ids = new Set(
            [...targetHtml.matchAll(/\bid=["']([^"']+)["']/gi)].map(idMatch => idMatch[1])
        );
        if (!ids.has(decodedFragment)) {
            failures.push(`${relative} links to missing anchor ${originalUrl}`);
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
    checkAnchorTargets(file, html);
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
