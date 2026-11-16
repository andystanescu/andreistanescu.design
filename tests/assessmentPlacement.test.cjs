const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(source, dependencies = {}) {
  const js = ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)((name) => dependencies[name] ?? require(name), module, module.exports);
  return module.exports;
}
const toc = load('src/lib/tableOfContents.ts');
const { ASSESSMENT_BLOCK, assessmentEditorBody, splitAssessmentBlock, markEditorAssessmentPlacement, hasEditorAssessmentPlacement } = load('src/lib/assessmentPlacement.ts', { '@/lib/tableOfContents': toc });

test('legacy assessments remain after their selected heading', () => {
  const body = '<h2>First chapter</h2><p>One</p><h2>Second chapter</h2><p>Two</p>';
  const prepared = assessmentEditorBody(body, 'second-chapter', true);
  const split = splitAssessmentBlock(prepared);
  assert.match(split.before, /Second chapter<\/h2>$/);
  assert.equal(split.after, '<p>Two</p>');
});

test('manual removal remains removed and new assessments start without a block', () => {
  const body = markEditorAssessmentPlacement('<p>Story</p>');
  assert.equal(hasEditorAssessmentPlacement(body), true);
  assert.equal(assessmentEditorBody(body, 'start', true), '<p>Story</p>');
  assert.equal(assessmentEditorBody('<p>Story</p>', 'start', false), '<p>Story</p>');
});

test('an explicit block keeps its position and is not duplicated', () => {
  const body = `<p>Before</p>${ASSESSMENT_BLOCK}<p>After</p>`;
  const split = splitAssessmentBlock(assessmentEditorBody(body, 'start', true));
  assert.equal(split.before, '<p>Before</p>');
  assert.equal(split.after, '<p>After</p>');
});
