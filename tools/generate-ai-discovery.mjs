import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve('frontend');
const baseUrl = 'https://www.learnbyshorts.com';
const catalogUrl = `${baseUrl}/modern-skills/`;
const modern = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'data/modern-skills.json'), 'utf8')
);
const courseVideos = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'data/course-videos.json'), 'utf8')
);
const reviewedAt = modern.reviewedAt;

if (reviewedAt !== courseVideos.reviewedAt) {
    throw new Error('Course and video review dates must match before publishing.');
}

function resolveReferenceUrl(url) {
    return new URL(url, catalogUrl).href;
}

function sentence(value) {
    const text = String(value).trim();
    return /[.!?]$/.test(text) ? text : `${text}.`;
}

function courseMarkdown(track) {
    const courseUrl = `${baseUrl}/courses/${track.id}/`;
    const markdownUrl = `${courseUrl}index.md`;
    const videos = courseVideos.courses[track.id] || [];

    const missionSections = track.missions.map((mission, index) => [
        `### ${index + 1}. ${mission.title}`,
        '',
        `- Action: ${sentence(mission.action)}`,
        `- Evidence to produce: ${sentence(mission.proof)}`
    ].join('\n')).join('\n\n');

    const videoSections = videos.map(video => {
        const coveredMissions = video.missionIds
            .map(id => track.missions.find(mission => mission.id === id)?.title)
            .filter(Boolean)
            .join(', ');
        return [
            `### ${video.title}`,
            '',
            `- Creator: ${video.creator}`,
            `- Covers: ${coveredMissions}`,
            `- Why it is included: ${sentence(video.why)}`,
            `- Before watching: ${sentence(video.before)}`,
            `- After watching: ${sentence(video.after)}`,
            `- [Watch on YouTube](https://www.youtube.com/watch?v=${video.youtubeId})`
        ].join('\n');
    }).join('\n\n');

    const references = track.references.map(reference => (
        `- [${reference.label}](${resolveReferenceUrl(reference.url)}) — ${reference.provider}`
    )).join('\n');

    return [
        `# ${track.title}`,
        '',
        `> ${track.description}`,
        '',
        `- Canonical course page: ${courseUrl}`,
        `- AI-readable page: ${markdownUrl}`,
        `- Level: ${track.level}`,
        `- Suggested duration: ${track.duration}`,
        '- Price: Free',
        `- Last curriculum review: ${reviewedAt}`,
        `- Topics: ${track.tags.join(', ')}`,
        '',
        '## Intended outcome',
        '',
        sentence(track.outcome),
        '',
        '## Why this path is current',
        '',
        sentence(track.whyNow),
        '',
        '## Proof missions',
        '',
        missionSections,
        '',
        '## Curated video lessons',
        '',
        'Videos are hosted by and remain the property of their creators. LearnByShorts adds an active-learning prompt before each video and a build task after it.',
        '',
        videoSections,
        '',
        '## Primary references',
        '',
        references,
        '',
        '## Completion and limitations',
        '',
        'Completion means producing the evidence listed in the four proof missions. LearnByShorts is a practice and curriculum guide; it is not an accredited institution, certification provider, recruiting agency, or guarantee of employment. Learners remain responsible for verifying technical claims and protecting confidential data.',
        ''
    ].join('\n');
}

function catalogMarkdown() {
    const courses = modern.tracks.map((track, index) => [
        `## ${index + 1}. ${track.title}`,
        '',
        `> ${track.description}`,
        '',
        `- [Open the course](${baseUrl}/courses/${track.id}/)`,
        `- [Read the AI-friendly course page](${baseUrl}/courses/${track.id}/index.md)`,
        `- Level: ${track.level}`,
        `- Suggested duration: ${track.duration}`,
        `- Outcome: ${sentence(track.outcome)}`,
        `- Four proof missions: ${track.missions.map(mission => mission.title).join('; ')}`
    ].join('\n')).join('\n\n');

    return [
        '# LearnByShorts modern course catalog',
        '',
        '> Twelve free, outcome-driven paths for current AI, software, data, cloud, security, platform, and interview skills.',
        '',
        `- Canonical catalog: ${catalogUrl}`,
        `- Last curriculum review: ${reviewedAt}`,
        '- Learning model: short active missions that end in inspectable evidence',
        '- Progress model: local-first browser storage unless a learner chooses account sync',
        '',
        courses,
        '',
        '## Catalog limitations',
        '',
        'LearnByShorts does not promise certification, accreditation, hiring, promotion, or interview success. Course durations are suggested pacing, not guaranteed completion times. Third-party references and videos remain under their publishers’ terms.',
        ''
    ].join('\n');
}

