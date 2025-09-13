# Chain 7: Course Page Generation

## Input Required
- **Course Architecture**: From Chain 1 (`course-architecture.json`)
- **Character Profiles**: From Chain 2 (`character-profiles.json`)
- **All Generated Topics**: From Chain 4 (`topic-*.json`)
- **Validation Report**: From Chain 6 (`validation-report.json`)

## Prompt

You are a web developer creating the course landing page. Generate a complete HTML course page using all course content.

### Input Context
Load course architecture, character profiles, all topics, and validation results.

### Requirements
- **Professional Design**: Match existing LearnByShorts styling
- **Character Integration**: Feature course characters prominently
- **Topic Organization**: Clear topic progression and navigation
- **Modern Context**: Highlight current technology and practices

### Output Structure
Generate complete HTML page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[COURSE_TITLE] - LearnByShorts</title>
    <meta name="description" content="[COURSE_DESCRIPTION]">
    <link rel="stylesheet" href="css/styles.css?v=1.5.9">
    <link rel="stylesheet" href="css/course-page.css?v=1.2.1">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <!-- Standard LearnByShorts header -->
    </header>

    <!-- Course Hero Section -->
    <section class="course-hero">
        <div class="container">
            <div class="course-hero-content">
                <div class="breadcrumb">
                    <a href="index.html">Home</a>
                    <span class="separator">›</span>
                    <a href="index.html#courses">Courses</a>
                    <span class="separator">›</span>
                    <span class="current">[COURSE_TITLE]</span>
                </div>
                
                <h1 class="course-hero-title">[COURSE_TITLE]</h1>
                <p class="course-hero-description">[COURSE_DESCRIPTION]</p>
                
                <div class="course-stats">
                    <div class="stat-item">
                        <span class="stat-number">[TOPIC_COUNT]</span>
                        <span class="stat-label">Topics</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">[ESTIMATED_HOURS]</span>
                        <span class="stat-label">Hours</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">[DIFFICULTY]</span>
                        <span class="stat-label">Level</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Characters Section -->
    <section class="course-characters">
        <div class="container">
            <h2>Meet Your Learning Companions</h2>
            <div class="characters-grid">
                <!-- Generate character cards for each character -->
                <div class="character-card">
                    <div class="character-avatar">[CHARACTER_ICON]</div>
                    <h3 class="character-name">[CHARACTER_NAME]</h3>
                    <p class="character-role">[CHARACTER_ROLE]</p>
                    <p class="character-description">[CHARACTER_BACKGROUND]</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Topics Section -->
    <section class="course-topics">
        <div class="container">
            <h2>Learning Journey</h2>
            <div class="topics-timeline">
                <!-- Generate topic cards for each topic -->
                <div class="topic-card" data-difficulty="[DIFFICULTY]">
                    <div class="topic-number">[TOPIC_NUMBER]</div>
                    <div class="topic-content">
                        <h3 class="topic-title">[TOPIC_TITLE]</h3>
                        <p class="topic-description">[TOPIC_DESCRIPTION]</p>
                        <div class="topic-meta">
                            <span class="topic-duration">[DURATION]</span>
                            <span class="topic-difficulty [DIFFICULTY]">[DIFFICULTY]</span>
                        </div>
                        <div class="topic-objectives">
                            <h4>You'll Learn:</h4>
                            <ul>
                                <!-- Generate learning objectives -->
                                <li>[LEARNING_OBJECTIVE]</li>
                            </ul>
                        </div>
                        <a href="course-detail.html?id=[COURSE_ID]" class="topic-start-btn">
                            Start Topic
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Prerequisites Section -->
    <section class="course-prerequisites">
        <div class="container">
            <h2>Prerequisites</h2>
            <div class="prerequisites-list">
                <!-- Generate prerequisite items -->
                <div class="prerequisite-item">
                    <span class="prerequisite-icon">✓</span>
                    <span class="prerequisite-text">[PREREQUISITE]</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Learning Outcomes Section -->
    <section class="course-outcomes">
        <div class="container">
            <h2>What You'll Achieve</h2>
            <div class="outcomes-grid">
                <!-- Generate outcome cards -->
                <div class="outcome-card">
                    <div class="outcome-icon">🎯</div>
                    <h3 class="outcome-title">Professional Skills</h3>
                    <p class="outcome-description">[LEARNING_OUTCOME]</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Technology Stack Section -->
    <section class="course-tech-stack">
        <div class="container">
            <h2>Modern Technology Stack</h2>
            <div class="tech-stack-grid">
                <!-- Generate technology cards based on course content -->
                <div class="tech-item">
                    <div class="tech-icon">[TECH_ICON]</div>
                    <span class="tech-name">[TECHNOLOGY]</span>
                    <span class="tech-version">[VERSION]</span>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="course-cta">
        <div class="container">
            <div class="cta-content">
                <h2>Ready to Start Your Journey?</h2>
                <p>Join [CHARACTER_NAMES] and master [COURSE_TOPIC] through engaging stories and real-world applications.</p>
                <a href="course-detail.html?id=[COURSE_ID]" class="cta-button">
                    Start Learning Now
                    <span class="btn-arrow">→</span>
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <!-- Standard LearnByShorts footer -->
    </footer>

    <!-- Scripts -->
    <script src="js/main.js?v=1.3.2"></script>
</body>
</html>
```

### Content Generation Guidelines

#### Hero Section
- Use course title and description from architecture
- Include compelling statistics (topic count, hours, difficulty)
- Highlight modern technology context
- Create urgency and excitement

#### Characters Section
- Feature all main characters from profiles
- Show their roles and expertise
- Highlight team dynamics and collaboration
- Use engaging character descriptions

#### Topics Section
- Display topics in learning sequence
- Show difficulty progression visually
- Include learning objectives for each topic
- Provide clear navigation to start learning

#### Prerequisites Section
- List all technical prerequisites clearly
- Include both external and course-specific requirements
- Use visual indicators for completion status
- Provide links to prerequisite resources if needed

#### Learning Outcomes Section
- Highlight career-relevant outcomes
- Show business value and practical applications
- Use compelling visuals and icons
- Connect to industry trends and opportunities

#### Technology Stack Section
- Showcase modern technologies used
- Include current versions and best practices
- Highlight industry-relevant tools
- Show comprehensive technology coverage

### Visual Design Requirements
- **Consistent Styling**: Match existing LearnByShorts design
- **Progressive Disclosure**: Show information hierarchy clearly
- **Mobile Responsive**: Work on all device sizes
- **Accessibility**: Include proper ARIA labels and semantic HTML
- **Performance**: Optimize images and loading times

### SEO and Metadata
- **Title Tags**: Include course name and key technologies
- **Meta Descriptions**: Compelling description with keywords
- **Structured Data**: Course schema markup
- **Open Graph**: Social media sharing optimization

## Output File
Save as: `[COURSE_ID].html`

## Final Chain Complete
Course generation chain is now complete with:
1. ✅ Course Architecture
2. ✅ Character Profiles  
3. ✅ Topic Outlines
4. ✅ Individual Topics
5. ✅ Integration Files
6. ✅ Quality Validation
7. ✅ Course Page

The complete course is ready for deployment!
