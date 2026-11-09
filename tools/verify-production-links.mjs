#!/usr/bin/env node

import process from 'node:process';

const siteOrigin = new URL(
    process.env.SITE_ORIGIN || 'https://www.learnbyshorts.com'
);
const queue = [];
const queued = new Set();
const pages = new Map();
const fragmentExpectations = new Map();
const failures = [];
const maxPages = 150;

function enqueue(candidate) {
    const url = new URL(candidate, siteOrigin);
    url.hash = '';
    if (url.origin !== siteOrigin.origin || !isPageRoute(url) || queued.has(url.href)) {
        return;
    }
    queued.add(url.href);
    queue.push(url);
}

function isPageRoute(url) {
    const name = url.pathname.split('/').pop() || '';
    return (
        url.pathname === '/' ||
        url.pathname.endsWith('/') ||
        name.endsWith('.html') ||
        !name.includes('.')
    );
}

function visibleAnchorTags(html) {
    return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi)]
        .filter(match => {
            const tag = match[0];
            return (
                !/\bhidden(?:\s|=|>)/i.test(tag) &&
                !/\baria-hidden=["']true["']/i.test(tag)
            );
        });
}

function pageIds(html) {
    return new Set(
        [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1])
    );
}

function recordFragment(url) {
    if (!url.hash) return;
    const fragment = decodeURIComponent(url.hash.slice(1));
    const target = new URL(url);
    target.hash = '';
    if (!fragmentExpectations.has(target.href)) {
        fragmentExpectations.set(target.href, new Set());
    }
    fragmentExpectations.get(target.href).add(fragment);
}

async function fetchText(url) {
    const response = await fetch(url, {
        headers: {
            'cache-control': 'no-cache',
            'user-agent': 'LearnByShorts production link verifier'
        },
        redirect: 'follow'
    });
    if (!response.ok) {
        failures.push(`${url.href} returned HTTP ${response.status}`);
        return null;
    }
    return {
        finalUrl: new URL(response.url),
        contentType: response.headers.get('content-type') || '',
        text: await response.text()
    };
}

const sitemap = await fetchText(new URL('/sitemap.xml', siteOrigin));
if (sitemap) {
    for (const match of sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
        enqueue(match[1]);
    }
}

for (const route of [
    '/',
    '/about.html',
    '/contact.html',
    '/design-patterns.html',
    '/privacy-policy.html',
    '/terms-of-service.html',
    '/course-detail.html?id=singleton-pattern',
    '/course-story.html?id=singleton-pattern',
    '/course-player.html?id=singleton-pattern',
    '/topic-story.html?course=singleton-pattern&index=0',
    '/topic-quiz.html?course=singleton-pattern',
    '/shorts.html',
    '/category.html?id=design-patterns'
]) {
    enqueue(route);
}

while (queue.length > 0 && pages.size < maxPages) {
    const requestedUrl = queue.shift();
    const result = await fetchText(requestedUrl);
    if (!result) continue;
    if (!result.contentType.toLowerCase().includes('text/html')) {
        failures.push(`${requestedUrl.href} did not return HTML`);
        continue;
    }

    const ids = pageIds(result.text);
    pages.set(requestedUrl.href, { ids, finalUrl: result.finalUrl.href });
    pages.set(result.finalUrl.href, { ids, finalUrl: result.finalUrl.href });

    for (const match of visibleAnchorTags(result.text)) {
        const href = match[1].trim();
        if (!href || href === '#' || /^javascript:/i.test(href)) {
            failures.push(
                `${requestedUrl.href} contains a visible placeholder link: ${href || '(empty)'}`
            );
            continue;
        }
        if (/^(?:mailto:|tel:|data:)/i.test(href)) continue;

        let target;
        try {
            target = new URL(href, result.finalUrl);
        } catch {
            failures.push(`${requestedUrl.href} contains an invalid link: ${href}`);
            continue;
        }
        if (target.origin !== siteOrigin.origin) continue;

        recordFragment(target);
        enqueue(target);
    }
}

if (queue.length > 0) {
    failures.push(`Production crawl exceeded the ${maxPages}-page safety limit`);
}

for (const [url, fragments] of fragmentExpectations) {
    const page = pages.get(url) || pages.get(new URL(url).href);
    if (!page) {
        failures.push(`Anchor target page was not crawled: ${url}`);
        continue;
    }
    for (const fragment of fragments) {
        if (!page.ids.has(fragment)) {
            failures.push(`${url} is missing anchor #${fragment}`);
        }
    }
}

if (failures.length > 0) {
    console.error([...new Set(failures)].join('\n'));
    process.exit(1);
}

console.log(
    `Production link QA passed: ${pages.size} requested/final URL variants, ` +
    `${fragmentExpectations.size} pages with verified anchor targets.`
);