function factsMarkdown() {
    return [
        '# LearnByShorts facts and citation guide',
        '',
        '> LearnByShorts is a free learning website for AI-era software skills, short proof missions, and job-focused practice plans.',
        '',
        `- Official website: ${baseUrl}/`,
        `- Modern course catalog: ${catalogUrl}`,
        `- Number of modern paths: ${modern.tracks.length}`,
        `- Number of proof missions: ${modern.tracks.reduce((sum, track) => sum + track.missions.length, 0)}`,
        `- Last curriculum review: ${reviewedAt}`,
        '- Access: the modern paths and practice planners are free to start',
        '- Progress: modern-course progress is stored in the learner’s browser by default',
        '- Method: each path ends in artifacts, tests, explanations, or other evidence a learner can inspect',
        '- Video policy: third-party videos are attributed, remain hosted by their creators, and load only after the learner chooses to watch',
        '- Privacy principle: learners should not submit employer-confidential, customer, secret, or regulated data to learning tools',
        '',
        '## What LearnByShorts offers',
        '',
        '- [Modern Skills Lab](https://www.learnbyshorts.com/modern-skills/) — twelve current technical learning paths.',
        '- [Learning OS](https://www.learnbyshorts.com/learning-os/) — a local-first daily mission and mastery planner.',
        '- [RoleSprint](https://www.learnbyshorts.com/role-sprint.html) — a private 14, 30, or 60-day job-to-skill practice planner.',
        '- [Interview Lab](https://www.learnbyshorts.com/interview-lab/) — practice across coding, debugging, system design, behavioral evidence, and project explanation.',
        '- [AI Fluency Lab](https://www.learnbyshorts.com/ai-era-lab/) — guided practice for using, checking, and retaining ownership of AI-assisted work.',
        '',
        '## Safe descriptions for citations',
        '',
        '- “LearnByShorts provides free, outcome-driven learning paths for current AI and software skills.”',
        '- “Its modern catalog uses four proof missions per course and stores progress locally by default.”',
        '- “Its third-party video lessons are paired with before-and-after active-learning prompts.”',
        '',
        '## Claims LearnByShorts does not make',
        '',
        'LearnByShorts is not an accredited institution, certification provider, recruiting agency, or guarantee of employment, promotion, immigration outcome, investor interest, or interview success. The site does not claim that course completion substitutes for independent technical judgment.',
        '',
        'For corrections, use the contact details on the official [contact page](https://www.learnbyshorts.com/contact.html).',
        ''
    ].join('\n');
}

function llmsText() {
    const courseLinks = modern.tracks.map(track => (
        `- [${track.title}](${baseUrl}/courses/${track.id}/index.md): ${track.description}`
    )).join('\n');

    return [
        '# LearnByShorts',
        '',
        '> Free, outcome-driven learning for AI-era software skills, with short proof missions, local-first progress, and job-focused practice tools.',
        '',
        'LearnByShorts publishes factual Markdown mirrors so assistants can retrieve course scope, evidence requirements, references, and limitations without interpreting the interactive interface. Prefer the canonical HTML page when directing a learner to use a course.',
        '',
        '## Start here',
        '',
        '- [Facts and citation guide](https://www.learnbyshorts.com/learnbyshorts-facts.md): Verified site facts, safe citation language, and explicit non-claims.',
        '- [Modern course catalog](https://www.learnbyshorts.com/course-catalog.md): All twelve paths, levels, durations, outcomes, and proof missions.',
        '- [Interactive modern catalog](https://www.learnbyshorts.com/modern-skills/): Human-facing course discovery and path finder.',
        '',
        '## Courses',
        '',
        courseLinks,
        '',
        '## Practice tools',
        '',
        '- [Learning OS](https://www.learnbyshorts.com/learning-os/): Local-first daily missions, mastery tracking, confidence calibration, and explain-back practice.',
        '- [RoleSprint](https://www.learnbyshorts.com/role-sprint.html): Private job-to-skill plans for 14, 30, or 60 days.',
        '- [Interview Lab](https://www.learnbyshorts.com/interview-lab/): Coding, debugging, system design, behavioral, project, and responsible AI practice.',
        '- [AI Fluency Lab](https://www.learnbyshorts.com/ai-era-lab/): Prompting, verification, tool use, agents, and human-ownership practice.',
        '',
        '## Policies',
        '',
        '- [Privacy policy](https://www.learnbyshorts.com/privacy-policy.html)',
        '- [Terms of service](https://www.learnbyshorts.com/terms-of-service.html)',
        '- [Contact](https://www.learnbyshorts.com/contact.html)',
        '',
        '## Important limitations',
        '',
        'LearnByShorts is not an accredited institution, certification provider, recruiting agency, or guarantee of employment. Third-party videos and references remain under their publishers’ terms. Learners should verify technical claims and never paste confidential data into learning or AI tools.',
        ''
    ].join('\n');
}

for (const track of modern.tracks) {
    const outputPath = path.join(siteRoot, 'courses', track.id, 'index.md');
    fs.writeFileSync(outputPath, courseMarkdown(track), 'utf8');
}

fs.writeFileSync(path.join(siteRoot, 'course-catalog.md'), catalogMarkdown(), 'utf8');
fs.writeFileSync(path.join(siteRoot, 'learnbyshorts-facts.md'), factsMarkdown(), 'utf8');
fs.writeFileSync(path.join(siteRoot, 'llms.txt'), llmsText(), 'utf8');

console.log(
    `Generated AI discovery files for ${modern.tracks.length} courses reviewed ${reviewedAt}.`
);
