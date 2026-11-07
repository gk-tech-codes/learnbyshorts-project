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
    const blockIds = new Set();
    for (const t of c.topics) {
      if (!t.id || !Array.isArray(t.blocks) || !t.blocks.length)
        throw new Error(`Topic ${t.id || '?'} invalid`);
      for (const b of t.blocks) {
        if (!b.id || !BLOCK_TYPES.includes(b.type))
          throw new Error(`Block ${b.id || '?'} has invalid type ${b.type}`);
        if (blockIds.has(b.id)) throw new Error(`Duplicate block id ${b.id}`);
        blockIds.add(b.id);
        if (b.type === 'recall' && (!b.front || !b.back))
          throw new Error(`Recall block ${b.id} is missing front/back`);
        if (b.type === 'quiz') CourseLoader.validateQuiz(b);
        if (b.type === 'boss') {
          if (!Array.isArray(b.questions) || !b.questions.length)
            throw new Error(`Boss block ${b.id} has no questions`);
          b.questions.forEach(CourseLoader.validateQuiz);
        }
        if (b.type === 'code') {
          const checks = b.checks || [];
          if (!Array.isArray(checks) || checks.length < 2)
            throw new Error(`Code block ${b.id} needs at least two checks`);
          for (const check of checks) {
            if (!check.label || !check.pattern || check.pattern.length > 240)
              throw new Error(`Code block ${b.id} has an invalid check`);
            try { new RegExp(check.pattern, check.flags || 'm'); }
            catch { throw new Error(`Code block ${b.id} has an invalid check pattern`); }
          }
        }
      }
    }
    return true;
  }

  static validateQuiz(quiz) {
    if (!quiz || !quiz.id || !Array.isArray(quiz.options) || quiz.options.length < 2)
      throw new Error(`Quiz ${quiz?.id || '?'} is invalid`);
    if (quiz.options.filter(option => option.correct).length !== 1)
      throw new Error(`Quiz ${quiz.id} must have exactly one correct answer`);
  }

  // Flatten all blocks across topics into one ordered sequence.
  // interactionFirst: within each topic, lead with the first "doing" block
  // (Brilliant "learn by doing" / sub-60s aha). Prefer active production
  // (quiz/code/choice) over recall, which is review rather than first-exposure.
  static sequence(course, { interactionFirst = false } = {}) {
    return course.topics.flatMap(t => {
      let blocks = t.blocks;
      if (interactionFirst) {
        const activeIndex = blocks.findIndex(b => ['quiz', 'code', 'choice'].includes(b.type));
        const recallIndex = blocks.findIndex(b => b.type === 'recall');
        const i = activeIndex > 0 ? activeIndex : recallIndex;
        if (i > 0) blocks = [blocks[i], ...blocks.slice(0, i), ...blocks.slice(i + 1)];
      }
      return blocks.map(b => ({ ...b, topicId: t.id }));
    });
  }
}
