import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const removals = JSON.parse(readFileSync(new URL('./v1-css-removals.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');

// Used only by verification: permit these exact deletions, preserving every other byte.
export function removeApprovedV1Rules(source) {
  assert.equal(hash(source), removals.baselineSha256, 'Unexpected protected stylesheet baseline');
  let result = source;
  let previousEnd = 0;
  for (const rule of removals.rules) {
    assert(rule.start >= previousEnd && rule.end > rule.start, 'Invalid removal range');
    assert.equal(hash(source.slice(rule.start, rule.end)), rule.sha256, `Changed obsolete rule: ${rule.selector}`);
    previousEnd = rule.end;
  }
  for (const rule of removals.rules.toReversed()) result = result.slice(0, rule.start) + result.slice(rule.end);
  return result;
}
