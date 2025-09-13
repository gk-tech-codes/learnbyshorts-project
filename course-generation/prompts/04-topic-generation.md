# Chain 4: Individual Topic Generation

## Input Required
- **Course Architecture**: From Chain 1 (`course-architecture.json`)
- **Character Profiles**: From Chain 2 (`character-profiles.json`)
- **Topic Outlines**: From Chain 3 (`topic-outlines.json`)
- **Previous Topic Context**: From previous topic generation (if not first topic)

## Prompt

You are a master storyteller creating educational content. Generate a complete story-based topic using all previous context.

### Input Context
Load all previous chain outputs and maintain consistency.

### Topic Selection
Generate content for: **Topic [NUMBER]: [STORY_TITLE]**

**Story Title Format**: "Character's Story: The Compelling Hook"
**Technical Description**: Explain what students learn through the story context

### Requirements
- **Character Continuity**: Use established characters and relationships
- **Story Progression**: Build on previous topic outcomes
- **Learning Progression**: Assume knowledge from previous topics
- **Modern Context**: Current technology and industry practices

### Output Structure
Generate complete topic with 5 sections:

```json
{
  "id": "topic-id-from-outline",
  "title": "Character's Story: The Compelling Hook",
  "subtitle": "Technical learning through engaging narrative",
  "description": "What students learn explained through story context",
  "difficulty": "From outline",
  "estimatedTime": "From outline",
  "category": "Course category",
  "subcategory": "Topic subcategory",
  "tags": ["relevant", "modern", "tags"],
  "prerequisites": ["from outline"],
  "learningObjectives": ["from outline"],
  "content": [
    {
      "type": "story_intro",
      "title": "🎯 Engaging Hook Title",
      "content": "400-600 words: Continue character development, establish business scenario, create urgency, reference previous topics, set up learning journey"
    },
    {
      "type": "problem_statement",
      "title": "📝 Problem Title",
      "content": "350-500 words: Define technical challenge, show business impact, explain why previous solutions insufficient, connect to modern industry context"
    },
    {
      "type": "thinking_process",
      "title": "💭 Learning Journey Title",
      "content": "500-800 words: Show systematic problem-solving, multiple approaches, character collaboration, modern best practices, debugging methodology"
    },
    {
      "type": "code_solution",
      "title": "💻 Implementation Title",
      "content": "300+ words + comprehensive code: Production-ready implementation, current frameworks, error handling, performance optimization, security, monitoring"
    },
    {
      "type": "story_conclusion",
      "title": "✅ Success Title",
      "content": "400-600 words: Successful resolution, measurable results, character growth, key learning reinforcement, industry trends, setup for next topic"
    }
  ],
  "quiz": [
    {
      "question": "Specific question about key concept",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1,
      "explanation": "Detailed explanation connecting to story and real-world application"
    }
  ],
  "nextTopic": {
    "id": "next-topic-id",
    "title": "Next Topic Title",
    "description": "How next topic builds on this one"
  }
}
```

### Content Requirements

#### Story Intro
- Continue established character relationships
- Reference previous topic outcomes and learning
- Establish new business challenge requiring this topic's concepts
- Create emotional investment and urgency
- Use modern workplace context and tools

#### Problem Statement
- Build on knowledge from previous topics
- Show why current approach is insufficient
- Explain business impact and stakeholder concerns
- Use current industry context and constraints
- Set up the need for new concepts/techniques

#### Thinking Process
- Show characters applying previous learning
- Demonstrate systematic problem-solving approach
- Include multiple solution approaches and trade-offs
- Show team collaboration and knowledge sharing
- Use modern debugging and analysis techniques

#### Code Solution
- Use current framework versions (2024-2025)
- Include comprehensive error handling
- Show performance optimization techniques
- Include security best practices
- Demonstrate monitoring and observability
- Use production-ready patterns and practices

#### Story Conclusion
- Show measurable business results
- Celebrate character and team growth
- Reinforce key learning points
- Connect to broader industry trends
- Set up anticipation for next topic

### Character Continuity Checklist
- [ ] Maintain established character personalities
- [ ] Reference previous interactions and learning
- [ ] Show progressive skill development
- [ ] Use consistent team dynamics
- [ ] Build on established relationships

### Technical Accuracy Checklist
- [ ] Use current technology versions
- [ ] Include modern best practices
- [ ] Show real-world production patterns
- [ ] Include proper error handling
- [ ] Demonstrate monitoring and debugging

## Output File
Save as: `topic-[NUMBER]-[TOPIC_ID].json`

## Next Chain
- If more topics: Repeat Chain 4 for next topic
- If all topics complete: Proceed to Chain 5: Integration Files
