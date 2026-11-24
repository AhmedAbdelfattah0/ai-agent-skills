// Tests for scripts/cli.mjs: install, update, the validator and the install targets.
// Run with: node --test scripts/cli.test.mjs   (needs Node >= 22. No dependencies.)
//
// ISOLATION (non-negotiable). The CLI writes to the home directory, runs
// `git pull` in its own checkout and can register a scheduled job, so no test may
// run the real script against the real machine. Every test therefore builds its
// own world under a fresh temp root:
//   <root>/lib/scripts/   COPIES of cli.mjs and autoupdate.mjs (the CLI under test)
//   <root>/lib/skills/    a fixture skill library
//   <root>/home           the only home directory the child process can see
// The copy's REPO_ROOT is <root>/lib, which is not a git clone, so `update` never
// pulls. The child env points HOME, USERPROFILE, XDG_*, LOCALAPPDATA and APPDATA
// inside the root, pins GIT_CEILING_DIRECTORIES to it and drops NODE_TEST_CONTEXT
// (otherwise the child would run as a nested test). Inherited variables are removed
// case-insensitively first: Windows names are case-insensitive, so a stray
// `LocalAppData` would otherwise sit beside ours with an unspecified winner. `autoupdate --install` and
// `--remove` are never called. The root is removed after every test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  realpathSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const MANIFEST = '.ai-agent-skills-manifest.json';

// ---- fixture builder ---------------------------------------------------------

const VOCABULARY = [
  'OUTCOME_VOCABULARY',
  'PASS the check held',
  'FAIL the check did not hold',
  'NOT_TRIGGERED the check never fired',
  'NOT_APPLICABLE the check does not apply',
  'DEGRADED the check ran with a stated limit',
];

function skillMd(name, bodyLines = [], { description = `The ${name} fixture.` } = {}) {
  return ['---', `name: ${name}`, `description: ${description}`, '---', '', ...bodyLines, ''].join('\n');
}

