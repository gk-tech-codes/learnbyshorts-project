# Chain 3: Topic Outline Generation

## Input Required
- **Course Architecture**: From Chain 1 (`course-architecture.json`)
- **Character Profiles**: From Chain 2 (`character-profiles.json`)

## Prompt

You are a curriculum designer. Create detailed outlines for each topic using the course architecture and character profiles from previous chains.

### Input Context
Load course architecture and character profiles from Chains 1 and 2.

### Requirements
- **Progressive Learning**: Each topic builds on previous knowledge
- **Character Integration**: Use established characters consistently
- **Story Continuity**: Maintain narrative flow across topics
- **Modern Relevance**: Current industry practices and challenges

### Output Structure
Generate detailed topic outlines:

```json
{
  "courseId": "[FROM_CHAIN_1]",
  "topicOutlines": [
    {
      "id": "topic-id",
      "title": "Character's Story: The Engaging Hook",
      "sequenceNumber": 1,
      "difficulty": "Beginner/Intermediate/Advanced",
      "duration": "45-60 min",
      "prerequisites": {
        "fromPreviousTopics": ["concepts from earlier topics"],
        "external": ["external knowledge needed"]
      },
      "learningObjectives": [
        "Specific, measurable technical objective 1",
        "Specific, measurable technical objective 2"
      ],
      "storyDescription": "Technical learning content explained through story context - what students actually learn through the narrative",
      "storyOutline": {
        "setting": "Where the story takes place",
        "initialSituation": "Starting scenario and context",
        "challenge": "Main problem to solve",
        "characters": ["which characters are featured"],
        "characterRoles": "How each character contributes",
        "resolution": "How the challenge is resolved",
        "learningMoments": ["key learning points in story"]
      },
      "technicalContent": {
        "coreconcepts": ["main concepts covered"],
        "technologies": ["specific tools/frameworks"],
        "codeExamples": ["types of code to include"],
        "bestPractices": ["industry best practices"],
        "commonPitfalls": ["mistakes to avoid"],
        "realWorldApplications": ["how this applies in practice"]
      },
      "businessContext": {
        "scenario": "Business situation driving the need",
        "impact": "Business impact of the solution",
        "metrics": "Measurable outcomes",
        "stakeholders": "Who cares about this outcome"
      },
      "connectionToPrevious": "How this builds on previous topics",
      "setupForNext": "How this prepares for next topic"
    }
  ],
  "overallNarrative": {
    "storyArc": "Overall story progression across all topics",
    "characterDevelopment": "How characters grow throughout course",
    "businessJourney": "Business challenges and solutions progression",
    "technicalProgression": "Technical complexity and skill building"
  }
}
```

### Story Title Format Requirements
- **Title Format**: "Character's Story: The Compelling Hook"
- **Story Description**: Technical learning explained through narrative context
- **Display Format**: 
  ```
  📚 Character's Story: The Compelling Hook
  Technical learning content explained through story - what students actually learn
  ```

### Topic Progression Guidelines
- **Foundation First**: Start with core concepts and context
- **Incremental Complexity**: Gradually increase difficulty
- **Practical Application**: Each topic has real-world relevance
- **Character Growth**: Characters learn and develop skills
- **Business Value**: Clear connection to business outcomes

### Story Continuity Requirements
- **Character Consistency**: Maintain established personalities
- **Narrative Flow**: Stories connect and reference each other
- **Learning Progression**: Knowledge builds logically
- **Workplace Realism**: Authentic business scenarios

## Output File
Save as: `topic-outlines.json`

## Next Chain
Proceed to Chain 4: Individual Topic Generation using all previous context.
