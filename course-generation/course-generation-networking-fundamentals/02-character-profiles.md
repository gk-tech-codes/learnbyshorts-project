# Chain 2: Character Profiles Generation

## Input Required
- **Course Architecture**: From Chain 1 (`course-architecture.json`)

## Prompt

You are a character development specialist. Create detailed character profiles for the course using the architecture from Chain 1.

### Input Context
Load the course architecture and character foundation from Chain 1.

### Requirements
- **Expand Character Details**: Build on basic character info from Chain 1
- **Team Dynamics**: Define relationships and collaboration patterns
- **Growth Arcs**: Plan character development throughout course
- **Modern Workplace**: Reflect current industry roles and practices

### Output Structure
Generate detailed character profiles:

```json
{
  "courseId": "[FROM_CHAIN_1]",
  "characters": [
    {
      "name": "Character Name",
      "role": "Specific modern role",
      "background": "Detailed professional background",
      "personality": {
        "traits": ["trait1", "trait2", "trait3"],
        "workStyle": "How they approach problems",
        "communication": "How they interact with team"
      },
      "expertise": {
        "primary": "Main technical area",
        "secondary": ["supporting skills"],
        "learning": "What they're currently learning"
      },
      "storyRole": {
        "function": "Role in story progression",
        "relationships": "How they relate to other characters",
        "growthArc": "How they develop throughout course"
      },
      "modernContext": {
        "tools": ["tools they use"],
        "practices": ["methodologies they follow"],
        "challenges": ["current industry challenges they face"]
      }
    }
  ],
  "teamDynamics": {
    "structure": "How the team is organized",
    "collaboration": "How they work together",
    "communication": "Team communication patterns",
    "decisionMaking": "How decisions are made",
    "conflictResolution": "How they handle disagreements"
  },
  "workplaceContext": {
    "company": "Type of company (startup, enterprise, etc.)",
    "industry": "Industry sector",
    "challenges": "Business challenges they face",
    "goals": "Team and company objectives",
    "culture": "Workplace culture and values"
  }
}
```

### Character Development Guidelines
- **Diverse Backgrounds**: Different experiences and perspectives
- **Complementary Skills**: Characters with different expertise areas
- **Realistic Growth**: Believable learning and development
- **Modern Roles**: Current industry positions and responsibilities
- **Team Chemistry**: Natural collaboration and mentorship

### Story Integration
- **Consistent Personalities**: Maintain character traits throughout
- **Progressive Learning**: Characters learn and grow with each topic
- **Realistic Interactions**: Authentic workplace dynamics
- **Mentorship Patterns**: Senior/junior relationships and knowledge sharing

## Output File
Save as: `character-profiles.json`

## Next Chain
Proceed to Chain 3: Topic Outline using architecture and character profiles.