function put(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function lineOf(text, needle) {
  return text.split('\n').findIndex((l) => l.includes(needle)) + 1;
}

// A throwaway world. `skills` maps a skill name to its SKILL.md body lines.
function world(t, skills = { alpha: ['Alpha body.'] }) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ais-cli-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // The CLI copies ephemeral sources by default and treats them differently; a
  // temp path must not look like an npm cache or the tests would test another mode.
  assert.doesNotMatch(root.replace(/\\/g, '/'), /\/_npx\/|\/node_modules\/|\/\.npm\//);

  const lib = join(root, 'lib');
  const home = join(root, 'home');
  mkdirSync(join(lib, 'scripts'), { recursive: true });
  mkdirSync(home, { recursive: true });
  for (const f of ['cli.mjs', 'autoupdate.mjs']) cpSync(join(SCRIPTS, f), join(lib, 'scripts', f));
  const w = Object.assign({ root, lib, home, cli: join(lib, 'scripts', 'cli.mjs'), skillsDir: join(lib, 'skills') }, worldMethods);
  for (const [name, body] of Object.entries(skills)) w.writeSkill(name, body);
  return w;
}

// The inherited environment minus NODE_TEST_CONTEXT and every name we override
// (compared case-insensitively), plus the overrides.
function childEnv(overrides) {
  const drop = new Set(['node_test_context', ...Object.keys(overrides).map((k) => k.toLowerCase())]);
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (!drop.has(k.toLowerCase())) env[k] = v;
  return Object.assign(env, overrides);
}

const worldMethods = {
  writeSkill(name, body = [], extra = {}) {
    put(join(this.skillsDir, name, 'SKILL.md'), skillMd(name, body));
    for (const [rel, text] of Object.entries(extra)) put(join(this.skillsDir, name, rel), text);
  },
  file(...parts) { return join(this.skillsDir, ...parts); },
  claudeDir(...parts) { return join(this.home, '.claude', 'skills', ...parts); },
  run(args) {
    const env = childEnv({
      HOME: this.home,
      USERPROFILE: this.home,
      XDG_STATE_HOME: join(this.root, 'state'),
      XDG_CONFIG_HOME: join(this.root, 'config'),
      LOCALAPPDATA: join(this.root, 'localappdata'),
      APPDATA: join(this.root, 'appdata'),
      GIT_CEILING_DIRECTORIES: this.root,
    });
    const r = spawnSync(process.execPath, [this.cli, ...args], { cwd: this.root, env, encoding: 'utf8' });
    return { status: r.status, out: `${r.stdout}${r.stderr}`, stdout: r.stdout, stderr: r.stderr };
  },
  // Every update goes through here so a run that could pull is caught, not trusted.
  update(args = []) {
    const r = this.run(['update', ...args]);
    assert.match(r.out, /is not a git clone/, `update must run against a non-clone library:\n${r.out}`);
    return r;
  },
  validate() { return this.run(['validate']); },
};

// A library the validator accepts: one skill owning the outcome vocabulary.
function validWorld(t, extraSkills = {}) {
  return world(t, { alpha: ['Alpha body.', '', ...VOCABULARY], ...extraSkills });
}

const readManifest = (dir) => JSON.parse(readFileSync(join(dir, MANIFEST), 'utf8'));
const read = (file) => readFileSync(file, 'utf8');

// ---- install -----------------------------------------------------------------

test('link install makes a link that resolves to the source skill', (t) => {
  const w = world(t);
  const r = w.run(['install', '--link', 'alpha']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /linked\s+alpha/);
  assert.ok(lstatSync(w.claudeDir('alpha')).isSymbolicLink(), 'destination is a link (a junction on Windows)');
  assert.equal(realpathSync(w.claudeDir('alpha')), realpathSync(w.file('alpha')));
});

test('copy install writes a real directory and records its hash and mode', (t) => {
  const w = world(t);
  w.writeSkill('alpha', ['Alpha body.'], { 'references/extra.md': 'Extra.\n' });
  const r = w.run(['install', '--copy', 'alpha']);
  assert.equal(r.status, 0, r.out);
  const dest = w.claudeDir('alpha');
  assert.ok(!lstatSync(dest).isSymbolicLink());
  assert.ok(lstatSync(dest).isDirectory());
  assert.equal(read(join(dest, 'SKILL.md')), read(w.file('alpha', 'SKILL.md')));
  assert.equal(read(join(dest, 'references', 'extra.md')), 'Extra.\n');
  const manifest = readManifest(w.claudeDir());
  assert.equal(manifest.skills.alpha.mode, 'copy');
  assert.match(manifest.skills.alpha.hash, /^[0-9a-f]{64}$/);
});

// ---- update ------------------------------------------------------------------

test('update refreshes an unchanged copy without any flag', (t) => {
  const w = world(t);
  w.run(['install', '--copy', 'alpha']);
  const before = readManifest(w.claudeDir()).skills.alpha.hash;
  w.writeSkill('alpha', ['Alpha body, revised.']);
  const r = w.update();
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /alpha {2}updated/);
  assert.match(read(w.claudeDir('alpha', 'SKILL.md')), /Alpha body, revised\./);
  assert.notEqual(readManifest(w.claudeDir()).skills.alpha.hash, before);
});

test('update leaves an edited copy alone and --force overwrites it', (t) => {
  const w = world(t);
  w.run(['install', '--copy', 'alpha']);
  const installed = w.claudeDir('alpha', 'SKILL.md');
  writeFileSync(installed, 'my own edit\n');
  w.writeSkill('alpha', ['Alpha body, revised.']);

  const left = w.update();
  assert.match(left.out, /alpha {2}edited after install — left alone/);
  assert.equal(read(installed), 'my own edit\n');

  const forced = w.update(['--force']);
  assert.match(forced.out, /alpha {2}updated \(over your edits\)/);
  assert.match(read(installed), /Alpha body, revised\./);
});

test('update leaves an unrecorded same-name directory alone and --adopt takes it over', (t) => {
  const w = world(t);
  put(w.claudeDir('alpha', 'SKILL.md'), 'somebody else owns this\n');

  const left = w.update();
  assert.match(left.out, /alpha {2}present but not installed by us — left alone/);
  assert.equal(read(w.claudeDir('alpha', 'SKILL.md')), 'somebody else owns this\n');
  assert.ok(!existsSync(join(w.claudeDir(), MANIFEST)), 'nothing was recorded');

  const adopted = w.update(['--adopt']);
  assert.match(adopted.out, /alpha {2}updated \(adopted\)/);
  assert.equal(read(w.claudeDir('alpha', 'SKILL.md')), read(w.file('alpha', 'SKILL.md')));
  assert.equal(readManifest(w.claudeDir()).skills.alpha.mode, 'copy');
});

