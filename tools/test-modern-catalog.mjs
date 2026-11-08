import assert from 'node:assert/strict';
import fs from 'node:fs';

const modern = JSON.parse(fs.readFileSync('frontend/data/modern-skills.json', 'utf8'));
const companies = JSON.parse(fs.readFileSync('frontend/data/company-interviews.json', 'utf8'));
const jobPaths = JSON.parse(fs.readFileSync('frontend/data/job-prep-paths.json', 'utf8'));
const modernHtml = fs.readFileSync('frontend/modern-skills/index.html', 'utf8');
const modernJs = fs.readFileSync('frontend/modern-skills/modern-skills.js', 'utf8');
const companyHtml = fs.readFileSync('frontend/interview-companies.html', 'utf8');
const companyJs = fs.readFileSync('frontend/js/interview-companies.js', 'utf8');
const jobHtml = fs.readFileSync('frontend/job-paths/amazon-sde-ii/index.html', 'utf8');
const jobJs = fs.readFileSync('frontend/job-paths/job-path.js', 'utf8');
const sitemap = fs.readFileSync('frontend/sitemap.xml', 'utf8');
const authConfig = fs.readFileSync('frontend/js/auth-config.js', 'utf8');
const authService = fs.readFileSync('frontend/js/auth-service.js', 'utf8');
const loginHtml = fs.readFileSync('frontend/login.html', 'utf8');
const courseStoryHtml = fs.readFileSync('frontend/course-story.html', 'utf8');
const courseStoryJs = fs.readFileSync(
    'frontend/js/pages/CourseStoryPage.js',
    'utf8'
);

function unique(values, label) {
    assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

assert.equal(modern.reviewedAt, '2026-11-07');
assert.equal(modern.tracks.length, 12);
assert.equal(modern.videos.length, 5);
unique(modern.tracks.map(track => track.id), 'track ids');
unique(modern.videos.map(video => video.id), 'video ids');
for (const requiredTrack of [
    'ai-evals-reliability',
    'ai-assisted-coding',
    'backend-distributed-systems',
    'platform-engineering-kubernetes'
]) {
    assert.ok(
        modern.tracks.some(track => track.id === requiredTrack),
        `missing current track ${requiredTrack}`
    );
}

const categories = new Set(['ai', 'build', 'data', 'cloud', 'security', 'career']);
for (const track of modern.tracks) {
    assert.match(track.id, /^[a-z0-9-]{1,64}$/);
    assert.ok(categories.has(track.category), `unknown category ${track.category}`);
    assert.equal(track.missions.length, 4, `${track.id} must have four proof missions`);
    unique(track.missions.map(mission => mission.id), `${track.id} mission ids`);
    assert.ok(track.references.length >= 2, `${track.id} needs benchmark references`);
    for (const reference of track.references) {
        assert.ok(
            reference.url.startsWith('https://') || reference.url.startsWith('../'),
            `${track.id} has an unsafe reference URL`
        );
    }
}

for (const video of modern.videos) {
    assert.match(video.youtubeId, /^[A-Za-z0-9_-]{11}$/);
    assert.ok(video.before.length > 20);
    assert.ok(video.after.length > 20);
}

assert.doesNotMatch(modernHtml, /<iframe\b/i);
assert.match(modernHtml, /frame-src https:\/\/www\.youtube-nocookie\.com/);
assert.match(modernJs, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
assert.doesNotMatch(modernJs, /innerHTML\s*=/);
assert.match(modernHtml, /data-path-finder/);
assert.match(modernHtml, /data-finder-result/);
assert.match(modernJs, /recommendationRules/);
assert.match(modernJs, /ai-evals-reliability/);
assert.match(modernJs, /platform-engineering-kubernetes/);

assert.equal(companies.reviewedAt, '2026-11-07');
assert.equal(companies.companies.length, 6);
unique(companies.companies.map(company => company.id), 'company ids');
for (const company of companies.companies) {
    assert.equal(company.sprint.length, 4, `${company.id} must have four sprint steps`);
    assert.match(company.sourceUrl, /^https:\/\//);
    assert.ok(company.caveat.length > 30);
}
assert.doesNotMatch(JSON.stringify(companies), /successRate|acceptanceRate/i);
assert.doesNotMatch(companyHtml, /unsafe-inline/);
assert.match(companies.companies[0].rolePathUrl, /job-paths\/amazon-sde-ii/);
assert.match(companyJs, /companyProgress\(company\)\.count/);

assert.equal(jobPaths.reviewedAt, '2026-11-07');
assert.equal(jobPaths.roles.length, 1);
const amazonSde2 = jobPaths.roles[0];
assert.equal(amazonSde2.id, 'amazon-sde-ii');
assert.equal(amazonSde2.signals.length, 6);
assert.equal(amazonSde2.planModules.length, 8);
assert.ok(amazonSde2.prompts.length >= 6);
assert.ok(amazonSde2.sources.length >= 3);
unique(amazonSde2.signals.map(signal => signal.id), 'job signal ids');
unique(amazonSde2.planModules.map(module => module.id), 'job plan module ids');
unique(amazonSde2.prompts.map(prompt => prompt.id), 'job prompt ids');
for (const source of amazonSde2.sources) {
    assert.match(source.url, /^https:\/\//);
}
for (const prompt of amazonSde2.prompts) {
    assert.ok(prompt.text.length > 150, `${prompt.id} prompt is too shallow`);
}
assert.doesNotMatch(jobHtml, /unsafe-inline/);
assert.match(jobHtml, /job and resume text stay on this page/i);
assert.match(jobHtml, /1, 2, 4, or 8-week/i);
assert.doesNotMatch(jobJs, /innerHTML\s*=/);
assert.match(jobJs, /lbs2:job-path:/);
assert.match(jobJs, /trackJobPlanGenerate/);
assert.match(sitemap, /job-paths\/amazon-sde-ii\//);

assert.match(authConfig, /identityProviders:\s*Object\.freeze\(\['COGNITO'\]\)/);
assert.match(authService, /identity_provider:\s*providerName/);
assert.match(authService, /hasIdentityProvider\(provider\)/);
assert.doesNotMatch(authService, /lbs:auth:(id|refresh)/);
assert.doesNotMatch(authService, /refreshSession\(/);
assert.doesNotMatch(authService, /grant_type:\s*'refresh_token'/);
assert.match(loginHtml, /data-auth-provider="Google" hidden/);
assert.match(loginHtml, /Gmail addresses work/);
assert.doesNotMatch(courseStoryHtml, /script-src[^;]*unsafe-inline/);
assert.doesNotMatch(courseStoryHtml, /cdnjs|googletagmanager/);
assert.doesNotMatch(courseStoryJs, /onclick=/);
assert.match(courseStoryJs, /this\.escapeHtml\(chapter\.content\)/);
assert.match(courseStoryJs, /safeImageUrl\(candidate\)/);

console.log(
    'Modern catalog QA passed: 12 current paths, 48 missions, local path finder, 5 privacy-gated videos, ' +
    '6 source-linked company sprints, a private Amazon SDE II job path, and provider-aware sign-in.'
);
