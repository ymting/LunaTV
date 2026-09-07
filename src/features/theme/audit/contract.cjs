// 所有未知接缝与未分类颜色默认失败；不能用文件级通配符绕过逐条登记。
const GREEN =
  /(?:green|emerald)-(?:50|[1-9]00|950)\b|#(?:22c55e|16a34a|10b981)\b/i;
const CHINESE = /[\u4e00-\u9fff]/;
const PROTECTED = [
  'src/app/admin/page.tsx',
  'src/components/UserMenu.tsx',
  'src/components/VideoCard.tsx',
];
const HOT = [
  ...PROTECTED,
  'src/app/live/page.tsx',
  'src/app/layout.tsx',
  'src/app/search/page.tsx',
];
const BRIDGES = [
  'src/app/layout.tsx',
  'src/app/globals.css',
  'src/components/PageLayout.tsx',
  'src/app/play/page.tsx',
  'src/app/live/page.tsx',
  'src/app/login/page.tsx',
  'src/app/page.tsx',
  'src/app/search/page.tsx',
  'src/app/douban/page.tsx',
];

function greenReferences(sources) {
  return Object.entries(sources).flatMap(([file, source]) =>
    source
      .split(/\r?\n/)
      .flatMap((line, index) =>
        GREEN.test(line) ? [{ file, line: index + 1, source: line.trim() }] : []
      )
  );
}

function auditGreen(sources, entries) {
  const errors = [];
  const allowances = new Map();
  for (const entry of entries) {
    if (
      !['brand', 'status'].includes(entry.category) ||
      !CHINESE.test(entry.reason || '')
    ) {
      errors.push(
        `颜色登记缺少品牌/状态分类或中文理由：${entry.file}:${entry.line}`
      );
      continue;
    }
    const key = `${entry.file}\n${entry.source}`;
    allowances.set(key, (allowances.get(key) || 0) + 1);
  }
  const references = greenReferences(sources);
  for (const entry of references) {
    const key = `${entry.file}\n${entry.source}`;
    const remaining = allowances.get(key) || 0;
    if (remaining === 0) {
      errors.push(`未分类绿色：${entry.file}:${entry.line} ${entry.source}`);
    } else {
      allowances.set(key, remaining - 1);
    }
  }
  for (const entry of entries) {
    const key = `${entry.file}\n${entry.source}`;
    if (
      entry.category === 'status' &&
      sources[entry.file] &&
      (allowances.get(key) || 0) > 0
    ) {
      errors.push(`语义状态绿色被移除或改写：${entry.file}:${entry.line}`);
      allowances.set(key, 0);
    }
  }
  return { errors, references: references.length };
}

