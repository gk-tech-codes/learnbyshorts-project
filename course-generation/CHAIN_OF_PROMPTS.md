# Course Generation: Chain of Prompts

## Overview
Course creation follows a structured chain of prompts, each building on the previous output. This ensures consistency, character continuity, and progressive learning.

## Chain Structure

### 🔗 Chain 1: Course Architecture
**Input**: Course topic (e.g., "Modern React Development")
**Output**: Complete course structure with characters and topics
**File**: `prompts/01-course-architecture.md`

### 🔗 Chain 2: Character Profiles
**Input**: Course architecture from Chain 1
**Output**: Detailed character profiles and relationships
**File**: `prompts/02-character-profiles.md`

### 🔗 Chain 3: Topic Outline
**Input**: Course architecture + Character profiles
**Output**: Detailed outline for each topic with learning progression
**File**: `prompts/03-topic-outline.md`

### 🔗 Chain 4: Individual Topic Generation
**Input**: Topic outline + Previous topic context + Character profiles
**Output**: Complete story-based topic with 5 sections
**File**: `prompts/04-topic-generation.md`
**Note**: Repeat for each topic in sequence

### 🔗 Chain 5: Integration Files
**Input**: All generated topics + Course architecture
**Output**: All platform integration files (JSON, JS, HTML)
**File**: `prompts/05-integration-files.md`

### 🔗 Chain 6: Quality Validation
**Input**: Complete course + Integration files
**Output**: Validation report and fixes needed
**File**: `prompts/06-quality-validation.md`

### 🔗 Chain 6.5: Content Completeness Verification
**Input**: Complete course + Quality validation report
**Output**: Missing content detection and regeneration prompts
**File**: `prompts/06.5-content-verification.md`

### 🔗 Chain 7: Course Page Generation
**Input**: Course architecture + All topics
**Output**: HTML course landing page
**File**: `prompts/07-course-page.md`

## Chain Dependencies

```
Course Topic
    ↓
Chain 1: Architecture
    ↓
Chain 2: Characters
    ↓
Chain 3: Topic Outlines
    ↓
Chain 4: Topic 1 → Topic 2 → Topic 3 → ... → Topic N
    ↓
Chain 5: Integration
    ↓
Chain 6: Validation
    ↓
Chain 6.5: Content Verification
    ↓
Chain 7: Course Page
    ↓
Complete Course Ready
```

## Scripts

### Main Generation Script
- `scripts/generate-course.sh` - Orchestrates the entire chain
- `scripts/generate-topic.sh` - Handles individual topic generation
- `scripts/integrate-course.sh` - Handles platform integration

### Helper Scripts
- `scripts/validate-chain.sh` - Validates chain dependencies
- `scripts/load-context.sh` - Loads previous context for continuity
- `scripts/save-progress.sh` - Saves generation progress

## Templates

### Output Templates
- `templates/course-architecture.json` - Course structure template
- `templates/character-profile.json` - Character profile template
- `templates/topic-story.json` - Topic story template
- `templates/integration-files/` - All integration file templates

## Usage

```bash
# Start the chain
./scripts/generate-course.sh "Modern React Development"

# This will:
# 1. Generate course architecture
# 2. Create character profiles
# 3. Generate topic outlines
# 4. Generate each topic in sequence
# 5. Create integration files
# 6. Validate complete course
# 7. Generate course page
```

## Context Preservation

Each chain step preserves context for the next:
- **Character continuity** across all topics
- **Learning progression** building on previous knowledge
- **Story consistency** maintaining narrative flow
- **Technical accuracy** ensuring modern practices throughout
