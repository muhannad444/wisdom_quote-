// Data-integrity checks. Run with:  node validate.js
// Note: this checks structure and content fingerprints; it cannot prove the
// text matches a document it has never seen, so also review quotes.js by eye.
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

const sandbox = {};
sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(__dirname + '/quotes.js', 'utf8'), sandbox);
const { QUOTES, CATEGORIES } = sandbox;

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.error('FAIL:', msg); } };

check(QUOTES.length === 55, `expected 55 quotes, got ${QUOTES.length}`);
check(new Set(QUOTES.map(q => q.id)).size === QUOTES.length, 'IDs are not unique');
QUOTES.forEach((q, i) => {
  check(q.number === i + 1, `order/number mismatch at index ${i}`);
  check(typeof q.title === 'string' && q.title.trim() === q.title && q.title.length > 0, `bad title ${q.id}`);
  check(typeof q.text === 'string' && q.text.trim() === q.text && q.text.length > 0, `bad text ${q.id}`);
  check(q.categories.length > 0 && q.categories.every(c => CATEGORIES.some(k => k.id === c)), `bad categories ${q.id}`);
  check(q.tags.length > 0, `no tags ${q.id}`);
  check(q.published === true, `unpublished ${q.id}`);
});
const dup = QUOTES.filter(q => q.title === 'Build Your Own Dream');
check(dup.length === 2 && dup[0].text !== dup[1].text, 'quotes 43 and 51 should both exist with different text');
check(QUOTES[11].text.split('\n').length === 3, 'quote 12 must keep its three numbered lines');
check(QUOTES.every(q => q.author === '' && q.sourceUrl === ''), 'no author/source should be invented');

const fp = crypto.createHash('sha256').update(JSON.stringify(QUOTES.map(q => [q.number, q.title, q.text]))).digest('hex');
console.log('content fingerprint:', fp.slice(0, 16));
console.log(failures ? `${failures} check(s) failed` : `OK — ${QUOTES.length} quotes validated`);
process.exit(failures ? 1 : 0);
