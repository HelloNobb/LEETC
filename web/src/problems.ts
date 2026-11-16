export interface ProblemItem {
  difficulty: string;
  title: string;
  slug: string;
  bonus: boolean;
}

export interface Week {
  name: string;
  label: string;
  problems: ProblemItem[];
}

export interface ParseResult {
  weeks: Week[];
  warnings: string[];
}

const WEEK_LINE = /^##\s+(\S+)\s*(.*)$/;
// "* (보너스) [Medium] 322. Coin Change https://leetcode.com/problems/coin-change/" — prefix and link are optional.
const PROBLEM_LINE = /^\s*[-*]\s+(?:\(([^)]*)\)\s*)?\[([^\]]+)\]\s+(.+?)(?:\s+https?:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\S*)?\s*$/;
const LEETCODE_DIFFICULTY = /^(easy|medium|hard)$/i;
// Programmers problems from older weeks ("[level 2] 타겟 넘버") aren't LeetCode and aren't errors either.
const PROGRAMMERS_LINE = /^\s*[-*]\s+\[level \d\]/;
// Only list items can be malformed problems; headings and prose are ignored silently.
const LIST_LINE = /^\s*[-*]\s+/;

// LeetCode slugs are the title lowercased with punctuation dropped: "Pow(x, n)" -> "powx-n".
export function slugFromTitle(title: string): string {
  return title
    .replace(/^\d+\.\s*/, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

export function parseProblems(markdown: string): ParseResult {
  const weeks: Week[] = [];
  const warnings: string[] = [];
  markdown.split(/\r?\n/).forEach((line, index) => {
    const week = line.match(WEEK_LINE);
    if (week) {
      weeks.push({ name: week[1], label: week[2].trim(), problems: [] });
      return;
    }
    if (!LIST_LINE.test(line) || PROGRAMMERS_LINE.test(line)) return;
    const problem = line.match(PROBLEM_LINE);
    const current = weeks.at(-1);
    // Without a link the slug is guessed from the title, which only makes sense for LeetCode difficulties.
    const slug = problem && (problem[4] ?? (LEETCODE_DIFFICULTY.test(problem[2]) ? slugFromTitle(problem[3]) : ''));
    if (problem && slug && current) {
      current.problems.push({ difficulty: problem[2], title: problem[3], slug, bonus: problem[1] !== undefined });
    } else {
      warnings.push(`${index + 1}줄: ${line.trim()}`);
    }
  });
  return { weeks, warnings };
}
