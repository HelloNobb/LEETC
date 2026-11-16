export interface ProblemItem {
  difficulty: string;
  title: string;
  slug: string;
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

const WEEK_LINE = /^##\s+(\S+)\s*(?:\((.*)\))?\s*$/;
const PROBLEM_LINE = /^\s*[-*]\s+\[([^\]]+)\]\s+(.+?)\s+https?:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\/?\S*\s*$/;
// Only list items can be malformed problems; headings and prose are ignored silently.
const LIST_LINE = /^\s*[-*]\s+/;

export function parseProblems(markdown: string): ParseResult {
  const weeks: Week[] = [];
  const warnings: string[] = [];
  markdown.split(/\r?\n/).forEach((line, index) => {
    const week = line.match(WEEK_LINE);
    if (week) {
      weeks.push({ name: week[1], label: week[2] ?? '', problems: [] });
      return;
    }
    if (!LIST_LINE.test(line)) return;
    const problem = line.match(PROBLEM_LINE);
    const current = weeks.at(-1);
    if (problem && current) current.problems.push({ difficulty: problem[1], title: problem[2], slug: problem[3] });
    else warnings.push(`${index + 1}줄: ${line.trim()}`);
  });
  return { weeks, warnings };
}
