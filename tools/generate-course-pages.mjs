#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('frontend');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/modern-skills.json'), 'utf8'));
const coursesRoot = path.join(root, 'courses');
const baseUrl = 'https://www.learnbyshorts.com';
const socialImage = `${baseUrl}/assets/learnbyshorts-social.png`;

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function safeJson(value) {
    return JSON.stringify(value, null, 2).replaceAll('<', '\\u003c');
}

function relatedTracks(track) {
    const sameCategory = data.tracks.filter(candidate =>
        candidate.id !== track.id && candidate.category === track.category
    );
    const others = data.tracks.filter(candidate =>
        candidate.id !== track.id && candidate.category !== track.category
    );
    return [...sameCategory, ...others].slice(0, 3);
}

function courseReferenceUrl(value) {
    const url = String(value);
    return url.startsWith('../') ? `../../${url.slice(3)}` : url;
}

function coursePage(track) {
    const canonical = `${baseUrl}/courses/${track.id}/`;
    const schema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Course',
                '@id': `${canonical}#course`,
                name: track.title,
                description: track.description,
                url: canonical,
                provider: {
                    '@type': 'EducationalOrganization',
                    name: 'LearnByShorts',
                    url: `${baseUrl}/`
                },
                educationalLevel: track.level,
                timeRequired: track.duration,
                isAccessibleForFree: true,
                inLanguage: 'en',
                teaches: track.tags,
                hasCourseInstance: {
                    '@type': 'CourseInstance',
                    courseMode: 'online',
                    courseWorkload: `${track.missions.length} proof missions`,
                    instructor: {
                        '@type': 'Organization',
                        name: 'LearnByShorts'
                    }
                }
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {'@type': 'ListItem', position: 1, name: 'LearnByShorts', item: `${baseUrl}/`},
                    {'@type': 'ListItem', position: 2, name: 'Modern Skills', item: `${baseUrl}/modern-skills/`},
                    {'@type': 'ListItem', position: 3, name: track.title, item: canonical}
                ]
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: `Is the ${track.title} learning path free?`,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Yes. The four proof missions and device-local progress tracking are free to use without an account.'
                        }
                    },
                    {
                        '@type': 'Question',
                        name: `What will I build in ${track.title}?`,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: track.outcome
                        }
                    },
                    {
                        '@type': 'Question',
                        name: 'How does LearnByShorts measure progress?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Progress is based on completed proof missions, explanations, tests, and artifacts—not passive watch time.'
                        }
                    }
                ]
            }
        ]
    };

    const missions = track.missions.map((mission, index) => `
                    <li class="mission">
                        <input type="checkbox" data-mission-id="${escapeHtml(mission.id)}" aria-label="Mark ${escapeHtml(mission.title)} complete">
                        <span class="mission-number">${String(index + 1).padStart(2, '0')}</span>
                        <div>
                            <h3>${escapeHtml(mission.title)}</h3>
                            <p>${escapeHtml(mission.action)}</p>
                            <small><strong>Proof:</strong> ${escapeHtml(mission.proof)}</small>
                        </div>
                    </li>`).join('');
    const references = track.references.map(reference => `
                    <a class="reference-card" href="${escapeHtml(courseReferenceUrl(reference.url))}" target="_blank" rel="noopener noreferrer">
                        <small>${escapeHtml(reference.provider)}</small>
                        <strong>${escapeHtml(reference.label)}</strong>
                        <span>Open primary learning source ↗</span>
                    </a>`).join('');
    const related = relatedTracks(track).map(candidate => `
                    <a class="related-card" href="../${escapeHtml(candidate.id)}/">
                        <span>${escapeHtml(candidate.category)}</span>
                        <strong>${escapeHtml(candidate.title)}</strong>
                        <small>${escapeHtml(candidate.level)} · ${escapeHtml(candidate.duration)}</small>
                    </a>`).join('');
    const tags = track.tags.map(tag => `<li>${escapeHtml(tag)}</li>`).join('');
    const description = escapeHtml(track.description);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; frame-ancestors 'none'; upgrade-insecure-requests;">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
    <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()">
    <title>${escapeHtml(track.title)} Learning Path | LearnByShorts</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="theme-color" content="#101816">
    <link rel="canonical" href="${canonical}">
    <link rel="icon" href="../../assets/logo.svg" type="image/svg+xml">
    <link rel="stylesheet" href="../course-page.css?v=20261107-1">
    <meta property="og:title" content="${escapeHtml(track.title)} | LearnByShorts">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${socialImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="LearnByShorts">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(track.title)} | LearnByShorts">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${socialImage}">
    <script type="application/ld+json">
