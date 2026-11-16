import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProblems } from './problems.ts';

test('parses weeks, problems, and warns on bad list lines', () => {
  const result = parseProblems([
    '# 문제 목록',
    '',
    '## W6 (26-11-w2)',
    '* [level 2] 타겟 넘버',
    '',
    '## W7 (26-11-w3)',
    '- [Medium] Two Sum https://leetcode.com/problems/two-sum/',
    '- [Hard] Median of Two Sorted Arrays https://leetcode.com/problems/median-of-two-sorted-arrays/description/',
    '- [Easy] no link here',
  ].join('\n'));

  assert.equal(result.weeks.length, 2);
  assert.deepEqual(result.weeks[1], {
    name: 'W7',
    label: '26-11-w3',
    problems: [
      { difficulty: 'Medium', title: 'Two Sum', slug: 'two-sum' },
      { difficulty: 'Hard', title: 'Median of Two Sorted Arrays', slug: 'median-of-two-sorted-arrays' },
    ],
  });
  assert.deepEqual(result.warnings, ['4줄: * [level 2] 타겟 넘버', '9줄: - [Easy] no link here']);
});

test('problem before any week heading is a warning', () => {
  const result = parseProblems('- [Easy] Two Sum https://leetcode.com/problems/two-sum/');
  assert.equal(result.weeks.length, 0);
  assert.equal(result.warnings.length, 1);
});
