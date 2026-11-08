import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve('frontend');
const baseUrl = 'https://www.learnbyshorts.com';
const modern = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'data/modern-skills.json'), 'utf8')
);
const courseVideos = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'data/course-videos.json'), 'utf8')
);
const robots = fs.readFileSync(path.join(siteRoot, 'robots.txt'), 'utf8');
const llms = fs.readFileSync(path.join(siteRoot, 'llms.txt'), 'utf8');
const facts = fs.readFileSync(path.join(siteRoot, 'learnbyshorts-facts.md'), 'utf8');
const catalog = fs.readFileSync(path.join(siteRoot, 'course-catalog.md'), 'utf8');
const home = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
const modernHtml = fs.readFileSync(
    path.join(siteRoot, 'modern-skills/index.html'),
    'utf8'
);
const publisher = fs.readFileSync(
    path.resolve('tools/publish-static-site.sh'),
    'utf8'
);

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const userAgent of [
    'OAI-SearchBot',
    'ChatGPT-User',
    'PerplexityBot',
    'Perplexity-User'
]) {
    assert.match(
        robots,
        new RegExp(`User-agent: ${escapeRegex(userAgent)}\\nAllow: /`),
        `${userAgent} must be allowed to retrieve public content`
    );
}
assert.match(
    robots,
    /User-agent: GPTBot\nDisallow: \//,
    'search access must remain separate from model-training permission'
);
assert.match(robots, /Sitemap: https:\/\/www\.learnbyshorts\.com\/sitemap\.xml/);

assert.ok(llms.startsWith('# LearnByShorts\n'), 'llms.txt must start with an H1');
assert.match(llms, /> Free, outcome-driven learning/);
assert.match(llms, /## Important limitations/);
assert.match(facts, /## Claims LearnByShorts does not make/);
assert.match(catalog, /## Catalog limitations/);
assert.doesNotMatch(
    `${llms}\n${facts}\n${catalog}`.toLowerCase(),
    /best in the world|guaranteed job|guaranteed interview|official certification/,
    'AI-readable documents must not contain unsupported outcome claims'
);

assert.match(
    home,
    /<link rel="alternate" type="text\/plain" href="\/llms\.txt"/
);
assert.match(
    home,
    /<link rel="alternate" type="text\/markdown" href="\/learnbyshorts-facts\.md"/
);
assert.match(
    modernHtml,
    /<link rel="alternate" type="text\/markdown" href="\/course-catalog\.md"/
);
assert.match(publisher, /--content-type "text\/markdown; charset=utf-8"/);
assert.match(publisher, /--content-type "text\/plain; charset=utf-8"/);

const structuredCourseUrls = [
    ...modernHtml.matchAll(
        /"url": "https:\/\/www\.learnbyshorts\.com\/courses\/([^/]+)\/"/g
    )
].map(match => match[1]);
assert.deepEqual(
    structuredCourseUrls.sort(),
    modern.tracks.map(track => track.id).sort(),
    'the catalog ItemList must contain all exact course URLs'
);

for (const track of modern.tracks) {
    const courseUrl = `${baseUrl}/courses/${track.id}/`;
    const markdownUrl = `${courseUrl}index.md`;
    const markdownPath = path.join(siteRoot, 'courses', track.id, 'index.md');
    const htmlPath = path.join(siteRoot, 'courses', track.id, 'index.html');

    assert.ok(fs.existsSync(markdownPath), `${track.id} needs an AI-readable page`);
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(markdown.startsWith(`# ${track.title}\n`));
    assert.ok(llms.includes(`[${track.title}](${markdownUrl})`));
    assert.ok(catalog.includes(`[Open the course](${courseUrl})`));
    assert.match(
        html,
        /<link rel="alternate" type="text\/markdown" href="index\.md"/
    );
    assert.ok(markdown.includes(`Canonical course page: ${courseUrl}`));
    assert.match(markdown, /## Completion and limitations/);

    for (const mission of track.missions) {
        assert.ok(
            markdown.includes(`### ${track.missions.indexOf(mission) + 1}. ${mission.title}`),
            `${track.id} Markdown is missing mission ${mission.id}`
        );
        assert.ok(markdown.includes(mission.action));
        assert.ok(markdown.includes(mission.proof));
    }

    for (const reference of track.references) {
        const referenceUrl = new URL(
            reference.url,
            `${baseUrl}/modern-skills/`
        ).href;
        assert.ok(
            markdown.includes(`](${referenceUrl})`),
            `${track.id} Markdown is missing reference ${reference.label}`
        );
    }

    for (const video of courseVideos.courses[track.id]) {
        assert.ok(markdown.includes(video.title));
        assert.ok(markdown.includes(video.creator));
        assert.ok(
            markdown.includes(`https://www.youtube.com/watch?v=${video.youtubeId}`)
        );
    }
}

console.log(
    'AI discovery QA passed: public answer-engine access, training opt-out, ' +
    '12 factual Markdown course pages, exact structured URLs, and explicit limitations.'
);
