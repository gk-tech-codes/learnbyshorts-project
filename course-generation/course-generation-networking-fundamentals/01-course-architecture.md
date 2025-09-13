# Chain 1: Course Architecture Generation

## Input Required
- **Course Topic**: networking-fundamentals

## Prompt

You are an expert course architect. Create a comprehensive course structure for: **networking-fundamentals**

### Requirements
- **6-8 Progressive Topics**: Each building on previous knowledge
- **Modern Industry Context**: 2024-2025 tools and practices
- **Real Business Value**: Measurable career outcomes
- **Character Foundation**: 3-4 main characters for story continuity

### Output Structure
Generate complete JSON:

```json
{
  "courseId": "kebab-case-id",
  "title": "Professional Course Title",
  "description": "2-sentence description with modern context and business value",
  "difficulty": "Progressive (Beginner to Advanced)",
  "estimatedHours": "8-12 hours",
  "categoryId": "appropriate-category",
  "prerequisites": ["specific technical requirements"],
  "learningOutcomes": [
    "Measurable outcome 1",
    "Career-relevant outcome 2",
    "Industry-applicable outcome 3"
  ],
  "characters": [
    {
      "name": "Character Name",
      "role": "Modern Role (SRE, Platform Engineer, etc.)",
      "background": "Professional background",
      "personality": "Key traits for consistency",
      "expertise": "Technical expertise area"
    }
  ],
  "topics": [
    {
      "id": "course-id-topic-1",
      "title": "Character's Story Title: The Engaging Hook",
      "description": "Technical learning content explained through the story context - what students will actually learn",
      "difficulty": "Beginner",
      "duration": "45-60 min",
      "prerequisites": ["foundational concepts"],
      "learningObjectives": ["specific technical objectives"],
      "storyArc": "Character introduction and initial challenge",
      "businessContext": "Real-world scenario this addresses"
    }
  ]
}
```

### Modern Context Requirements
- **Current Technology**: React 18+, Node.js 20+, Python 3.12+
- **Cloud Platforms**: AWS, Azure, GCP latest services
- **DevOps Practices**: CI/CD, IaC, observability
- **Industry Trends**: AI/ML, cloud-native, security-first

### Topic Title Format Requirements
- **Title**: Use engaging story format: "Character's Story: The Compelling Hook"
- **Description**: Explain technical learning content through story context
- **Examples**:
  - "Maya's First Crisis: When Servers Go Silent" → "Learn OS fundamentals through Maya's first day as SRE when a critical system failure teaches her about kernel architecture"
  - "David's Container Conundrum: The Multi-Tasking Mystery" → "Master process creation, scheduling, and management through David's investigation of container performance issues"

### Topic Progression Guidelines
1. **Foundation**: Core concepts with modern context
2. **Building**: Progressive complexity and real applications
3. **Integration**: Combining concepts and patterns
4. **Advanced**: Expert-level and cutting-edge techniques
5. **Mastery**: Industry best practices and leadership

## Output File
Save as: `course-architecture.json`

## Next Chain
Proceed to Chain 2: Character Profiles using this architecture.