function auditCompatibility(css, sources, contracts) {
  const errors = [];
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [...body.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((match) =>
    match[1].trim().split(/,\s*(?![^()]*\))/)
  );
  for (const selector of selectors) {
    if (
      !selector.includes("[data-theme='netflix']") ||
      !selector.includes("[data-theme-scope='consumer']")
    ) {
      errors.push(`兼容选择器缺少 Netflix + consumer 边界：${selector}`);
    }
    // 旧绿色类不能成为选择器，避免成功、低延迟、在线状态被品牌红污染。
    if (/(?:green|emerald)-|\[class[*^$~|]?=/.test(selector)) {
      errors.push(`兼容层禁止旧绿色类或 class 模糊映射：${selector}`);
    }
    for (const match of selector.matchAll(
      /\[(data-[\w-]+|aria-label)(?:=['"]([^'"]+)['"])?\]/g
    )) {
      if (match[1] === 'data-theme') continue;
      const hook = `${match[1]}=${match[2] || '*'}`;
      const contract = contracts.find((entry) => entry.hook === hook);
      if (!contract || !CHINESE.test(contract.reason || '')) {
        errors.push(`未登记兼容 hook：${hook}`);
        continue;
      }
      // hook 必须在声明的组件源码中真实出现，注释不能满足契约。
      const source = (sources[contract.file] || '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      const name = match[1];
      const value = match[2];
      const literal = value
        ? new RegExp(`${name}\\s*=\\s*['"]${value}['"]`)
        : new RegExp(`${name}(?:\\s|=|>|/)`);
      const dynamic =
        value &&
        new RegExp(`${name}\\s*=\\s*\\{[^}]*['"]${value}['"][^}]*\\}`).test(
          source
        );
      const binding =
        contract.binding &&
        source.includes(`${name}={${contract.binding}}`) &&
        source.includes(contract.declaration);
      if (!literal.test(source) && !dynamic && !binding) {
        errors.push(`兼容 hook 已漂移或缺失：${hook} @ ${contract.file}`);
      }
    }
  }
  return errors;
}

function auditBridges(rows) {
  const errors = [];
  const warnings = [];
  const existing = rows.filter(
    (row) =>
      row.existing &&
      row.file.startsWith('src/') &&
      !row.file.startsWith('src/features/theme/')
  );
  const totalLines = existing.reduce(
    (sum, row) => sum + row.added + row.deleted,
    0
  );
  const hotFiles = existing.filter((row) => HOT.includes(row.file));
  if (existing.length > 10)
    errors.push(`既有接入文件超限：${existing.length}/10`);
  if (totalLines > 150) errors.push(`既有接入改动超限：${totalLines}/150 行`);
  if (hotFiles.length > 4) errors.push(`高热文件超限：${hotFiles.length}/4`);
  for (const row of rows) {
    if (
      !row.file.startsWith('src/') ||
      row.file.startsWith('src/features/theme/')
    )
      continue;
    if (PROTECTED.includes(row.file))
      errors.push(`受保护文件禁止主题改动：${row.file}`);
    if (row.existing && !BRIDGES.includes(row.file))
      errors.push(`未授权既有接入点：${row.file}`);
    if (!row.existing)
      errors.push(`新增主题源码必须放入 src/features/theme/：${row.file}`);
    const size = row.added + row.deleted;
    if (size > 20 && /src\/app\/(play|live)\/page\.tsx$/.test(row.file)) {
      errors.push(`播放器接入超过硬上限：${row.file} ${size}/20 行`);
    } else if (size > 20)
      warnings.push(`单文件超过接入目标：${row.file} ${size}/20 行`);
    // 挂载组件、传参、播放器 hook 订阅可以接入，状态与存储只能由主题内核维护。
    const added = (row.patch || '')
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
      .map((line) => line.slice(1))
      .join('\n');
    if (
      /\b(?:localStorage|sessionStorage|setPreset|setTheme|useState|useReducer)\b|lunatv:theme|dataset\.theme|(?:addEventListener|removeEventListener)\s*\(\s*['"]storage['"]|(?:preset|isNetflix)\s*(?:===|!==|\?)/.test(
        added
      )
    ) {
      errors.push(`主题状态逻辑泄漏到既有文件：${row.file}`);
    }
  }
  return {
    errors,
    warnings,
    files: existing.length,
    totalLines,
    hotFiles: hotFiles.map((row) => row.file),
  };
}

function auditPresentation(css, sources, contracts) {
  const errors = [];
  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of body.matchAll(
    /\[(data-[\w-]+)(?:=['"]([^'"]+)['"])?\]/g
  )) {
    if (match[1] === 'data-theme') continue;
    const hook = match[1] + (match[2] ? `=${match[2]}` : '');
    if (!contracts.some((entry) => entry.hook === hook))
      errors.push(`展示层未登记 hook：${hook}`);
  }
  // 原始结构接缝也要审计，不能把脆弱选择器藏在独立展示样式中绕过检查。
  for (const entry of contracts) {
    const source = normalize(
      (sources[entry.file] || '').replace(/\/\*[\s\S]*?\*\//g, '')
    );
    if (!CHINESE.test(entry.reason || '') || !entry.fragments?.length)
      errors.push(`展示契约缺少中文理由或源码片段：${entry.file}`);
    for (const fragment of entry.fragments || []) {
      if (!source.includes(normalize(fragment)))
        errors.push(`展示结构契约漂移：${entry.file} ${fragment}`);
    }
  }
  return errors;
}

module.exports = {
  auditPresentation,
  greenReferences,
  auditGreen,
  auditCompatibility,
  auditBridges,
};
