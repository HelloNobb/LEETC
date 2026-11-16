import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProblems, slugFromTitle } from './problems.ts';

test('parses the real PROBLEMS.md shape', () => {
  const result = parseProblems([
    '# 문제 목록',
    '',
    '## W6 (26-09-w4)',
    '',
    '* [level 2] 피로도',
    '',
    '## W7 (26-11-w2) - LeetCode',
    '',
    '* [Easy] 70. Climbing Stairs',
    '* [Medium] 98. Validate Binary Search Tree',
    '* (보너스) [Medium] 322. Coin Change',
  ].join('\n'));

  assert.equal(result.weeks.length, 2);
  assert.deepEqual(result.weeks[0].problems, []);
  assert.deepEqual(result.weeks[1], {
    name: 'W7',
    label: '(26-11-w2) - LeetCode',
    problems: [
      { difficulty: 'Easy', title: '70. Climbing Stairs', slug: 'climbing-stairs', bonus: false },
      { difficulty: 'Medium', title: '98. Validate Binary Search Tree', slug: 'validate-binary-search-tree', bonus: false },
      { difficulty: 'Medium', title: '322. Coin Change', slug: 'coin-change', bonus: true },
    ],
  });
  assert.deepEqual(result.warnings, []);
});

test('link wins over title, bad lines warn', () => {
  const result = parseProblems([
    '## W8 (26-11-w3)',
    '- [Medium] Two Sum https://leetcode.com/problems/two-sum/description/',
    '- [Normal] unknown difficulty and no link',
    '- [Hard]',
    '- no brackets at all',
  ].join('\n'));

  assert.deepEqual(result.weeks[0].problems, [{ difficulty: 'Medium', title: 'Two Sum', slug: 'two-sum', bonus: false }]);
  assert.equal(result.warnings.length, 3);
});

test('slug from title follows LeetCode punctuation rules', () => {
  assert.equal(slugFromTitle('50. Pow(x, n)'), 'powx-n');
  assert.equal(slugFromTitle("118. Pascal's Triangle"), 'pascals-triangle');
  assert.equal(slugFromTitle('167. Two Sum II - Input Array Is Sorted'), 'two-sum-ii-input-array-is-sorted');
});

test('problem before any week heading is a warning', () => {
  const result = parseProblems('- [Easy] Two Sum https://leetcode.com/problems/two-sum/');
  assert.equal(result.weeks.length, 0);
  assert.equal(result.warnings.length, 1);
});