${safeJson(schema)}
    </script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-5413RZXDET"></script>
    <script src="../../js/analytics.js?v=20261107-10"></script>
</head>
<body data-course-id="${escapeHtml(track.id)}" style="--course-accent:${escapeHtml(track.accent)}">
    <a class="skip-link" href="#main-content">Skip to course</a>
    <header class="course-header">
        <div class="shell course-nav">
            <a class="brand" href="../../">
                <img src="../../assets/logo.svg" alt="" width="38" height="38">
                <span><strong>LearnByShorts</strong><small>Proof-driven course</small></span>
            </a>
            <nav aria-label="Course navigation">
                <a href="#missions">Missions</a>
                <a href="#sources">Sources</a>
                <a class="nav-cta" href="../../learning-os/?track=${escapeHtml(track.id)}">Daily mission →</a>
            </nav>
        </div>
    </header>
    <main id="main-content">
        <section class="course-hero">
            <div class="shell">
                <p class="breadcrumbs"><a href="../../">Home</a> / <a href="../../modern-skills/">Modern Skills</a> / ${escapeHtml(track.title)}</p>
                <div class="hero-grid">
                    <div>
                        <p class="eyebrow">${escapeHtml(track.category)} · ${escapeHtml(track.level)}</p>
                        <h1>${escapeHtml(track.title)}</h1>
                        <p class="hero-description">${description}</p>
                        <div class="hero-actions">
                            <a class="button button-primary" href="#missions">Start four proof missions</a>
                            <button class="button button-secondary" type="button" data-share-course>Share this path</button>
                        </div>
                        <small data-share-status aria-live="polite"></small>
                    </div>
                    <aside class="hero-card">
                        <span class="course-mark">${escapeHtml(track.mark)}</span>
                        <dl>
                            <div><dt>Level</dt><dd>${escapeHtml(track.level)}</dd></div>
                            <div><dt>Suggested pace</dt><dd>${escapeHtml(track.duration)}</dd></div>
                            <div><dt>Learning contract</dt><dd>4 inspectable artifacts</dd></div>
                        </dl>
                        <p><strong>Why now:</strong> ${escapeHtml(track.whyNow)}</p>
                    </aside>
                </div>
            </div>
        </section>
        <section class="proof-strip" aria-label="Course promise">
            <div class="shell proof-grid">
                <div><strong>Learn actively</strong><span>Short decisions before explanation</span></div>
                <div><strong>Verify independently</strong><span>Tests, sources, and failure cases</span></div>
                <div><strong>Finish with proof</strong><span>Artifacts another person can inspect</span></div>
            </div>
        </section>
        <section class="section outcome-section">
            <div class="shell outcome-grid">
                <article class="outcome-card">
                    <span>Course outcome</span>
                    <h2>What you will be able to show</h2>
                    <p>${escapeHtml(track.outcome)}</p>
                </article>
                <article class="outcome-card">
                    <span>Capability map</span>
                    <h2>Skills practiced in context</h2>
                    <ul class="tag-list">${tags}</ul>
                </article>
            </div>
        </section>
        <section id="missions" class="section mission-section">
            <div class="shell">
                <div class="section-heading">
                    <span>Four-mission proof sprint</span>
                    <h2>Do the work. Keep the evidence.</h2>
                    <p>Check a mission only after the proof exists. Progress stays in this browser and also appears in the Modern Skills catalog.</p>
                </div>
                <ol class="mission-list">${missions}
                </ol>
                <div class="progress-panel">
                    <strong data-progress-copy>0 of 4 proof missions complete</strong>
                    <span data-progress-percent>0%</span>
                    <div class="progress-track"><i data-progress-meter></i></div>
                </div>
                <article class="completion-offer" data-completion-offer hidden>
                    <div>
                        <span>Proof sprint complete</span>
                        <h3>Want structured feedback and deeper practice?</h3>
                        <p>The free path remains yours. Founding access helps shape future mock interviews, review rubrics, and portfolio verification.</p>
                    </div>
                    <a class="button" data-founding-link href="mailto:hello@learnbyshorts.com?subject=LearnByShorts%20Founding%20Access&body=I%20completed%20the%20${encodeURIComponent(track.title)}%20proof%20sprint%20and%20want%20founding%20access.">Explore $29 founding access</a>
                </article>
            </div>
        </section>
        <section id="sources" class="section reference-section">
            <div class="shell">
                <div class="section-heading">
                    <span>Primary learning sources</span>
                    <h2>Go deeper without entering an endless feed.</h2>
                    <p>These external resources are optional benchmarks. Complete the LearnByShorts mission and bring back one useful artifact.</p>
                </div>
                <div class="reference-grid">${references}
                </div>
            </div>
        </section>
        <section class="section related-section">
            <div class="shell">
                <div class="section-heading">
                    <span>Build the adjacent capability</span>
                    <h2>Continue with a related proof path.</h2>
                </div>
                <div class="related-grid">${related}
                </div>
            </div>
        </section>
    </main>
    <footer class="course-footer">
        <div class="shell footer-grid">
            <span>© 2026 LearnByShorts · Free, local-first learning</span>
            <nav><a href="../../modern-skills/">All courses</a><a href="../../interview-lab/">Interview Lab</a><a href="../../privacy-policy.html">Privacy</a></nav>
        </div>
    </footer>
    <script src="../course-page.js?v=20261107-1"></script>
