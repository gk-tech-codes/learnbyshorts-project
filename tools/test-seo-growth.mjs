import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve('frontend');
const baseUrl = 'https://www.learnbyshorts.com';
const sitemap = fs.readFileSync(path.join(siteRoot, 'sitemap.xml'), 'utf8');
const modern = JSON.parse(fs.readFileSync(path.join(siteRoot, 'data/modern-skills.json'), 'utf8'));
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

function fileForUrl(urlValue) {
    const url = new URL(urlValue);
    if (url.pathname === '/') return path.join(siteRoot, 'index.html');
    if (url.pathname.endsWith('/')) {
        return path.join(siteRoot, url.pathname.slice(1), 'index.html');
    }
    return path.join(siteRoot, url.pathname.slice(1));
}

assert.equal(urls.length, 26, 'sitemap should contain 14 core URLs and 12 modern course URLs');
assert.equal(new Set(urls).size, urls.length, 'sitemap URLs must be unique');
assert.ok(urls.every(url => url.startsWith(`${baseUrl}/`)), 'sitemap must use the canonical www host');
assert.ok(urls.every(url => !url.endsWith('/index.html')), 'nested canonical URLs must use trailing slashes');

for (const url of urls) {
    const file = fileForUrl(url);
    assert.ok(fs.existsSync(file), `sitemap target missing: ${url}`);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/i, `${url} needs a title`);
    assert.match(html, /<meta name="description" content="[^"]+">/i, `${url} needs a description`);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/i, `${url} cannot be noindex`);
    assert.match(
        html,
        new RegExp(`<link rel="canonical" href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`, 'i'),
        `${url} canonical must match the sitemap`
    );
    assert.match(
        html,
        /<meta property="og:image" content="https:\/\/www\.learnbyshorts\.com\/assets\/learnbyshorts-social\.png">/i,
        `${url} needs the owned social image`
    );
}

for (const track of modern.tracks) {
    const url = `${baseUrl}/courses/${track.id}/`;
    assert.ok(urls.includes(url), `${track.id} must be in the sitemap`);
    const html = fs.readFileSync(fileForUrl(url), 'utf8');
    assert.match(html, /"@type": "Course"/);
    assert.match(html, /"@type": "FAQPage"/);
    assert.match(html, /"@type": "BreadcrumbList"/);
    assert.match(html, new RegExp(`data-course-id="${track.id}"`));
    assert.match(
        html,
        /<link rel="alternate" type="text\/markdown" href="index\.md"/,
        `${track.id} needs an AI-readable Markdown alternate`
    );
    assert.equal(
        [...html.matchAll(/data-mission-id=/g)].length,
        4,
        `${track.id} must expose four crawlable proof missions`
    );
}

const homepage = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
assert.match(homepage, /href="\/llms\.txt"/);
assert.match(homepage, /href="\/learnbyshorts-facts\.md"/);

const modernCatalog = fs.readFileSync(
    path.join(siteRoot, 'modern-skills/index.html'),
    'utf8'
);
assert.match(modernCatalog, /href="\/course-catalog\.md"/);
for (const track of modern.tracks) {
    assert.match(
        modernCatalog,
        new RegExp(
            `"url": "https://www\\.learnbyshorts\\.com/courses/${track.id}/"`
        ),
        `${track.id} needs an exact URL in catalog structured data`
    );
}

const roleSprint = fs.readFileSync(path.join(siteRoot, 'role-sprint.html'), 'utf8');
assert.match(roleSprint, /"@type": "WebApplication"/);
assert.match(roleSprint, /No account required\./);
assert.match(roleSprint, /Your plan and progress stay in this browser\./);
assert.doesNotMatch(roleSprint, /hiring promise or certification[^<]*\.<\/p>\s*<script async/i);

for (const obsolete of ['shorts.html', 'singleton-course.html', 'category.html']) {
    const html = fs.readFileSync(path.join(siteRoot, obsolete), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.ok(!urls.some(url => url.endsWith(`/${obsolete}`)), `${obsolete} must not be in sitemap`);
}

console.log('SEO growth QA passed: 26 canonical URLs, RoleSprint, 12 crawlable course pages, owned social cards, and obsolete routes excluded.');
