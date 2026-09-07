import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import contract from '../src/features/theme/audit/contract.cjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const baseline = 'c68f75a';
const inventory = JSON.parse(
  read('src/features/theme/audit/green-references.json')
);
const hooks = JSON.parse(
  read('src/features/theme/audit/compatibility-hooks.json')
);
const sources = {};

function walk(directory) {
  for (const entry of readdirSync(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!['tests', '__tests__', 'audit'].includes(entry.name)) walk(file);
    } else if (/\.(?:tsx?|jsx?|css)$/.test(file)) sources[file] = read(file);
  }
}

try {
  walk('src');
  const baseSha = git('rev-parse', baseline);
  const upstreamMergeBase = git('merge-base', baseline, 'upstream/main');
  const existing = new Set(
    git('ls-tree', '-r', '--name-only', baseline).split('\n')
  );
  const rows = git('diff', '--numstat', baseline, '--', 'src')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [added, deleted, file] = line.split('\t');
      return {
        file,
        added: Number(added),
        deleted: Number(deleted),
        existing: existing.has(file),
        patch: git('diff', '--unified=0', baseline, '--', file),
      };
    });
  // git diff 不包含未跟踪文件，必须显式纳入，防止目录外新增状态代码绕过审计。
  const untracked = git(
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    'src'
  )
    .split('\n')
    .filter(Boolean);
  for (const file of untracked) {
    if (
      file.startsWith('src/features/theme/') ||
      !existsSync(path.join(root, file))
    )
      continue;
    const lines = read(file).split('\n');
    rows.push({
      file,
      added: lines.length,
      deleted: 0,
      existing: false,
      patch: lines.map((line) => `+${line}`).join('\n'),
    });
  }
  const colors = contract.auditGreen(sources, inventory.entries);
  const bridges = contract.auditBridges(rows);
  const compatibility = contract.auditCompatibility(
    read('src/features/theme/styles/compatibility.css'),
    sources,
    hooks
  );
  const presentation = contract.auditPresentation(
    read('src/features/theme/styles/netflix.css'),
    sources,
    JSON.parse(read('src/features/theme/audit/presentation-hooks.json'))
  );
  const errors = [
    ...colors.errors,
    ...bridges.errors,
    ...compatibility,
    ...presentation,
  ];
  const report = {
    baseline: baseSha,
    upstreamMergeBase,
    greenReferences: colors.references,
    bridgeFiles: bridges.files,
    bridgeLines: bridges.totalLines,
    hotFiles: bridges.hotFiles,
    warnings: bridges.warnings,
    errors,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`主题契约审计无法完成（默认失败）：${error.message}\n`);
  process.exitCode = 1;
}