</body>
</html>
`;
}

fs.mkdirSync(coursesRoot, {recursive: true});
for (const track of data.tracks) {
    const directory = path.join(coursesRoot, track.id);
    fs.mkdirSync(directory, {recursive: true});
    fs.writeFileSync(path.join(directory, 'index.html'), coursePage(track));
}

const coreUrls = [
    ['/', 'weekly', '1.0'],
    ['/learn-v2/', 'weekly', '0.9'],
    ['/learning-os/', 'weekly', '0.95'],
    ['/modern-skills/', 'weekly', '0.95'],
    ['/interview-lab/', 'weekly', '0.9'],
    ['/interview-companies.html', 'weekly', '0.9'],
    ['/job-paths/amazon-sde-ii/', 'weekly', '0.95'],
    ['/ai-era-lab/', 'weekly', '0.9'],
    ['/design-patterns.html', 'monthly', '0.8'],
    ['/about.html', 'monthly', '0.6'],
    ['/contact.html', 'yearly', '0.4'],
    ['/privacy-policy.html', 'yearly', '0.2'],
    ['/terms-of-service.html', 'yearly', '0.2']
];
const courseUrls = data.tracks.map(track => [
    `/courses/${track.id}/`,
    'monthly',
    track.category === 'career' ? '0.9' : '0.85'
]);
const sitemapEntries = [...coreUrls, ...courseUrls].map(([url, frequency, priority]) => `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${data.reviewedAt}</lastmod>
    <changefreq>${frequency}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);

console.log(`Generated ${data.tracks.length} course pages and ${coreUrls.length + courseUrls.length} sitemap entries.`);