test('update does not trust the records of a manifest from another library', (t) => {
  const w = world(t);
  w.run(['install', '--copy', 'alpha']);
  const manifestPath = join(w.claudeDir(), MANIFEST);
  const foreign = { ...readManifest(w.claudeDir()), origin: 'https://example.com/other/library' };
  writeFileSync(manifestPath, JSON.stringify(foreign));
  // The installed copy is untouched, so a trusted record WOULD let this refresh.
  w.writeSkill('alpha', ['Alpha body, revised.']);
  const oldText = read(w.claudeDir('alpha', 'SKILL.md'));

  const r = w.update();
  assert.match(r.out, /installed by a different library \(https:\/\/example\.com\/other\/library\)/);
  assert.match(r.out, /alpha {2}present but not installed by us — left alone/);
  assert.equal(read(w.claudeDir('alpha', 'SKILL.md')), oldText);
  assert.equal(readManifest(w.claudeDir()).origin, 'https://example.com/other/library', 'foreign record not rewritten as ours');

  const forced = w.update(['--force']);
  assert.match(forced.out, /alpha {2}present but not installed by us — left alone/);
  assert.equal(read(w.claudeDir('alpha', 'SKILL.md')), oldText);
});

// ---- install targets ---------------------------------------------------------

for (const [name, spec] of [
  ['install --target antigravity writes to the documented directory only', 'antigravity'],
  ['install --target all never writes to the legacy antigravity directory', 'all'],
]) {
  test(name, (t) => {
    const w = world(t);
    const r = w.run(['install', '--copy', '--target', spec, 'alpha']);
    assert.equal(r.status, 0, r.out);
    assert.ok(existsSync(join(w.home, '.gemini', 'config', 'skills', 'alpha', 'SKILL.md')));
    assert.ok(!existsSync(join(w.home, '.gemini', 'antigravity')), 'the legacy directory was not created');
  });
}

test('the legacy antigravity directory is not an installable target', (t) => {
  const w = world(t);
  for (const key of ['antigravity-legacy', 'antigravity (legacy path)']) {
    const r = w.run(['install', '--copy', '--target', key, 'alpha']);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /unknown target\(s\)/);
  }
  assert.ok(!existsSync(join(w.home, '.gemini', 'antigravity')));
});

test('a plain update still refreshes a copy installed in the legacy antigravity directory', (t) => {
  const w = world(t);
  const legacy = join(w.home, '.gemini', 'antigravity', 'skills');
  const installed = w.run(['install', '--copy', '--dest', legacy, 'alpha']);
  assert.equal(installed.status, 0, installed.out);
  w.writeSkill('alpha', ['Alpha body, revised.']);

  const r = w.update();
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /\[antigravity \(legacy path\)\]/);
  assert.match(r.out, /alpha {2}updated/);
  assert.match(read(join(legacy, 'alpha', 'SKILL.md')), /Alpha body, revised\./);
  assert.ok(!existsSync(join(w.home, '.gemini', 'config')), 'the new directory was not created by update');
});

// ---- update inside the legacy antigravity directory ----------------------------

const legacyDir = (w) => join(w.home, '.gemini', 'antigravity', 'skills');

test('update leaves an unrecorded directory in the legacy directory alone and --adopt takes it over', (t) => {
  const w = world(t);
  put(join(legacyDir(w), 'alpha', 'SKILL.md'), 'somebody else owns this\n');

  const left = w.update();
  assert.match(left.out, /\[antigravity \(legacy path\)\]/);
  assert.match(left.out, /alpha {2}present but not installed by us — left alone/);
  assert.equal(read(join(legacyDir(w), 'alpha', 'SKILL.md')), 'somebody else owns this\n');

  const adopted = w.update(['--adopt']);
  assert.match(adopted.out, /alpha {2}updated \(adopted\)/);
  assert.equal(read(join(legacyDir(w), 'alpha', 'SKILL.md')), read(w.file('alpha', 'SKILL.md')));
});

