// CourseLoader: fetch a manifest and do lightweight structural validation.
const BLOCK_TYPES = ['story', 'choice', 'recall', 'quiz', 'code', 'boss'];

export class CourseLoader {
  static async load(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load course: ${res.status}`);
    const course = await res.json();
    CourseLoader.validate(course);
    return course;
  }

  static validate(c) {
    if (!c || !c.id || !c.title) throw new Error('Course missing id/title');
    if (!Array.isArray(c.topics) || !c.topics.length) throw new Error('Course has no topics');
    for (const t of c.topics) {
      if (!t.id || !Array.isArray(t.blocks) || !t.blocks.length)
        throw new Error(`Topic ${t.id || '?'} invalid`);
      for (const b of t.blocks) {
        if (!b.id || !BLOCK_TYPES.includes(b.type))
          throw new Error(`Block ${b.id || '?'} has invalid type ${b.type}`);
      }
    }
    return true;
  }

  // Flatten all blocks across topics into one ordered sequence.
  // interactionFirst: within each topic, lead with the first "doing" block
  // (Brilliant "learn by doing" / sub-60s aha). Prefer active production
  // (quiz/code/choice) over recall, which is review rather than first-exposure.
  static sequence(course, { interactionFirst = false } = {}) {
    const PREFERRED = ['quiz', 'code', 'choice', 'recall'];
    return course.topics.flatMap(t => {
      let blocks = t.blocks;
      if (interactionFirst) {
        let i = -1;
        for (const type of PREFERRED) {
          i = blocks.findIndex(b => b.type === type);
          if (i > 0) break;
        }
        if (i > 0) blocks = [blocks[i], ...blocks.slice(0, i), ...blocks.slice(i + 1)];
      }
      return blocks.map(b => ({ ...b, topicId: t.id }));
    });
  }
}
