function codeWithoutCommentsOrStrings(source) {
  let result = '';
  let state = 'code';

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (char === '\n') {
        state = 'code';
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }

    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        result += '  ';
        index += 1;
        state = 'code';
      } else {
        result += char === '\n' ? '\n' : ' ';
      }
      continue;
    }

    if (state === 'string' || state === 'character') {
      const closing = state === 'string' ? '"' : "'";
      if (char === '\\') {
        result += ' ';
        if (next != null) {
          result += next === '\n' ? '\n' : ' ';
          index += 1;
        }
      } else if (char === closing) {
        result += ' ';
        state = 'code';
      } else {
        result += char === '\n' ? '\n' : ' ';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      result += '  ';
      index += 1;
      state = 'line-comment';
    } else if (char === '/' && next === '*') {
      result += '  ';
      index += 1;
      state = 'block-comment';
    } else if (char === '"') {
      result += ' ';
      state = 'string';
    } else if (char === "'") {
      result += ' ';
      state = 'character';
    } else {
      result += char;
    }
  }

  return result;
}

function lineNumber(source, index) {
  return source.slice(0, index + 1).split('\n').length;
}

function delimiterDiagnostics(source) {
  const clean = codeWithoutCommentsOrStrings(source);
  const opening = new Set(['{', '(', '[']);
  const matching = { '}': '{', ')': '(', ']': '[' };
  const labels = { '{': 'brace', '(': 'parenthesis', '[': 'bracket' };
  const stack = [];
  const diagnostics = [];

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (opening.has(char)) {
      stack.push({ char, index });
      continue;
    }
    if (!matching[char]) continue;

    const expected = matching[char];
    const current = stack.pop();
    if (!current || current.char !== expected) {
      diagnostics.push(`Line ${lineNumber(clean, index)}: unmatched closing ${labels[expected]}.`);
      if (current) stack.push(current);
    }
  }

  stack.reverse().forEach(item => {
    diagnostics.push(`Line ${lineNumber(clean, item.index)}: unclosed ${labels[item.char]}.`);
  });

  return diagnostics;
}

function challengeChecks(block) {
  if (Array.isArray(block.checks) && block.checks.length) return block.checks;
  return (block.solutionIncludes || []).map((value, index) => ({
    id: `legacy-${index}`,
    label: `Include ${value}`,
    pattern: String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }));
}

export function evaluateJavaChallenge(block, source) {
  const rawCode = String(source || '');
  const code = rawCode.slice(0, 12000);
  const diagnostics = [];

  if (rawCode.length > 12000) {
    diagnostics.push('Keep this practice file under 12,000 characters.');
  }
  if (code.trim().length < 20) {
    diagnostics.push('Add enough Java code to demonstrate the requested behavior.');
  }
  diagnostics.push(...delimiterDiagnostics(code));

  const checks = challengeChecks(block).map((check, index) => {
    let passed = false;
    try {
      const expression = new RegExp(check.pattern, check.flags || 'm');
      const matches = code.match(new RegExp(expression.source, expression.flags.includes('g')
        ? expression.flags
        : `${expression.flags}g`)) || [];
      passed = matches.length >= (check.minMatches || 1);
    } catch {
      diagnostics.push(`Requirement ${index + 1} is misconfigured.`);
    }

    return {
      id: check.id || `requirement-${index + 1}`,
      label: check.label || `Requirement ${index + 1}`,
      hint: check.hint || 'Review the prompt and the relevant Java syntax.',
      passed
    };
  });

  return {
    pass: diagnostics.length === 0 && checks.length > 0 && checks.every(check => check.passed),
    diagnostics,
    checks
  };
}