test('update does not trust a manifest in the legacy directory that names another library', (t) => {
  const w = world(t);
  w.run(['install', '--copy', '--dest', legacyDir(w), 'alpha']);
  const manifestPath = join(legacyDir(w), MANIFEST);
  writeFileSync(manifestPath, JSON.stringify({ ...readManifest(legacyDir(w)), origin: 'https://example.com/other/library' }));
  w.writeSkill('alpha', ['Alpha body, revised.']);
  const oldText = read(join(legacyDir(w), 'alpha', 'SKILL.md'));

  const r = w.update();
  assert.match(r.out, /installed by a different library/);
  assert.equal(read(join(legacyDir(w), 'alpha', 'SKILL.md')), oldText);
});

test('update --prune in the legacy directory removes only what the manifest recorded', (t) => {
  const w = world(t, { alpha: ['Alpha body.'], beta: ['Beta body.'] });
  w.run(['install', '--copy', '--dest', legacyDir(w), 'alpha', 'beta']);
  put(join(legacyDir(w), 'gamma', 'SKILL.md'), 'not ours, not in the library\n');
  rmSync(w.file('beta'), { recursive: true, force: true });

  const r = w.update(['--prune']);
  assert.match(r.out, /beta {2}\(removed upstream — removed\)/);
  assert.ok(!existsSync(join(legacyDir(w), 'beta')), 'the recorded, removed skill is gone');
  assert.ok(existsSync(join(legacyDir(w), 'alpha', 'SKILL.md')));
  assert.equal(read(join(legacyDir(w), 'gamma', 'SKILL.md')), 'not ours, not in the library\n');
});

for (const [name, pick] of [
  ['--target', () => ['--target', 'claude']],
  ['--dest', (w) => ['--dest', join(w.home, 'elsewhere')]],
]) {
  test(`update ${name} does not touch the legacy directory`, (t) => {
    const w = world(t);
    w.run(['install', '--copy', 'alpha']);
    w.run(['install', '--copy', '--dest', join(w.home, 'elsewhere'), 'alpha']);
    w.run(['install', '--copy', '--dest', legacyDir(w), 'alpha']);
    const legacyBefore = read(join(legacyDir(w), 'alpha', 'SKILL.md'));
    w.writeSkill('alpha', ['Alpha body, revised.']);

    const r = w.update(pick(w));
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /alpha {2}updated/);
    assert.doesNotMatch(r.out, /legacy/);
    assert.equal(read(join(legacyDir(w), 'alpha', 'SKILL.md')), legacyBefore);
  });
}

// ---- validator: baseline and planted violations -------------------------------

test('validate accepts a valid library', (t) => {
  const w = validWorld(t);
  const r = w.validate();
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /✅ alpha/);
  assert.match(r.out, /✅ all skills valid/);
});

test('validate rejects a folder name that differs from the frontmatter name', (t) => {
  const w = validWorld(t);
  put(w.file('beta', 'SKILL.md'), skillMd('gamma'));
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ beta: folder name != frontmatter name \('gamma'\)/);
});

for (const [name, text, message] of [
  ['validate rejects a SKILL.md with no frontmatter', '# Beta\n\nNo frontmatter here.\n', /❌ beta: missing or empty frontmatter/],
  ['validate rejects frontmatter with no name', '---\ndescription: A skill.\n---\n\nBody.\n', /❌ beta: frontmatter has no 'name:'/],
  ['validate rejects frontmatter with no description', '---\nname: beta\n---\n\nBody.\n', /❌ beta: frontmatter has no 'description:'/],
]) {
  test(name, (t) => {
    const w = validWorld(t);
    put(w.file('beta', 'SKILL.md'), text);
    const r = w.validate();
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, message);
  });
}

test('validate rejects a skill directory with no SKILL.md', (t) => {
  const w = validWorld(t);
  put(w.file('beta', 'notes.txt'), 'no skill file here\n');
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ beta: no SKILL\.md/);
});

test('validate rejects a call to a shell script that is neither bundled nor generated', (t) => {
  const w = validWorld(t);
  w.writeSkill('beta', ['Run: bash missing-tool.sh first.']);
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ beta: calls 'missing-tool\.sh' but it is neither bundled nor created by the skill/);
});

