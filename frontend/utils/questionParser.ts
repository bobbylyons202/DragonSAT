/**
 * Normalizes LaTeX in question text
 * Converts between different LaTeX formats to standardized $...$ for inline
 * and $$...$$ for display math
 */
export function normalizeLatex(text: string): string {
  if (!text) return text;

  // Convert \(...\) to $...$
  text = text.replace(/\\\((.*?)\\\)/g, '$$$1$$');

  // Convert \[...\] to $$...$$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');

  // Wrap \begin{...}...\end{...} environments in $$...$$
  // Also strip \hline which KaTeX doesn't support in align environments
  text = text.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, (match) => {
    const cleaned = match.replace(/\\hline\s*/g, '');
    return `$$${cleaned}$$`;
  });

  // Wrap \command{...}{...} patterns (like \frac{a b}{c}, \sqrt{x}) in $...$
  // Must run before the bare command regex since braces can contain spaces
  let tempParts = text.split(/(\$\$?[^$]+\$\$?)/);
  for (let i = 0; i < tempParts.length; i += 2) {
    tempParts[i] = tempParts[i].replace(
      /\\([a-zA-Z]{2,})(\{[^}]*\})+/g,
      (match) => `$${match}$`
    );
  }
  text = tempParts.join('');

  // Wrap remaining bare math notation in $...$
  // Re-split to protect newly wrapped blocks from further processing
  const parts = text.split(/(\$\$?[^$]+\$\$?)/);
  for (let i = 0; i < parts.length; i += 2) {
    // Bare ^ exponents: x^2 → $x^2$, x^{n} → $x^{n}$
    parts[i] = parts[i].replace(
      /([A-Za-z0-9_(]*[A-Za-z0-9_)]+)\^(\{[^}]+\}|[A-Za-z0-9_]+)/g,
      (_, base, exp) => `$${base}^{${exp.startsWith('{') ? exp.slice(1, -1) : exp}}$`
    );
    // Bare LaTeX commands without brace args: \neq, \leq, etc.
    parts[i] = parts[i].replace(
      /(\S*)\\([a-zA-Z]{2,})(\S*)/g,
      (_, left, cmd, right) => `$${left}\\${cmd}${right}$`
    );
  }
  text = parts.join('');

  return text;
}

export interface ParsedQuestion {
  id: string;
  domain: string;
  difficulty: string;
  paragraph?: string;
  question: string;
  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export function parseQuestion(data: any): ParsedQuestion {
  return {
    id: data.id,
    domain: data.domain,
    difficulty: data.difficulty,
    paragraph: data.question?.paragraph && data.question.paragraph !== 'null'
      ? normalizeLatex(data.question.paragraph)
      : undefined,
    question: normalizeLatex(data.question?.question || ''),
    choices: {
      A: normalizeLatex(data.question?.choices?.A || ''),
      B: normalizeLatex(data.question?.choices?.B || ''),
      C: normalizeLatex(data.question?.choices?.C || ''),
      D: normalizeLatex(data.question?.choices?.D || ''),
    },
    correct_answer: data.correct_answer || data.question?.correct_answer || 'A',
    explanation: normalizeLatex(data.explanation || data.question?.explanation || ''),
  };
}

export function parseQuestions(data: any[]): ParsedQuestion[] {
  return data.map(parseQuestion);
}

const MATH_DOMAINS = new Set([
  'Algebra',
  'Advanced Math',
  'Geometry and Trigonometry',
  'Problem-Solving and Data Analysis',
]);

export function getSectionFromDomain(domain: string): string {
  return MATH_DOMAINS.has(domain) ? 'math' : 'english';
}
