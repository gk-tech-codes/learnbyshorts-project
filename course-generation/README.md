# Course Generation: Chain of Prompts System

## Overview
This system generates complete courses through a structured chain of 7 prompts, each building on the previous output to ensure consistency, character continuity, and progressive learning.

## 🔗 Chain Structure

### Chain 1: Course Architecture
- **Input**: Course topic (e.g., "Modern React Development")
- **Output**: `course-architecture.json` - Complete course structure with characters and topics
- **Purpose**: Establishes foundation for entire course

### Chain 2: Character Profiles  
- **Input**: Course architecture from Chain 1
- **Output**: `character-profiles.json` - Detailed character profiles and relationships
- **Purpose**: Creates consistent characters for story continuity

### Chain 3: Topic Outlines
- **Input**: Course architecture + Character profiles
- **Output**: `topic-outlines.json` - Detailed outline for each topic
- **Purpose**: Plans learning progression and story arcs

### Chain 4: Individual Topic Generation
- **Input**: Topic outlines + Previous topic context + Character profiles
- **Output**: `topic-[N]-*.json` - Complete story-based topics with 5 sections
- **Purpose**: Generates actual course content with character continuity

### Chain 5: Integration Files
- **Input**: All generated topics + Course architecture
- **Output**: Platform integration files (JSON, JS, HTML)
- **Purpose**: Integrates course into LearnByShorts platform

### Chain 6: Quality Validation
- **Input**: Complete course + Integration files
- **Output**: `validation-report.json` - Validation report and fixes needed
- **Purpose**: Ensures quality and deployment readiness

### Chain 7: Course Page Generation
- **Input**: Course architecture + All topics + Validation report
- **Output**: `[course-id].html` - Complete course landing page
- **Purpose**: Creates marketing/overview page for course

## 📁 Directory Structure

```
course-generation/
├── README.md                    # This file
├── CHAIN_OF_PROMPTS.md         # Chain overview
├── prompts/                    # All prompt files
│   ├── 01-course-architecture.md
│   ├── 02-character-profiles.md
│   ├── 03-topic-outline.md
│   ├── 04-topic-generation.md
│   ├── 05-integration-files.md
│   ├── 06-quality-validation.md
│   └── 07-course-page.md
├── scripts/                    # Generation scripts
│   └── generate-course.sh      # Main orchestration script
├── templates/                  # Output templates
└── examples/                   # Example outputs
```

## 🚀 Usage

### Start New Course Generation
```bash
# Initialize course generation chain
./scripts/generate-course.sh "Modern React Development"

# This creates working directory and Chain 1 prompt
```

### Execute Individual Chains
```bash
# Chain 1: Course Architecture
./scripts/generate-course.sh "Modern React Development" 1

# Chain 2: Character Profiles (after completing Chain 1)
./scripts/generate-course.sh "Modern React Development" 2

# Continue through all chains...
./scripts/generate-course.sh "Modern React Development" 3
./scripts/generate-course.sh "Modern React Development" 4
./scripts/generate-course.sh "Modern React Development" 5
./scripts/generate-course.sh "Modern React Development" 6
./scripts/generate-course.sh "Modern React Development" 7
```

### Check Status
```bash
# View current generation status
./scripts/generate-course.sh "Modern React Development" status
```

## 📋 Chain Dependencies

```
Course Topic
    ↓
Chain 1: Architecture (course-architecture.json)
    ↓
Chain 2: Characters (character-profiles.json)
    ↓
Chain 3: Outlines (topic-outlines.json)
    ↓
Chain 4: Topics (topic-1.json, topic-2.json, ...)
    ↓
Chain 5: Integration (integration files)
    ↓
Chain 6: Validation (validation-report.json)
    ↓
Chain 7: Course Page ([course-id].html)
    ↓
Complete Course Ready for Deployment
```

## 🔧 How Each Chain Works

### Chain 1: Course Architecture
1. Use prompt: `prompts/01-course-architecture.md`
2. Generate: Complete course structure with 6-8 topics
3. Include: Modern technology context, character foundation
4. Output: `course-architecture.json`

### Chain 2: Character Profiles
1. Load: Course architecture from Chain 1
2. Use prompt: `prompts/02-character-profiles.md`
3. Generate: Detailed character profiles and team dynamics
4. Output: `character-profiles.json`

### Chain 3: Topic Outlines
1. Load: Course architecture + Character profiles
2. Use prompt: `prompts/03-topic-outline.md`
3. Generate: Detailed outlines for each topic with story arcs
4. Output: `topic-outlines.json`

### Chain 4: Individual Topics
1. Load: All previous context + Previous topic (for continuity)
2. Use prompt: `prompts/04-topic-generation.md`
3. Generate: Complete 5-section story-based topic
4. Output: `topic-[N]-[topic-id].json`
5. Repeat: For each topic in sequence

### Chain 5: Integration Files
1. Load: All generated topics + Course architecture
2. Use prompt: `prompts/05-integration-files.md`
3. Generate: All platform integration files
4. Output: Multiple integration files

### Chain 6: Quality Validation
1. Load: Complete course + Integration files
2. Use prompt: `prompts/06-quality-validation.md`
3. Generate: Comprehensive validation report
4. Output: `validation-report.json`

### Chain 7: Course Page
1. Load: All course content + Validation report
2. Use prompt: `prompts/07-course-page.md`
3. Generate: Complete HTML course landing page
4. Output: `[course-id].html`

## ✅ Quality Assurance

### Context Preservation
- **Character Continuity**: Characters maintain personalities across topics
- **Learning Progression**: Each topic builds on previous knowledge
- **Story Consistency**: Narrative flow maintained throughout
- **Technical Accuracy**: Modern practices and current versions

### Validation Checks
- **Content Quality**: All sections complete and substantial
- **Character Consistency**: Personalities and relationships maintained
- **Technical Accuracy**: Current frameworks and best practices
- **Learning Progression**: Logical skill building
- **Integration Completeness**: All platform files generated correctly

## 🎯 Example Workflow

```bash
# 1. Start course generation
./scripts/generate-course.sh "Cloud Architecture Patterns"

# 2. Complete Chain 1 - Generate course-architecture.json manually
# 3. Continue to Chain 2
./scripts/generate-course.sh "Cloud Architecture Patterns" 2

# 4. Complete Chain 2 - Generate character-profiles.json manually
# 5. Continue through all chains...

# 6. Check final status
./scripts/generate-course.sh "Cloud Architecture Patterns" status
```

## 📊 Success Metrics

### Complete Course Includes:
- ✅ 6-8 progressive topics with character continuity
- ✅ Modern technology context (2024-2025)
- ✅ Real-world business scenarios and applications
- ✅ Complete platform integration
- ✅ Quality validation passed
- ✅ Professional course landing page
- ✅ Ready for student enrollment

### Generated Files:
- Course architecture and character profiles
- 6-8 complete story-based topics
- All platform integration files
- Quality validation report
- Professional course landing page
- Complete deployment package

## 🚀 Ready for Production

This chain of prompts system can generate complete, professional courses for any topic with:
- **Character continuity** throughout the learning journey
- **Progressive learning** that builds skills systematically
- **Modern technology context** with current industry practices
- **Complete platform integration** ready for deployment
- **Quality assurance** ensuring professional standards

The system is designed to scale and can generate courses on any technical topic while maintaining consistency and quality.