test('validate rejects a dangling relative Markdown link', (t) => {
  const w = validWorld(t);
  w.writeSkill('beta', ['See [the guide](references/nope.md).']);
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ beta: .*SKILL\.md links to 'references\/nope\.md', which does not exist\./);
});

test('validate rejects a reference file that no link reaches', (t) => {
  const w = validWorld(t);
  w.writeSkill('beta', ['Body.'], { 'references/lonely.md': 'Nobody points here.\n' });
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ beta: references\/lonely\.md is not reachable by any link from SKILL\.md — orphaned\./);
});

test('validate rejects retired vocabulary in a skill', (t) => {
  const w = validWorld(t);
  w.writeSkill('beta', ["Run Claude Code's built-in review first."]);
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ beta: .*SKILL\.md:\d+ uses retired 'Claude Code's built-in review' — \/code-review belongs to the CodeRabbit plugin/);
});

test('validate rejects retired vocabulary in a repo guidance file', (t) => {
  const w = validWorld(t);
  put(join(w.lib, 'AGENTS.md'), "Run Claude Code's built-in review first.\n");
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ AGENTS\.md:1 uses retired 'Claude Code's built-in review'/);
});

test('a guidance line that says the term is retired is not flagged, the same term elsewhere is', (t) => {
  const w = validWorld(t);
  put(join(w.lib, 'AGENTS.md'), "Claude Code's built-in review was removed long ago.\nRun Claude Code's built-in review first.\n");
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ AGENTS\.md:2 uses retired 'Claude Code's built-in review'/);
  assert.doesNotMatch(r.out, /AGENTS\.md:1 /);
});

test('validate rejects an outcome vocabulary with two owners', (t) => {
  const w = validWorld(t);
  w.writeSkill('alpha', ['See [more](references/second.md).', '', ...VOCABULARY],
    { 'references/second.md': `${VOCABULARY.join('\n')}\n` });
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ alpha: the outcome vocabulary is defined in 2 files — it must have exactly one owner\./);
  assert.match(r.out, /❌ canonical outcome vocabulary has 2 owners — expected at most one\./);
});

// No skill in this library owns an outcome vocabulary, so zero owners is valid here.
test('validate accepts a library where no file defines the outcome vocabulary', (t) => {
  const w = world(t);
  const r = w.validate();
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /canonical outcome vocabulary/);
  assert.match(r.out, /✅ all skills valid/);
});

test('validate rejects an outcome vocabulary that omits a token', (t) => {
  const w = world(t, { alpha: VOCABULARY.filter((l) => !l.startsWith('DEGRADED')) });
  const r = w.validate();
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /❌ alpha: the outcome vocabulary omits DEGRADED\./);
});

// ---- supported-runtime contract (OD-Q5: minimum Node.js is 22) -----------------
// package.json engines, the install.sh guard and the README must state one floor.

const REPO = join(SCRIPTS, '..');
const NODE_FLOOR = 22;

test('the supported Node floor is the same in package.json, install.sh and README', () => {
  const engines = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).engines.node;
  assert.equal(engines, `>=${NODE_FLOOR}`);

  const sh = readFileSync(join(REPO, 'install.sh'), 'utf8');
  const guard = sh.match(/"\$NODE_MAJOR" -lt (\d+)/);
  assert.ok(guard, 'install.sh has a NODE_MAJOR guard');
  assert.equal(Number(guard[1]), NODE_FLOOR);
  assert.match(sh, new RegExp(`Install Node\\.js ${NODE_FLOOR} or newer`));
  assert.match(sh, new RegExp(`this needs ${NODE_FLOOR} or newer`));

  const readme = readFileSync(join(REPO, 'README.md'), 'utf8');
  assert.match(readme, new RegExp(`Needs \`git\` and Node ${NODE_FLOOR}\\+`));
});

test('no support claim in README, AGENTS.md, install.sh or package.json names a Node below the floor', () => {
  // "Node 18", "Node.js](url) >= 18", "Node >= 18", "≥ 18": every number after such a lead must be the floor or more.
  const claim = /node(?:\.js)?(?:\]\([^)]*\))?["':\s]*(?:≥|>=)?\s*"?(\d{1,2})(?!\d)/gi;
  let seen = 0;
  for (const f of ['README.md', 'AGENTS.md', 'install.sh', 'package.json']) {
    const text = readFileSync(join(REPO, f), 'utf8');
    for (const m of text.matchAll(claim)) {
      seen += 1;
      assert.ok(Number(m[1]) >= NODE_FLOOR, `${f} claims Node ${m[1]}: ${JSON.stringify(m[0])}`);
    }
  }
  assert.ok(seen >= 4, `the scan found the claims it is meant to police (${seen})`);
});

test('CI runs Node 22 only and every job in validate.yml and sync-external.yml has timeout-minutes', () => {
  for (const f of ['validate.yml', 'sync-external.yml']) {
    const yml = readFileSync(join(REPO, '.github', 'workflows', f), 'utf8');
    // Every node-version is the floor or a matrix reference; every matrix node list is the floor alone.
    const versions = [...yml.matchAll(/node-version:[ \t]*'?([^'\n]*?)'?[ \t]*$/gm)].map((m) => m[1]);
    assert.ok(versions.length >= 1, `${f} sets a node-version`);
    for (const v of versions) {
      assert.ok(v === '${{ matrix.node }}' || v === String(NODE_FLOOR), `${f} node-version ${v}`);
    }
    const lists = [...yml.matchAll(/^\s+node:\s*\[([^\]]*)\]/gm)].map((m) => m[1].replace(/['\s]/g, ''));
    for (const l of lists) assert.equal(l, String(NODE_FLOOR), `${f} matrix node list`);
    if (f === 'validate.yml') assert.equal(lists.length, 1, 'the cli matrix was found');
    // Every top-level job (two-space indent under jobs:) declares a timeout.
    const jobsText = yml.slice(yml.indexOf('\njobs:'));
    const blocks = jobsText.split(/^  (?=[A-Za-z][\w-]*:\s*$)/m).slice(1);
    assert.ok(blocks.length >= 1, `${f} has jobs`);
    for (const b of blocks) {
      const name = b.split(':')[0];
      assert.match(b, /^    timeout-minutes:\s*\d+\s*$/m, `${f} job ${name} has timeout-minutes`);
    }
    if (f === 'validate.yml') assert.equal(blocks.length, 2, 'validate, cli');
  }
});

// Runs the real install.sh with a stand-in `node` and a `git` that records any call and fails. The
// clone target is an existing non-git directory, so a regressed guard is refused by install.sh itself.
function installWith(t, nodeMajorOutput) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ais-nodefloor-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, 'bin');
  const gitLog = join(root, 'git-called');
  put(join(bin, 'node'), `#!/bin/sh\ncase "$1" in -v) echo v0.0.0;; *) echo '${nodeMajorOutput}';; esac\n`);
  put(join(bin, 'git'), `#!/bin/sh\necho "$@" >> '${gitLog}'\nexit 1\n`);
  for (const b of ['node', 'git']) spawnSync('chmod', ['755', join(bin, b)]);
  const target = join(root, 'target');
  mkdirSync(target);
  const home = join(root, 'home');
  mkdirSync(home);
  const r = spawnSync('bash', [join(REPO, 'install.sh')], {
    encoding: 'utf8',
    timeout: 20000,
    env: childEnv({
      PATH: `${bin}:${process.env.PATH}`, HOME: home, USERPROFILE: home,
      AI_AGENT_SKILLS_HOME: target, AI_AGENT_SKILLS_NO_AUTOUPDATE: '1',
    }),
  });
  return { r, gitCalled: existsSync(gitLog) };
}

test('install.sh refuses a Node below the floor and names the floor', (t) => {
  const { r, gitCalled } = installWith(t, String(NODE_FLOOR - 1));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, new RegExp(`too old; this needs ${NODE_FLOOR} or newer`));
  assert.equal(gitCalled, false, 'the guard fires before any git call');
});

for (const [label, out] of [['empty', ''], ['non-numeric', 'abc'], ['partly numeric', '22x']]) {
  test(`install.sh refuses (fails closed) when the Node major is ${label}`, (t) => {
    const { r, gitCalled } = installWith(t, out);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /could not read the Node major version/);
    assert.equal(gitCalled, false, 'the guard fires before any git call');
  });
}
