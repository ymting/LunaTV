/* eslint-disable @typescript-eslint/no-var-requires */
const {
  auditGreen,
  auditCompatibility,
  auditBridges,
  auditPresentation,
} = require('../audit/contract.cjs');

describe('展示层结构契约', () => {
  const file = 'src/components/Layout.tsx';
  const contracts = [
    {
      hook: 'data-theme-home',
      file,
      fragments: ['data-theme-home'],
      reason: '首页容器接缝',
    },
  ];
  it('允许已登记真实 hook', () => {
    expect(
      auditPresentation(
        '[data-theme-home] {}',
        { [file]: '<div data-theme-home />' },
        contracts
      )
    ).toEqual([]);
  });
  it('新 hook、原组件结构改变及仅有注释都会失败', () => {
    expect(
      auditPresentation(
        '[data-theme-other] {}',
        { [file]: '<div data-theme-home />' },
        contracts
      ).length
    ).toBeGreaterThan(0);
    expect(
      auditPresentation(
        '[data-theme-home] {}',
        { [file]: '/* data-theme-home */ <div />' },
        contracts
      ).length
    ).toBeGreaterThan(0);
  });
});

const greenEntry = {
  file: 'src/components/Health.tsx',
  line: 1,
  source: "<span className='text-green-500'>正常</span>",
  category: 'status',
  reason: '健康状态必须保留绿色',
};
const safeCss =
  "[data-theme='netflix'] [data-theme-scope='consumer'][data-theme-surface='page'] { color: white; }";
const shellFile = 'src/features/theme/components/ThemeShell.tsx';
const shellSource =
  "<section data-theme-scope='consumer' data-theme-surface='page' />";
const hooks = [
  {
    hook: 'data-theme-scope=consumer',
    file: shellFile,
    reason: '消费界面边界',
  },
  { hook: 'data-theme-surface=page', file: shellFile, reason: '页面外层表面' },
];
const bridge = (
  file: string,
  added = 3,
  deleted = 0,
  patch = '+<ThemeShell />'
) => ({
  file,
  added,
  deleted,
  patch,
  existing: true,
});

describe('绿色语义清单默认失败', () => {
  it('接受精确登记并带中文理由的状态色', () => {
    expect(
      auditGreen({ [greenEntry.file]: greenEntry.source }, [greenEntry]).errors
    ).toEqual([]);
  });

  it('拒绝新颜色和复制已有绿色引用，不能依靠文件级放行', () => {
    const duplicate = `${greenEntry.source}\n${greenEntry.source}`;
    expect(
      auditGreen({ [greenEntry.file]: duplicate }, [greenEntry]).errors
    ).toHaveLength(1);
    expect(
      auditGreen(
        { [greenEntry.file]: "<span className='text-emerald-400' />" },
        [greenEntry]
      ).errors
    ).toHaveLength(2);
  });

  it('把正常状态改成红色会失败', () => {
    expect(
      auditGreen(
        { [greenEntry.file]: greenEntry.source.replace('green', 'red') },
        [greenEntry]
      ).errors
    ).toEqual(
      expect.arrayContaining([expect.stringContaining('语义状态绿色被移除')])
    );
  });

  it('拒绝没有中文语义理由的登记', () => {
    expect(
      auditGreen({ [greenEntry.file]: greenEntry.source }, [
        { ...greenEntry, reason: 'allow' },
      ]).errors.length
    ).toBeGreaterThan(0);
  });
});

describe('兼容 CSS 契约', () => {
  it('接受真实存在且有明确消费范围的 hook', () => {
    expect(
      auditCompatibility(safeCss, { [shellFile]: shellSource }, hooks)
    ).toEqual([]);
  });

  it('hook 移除或只有注释时失败', () => {
    expect(
      auditCompatibility(safeCss, { [shellFile]: '<section />' }, hooks).length
    ).toBeGreaterThan(0);
    expect(
      auditCompatibility(
        safeCss,
        { [shellFile]: `/* ${shellSource} */` },
        hooks
      ).length
    ).toBeGreaterThan(0);
  });

  it('禁止无 scope 的全局颜色替换和带 scope 的绿色映射', () => {
    expect(
      auditCompatibility(
        "[data-theme='netflix'] .bg-green-500 { background: red; }",
        {},
        []
      ).length
    ).toBeGreaterThan(0);
    expect(
      auditCompatibility(
        "[data-theme='netflix'] [data-theme-scope='consumer'] .bg-green-500 { background: red; }",
        { [shellFile]: shellSource },
        hooks
      ).length
    ).toBeGreaterThan(0);
  });

  it('未登记 hook 默认失败', () => {
    expect(
      auditCompatibility(safeCss, { [shellFile]: shellSource }, []).length
    ).toBeGreaterThan(0);
  });

  it('动态 scope 的声明发生漂移会失败', () => {
    const declaration =
      "const scope = route === 'player' ? 'consumer' : route;";
    const dynamicHooks = [
      { ...hooks[0], binding: 'scope', declaration },
      hooks[1],
    ];
    const source = `${declaration}\n<section data-theme-scope={scope} data-theme-surface='page' />`;
    expect(
      auditCompatibility(safeCss, { [shellFile]: source }, dynamicHooks)
    ).toEqual([]);
    expect(
      auditCompatibility(
        safeCss,
        { [shellFile]: source.replace("'consumer'", "'admin'") },
        dynamicHooks
      ).length
    ).toBeGreaterThan(0);
  });
});

describe('上游接入预算', () => {
  it('允许小型挂载和播放器订阅桥', () => {
    expect(
      auditBridges([
        bridge('src/app/layout.tsx'),
        bridge('src/app/play/page.tsx', 8, 1, '+useArtPlayerTheme(artRef);'),
      ]).errors
    ).toEqual([]);
  });

  it.each([
    'src/app/admin/page.tsx',
    'src/components/UserMenu.tsx',
    'src/components/VideoCard.tsx',
  ])('保护 %s', (file) => {
    expect(auditBridges([bridge(file)]).errors.length).toBeGreaterThan(0);
  });

  it('播放器行数超过 20 即失败，普通接入超过目标有警告', () => {
    expect(
      auditBridges([bridge('src/app/play/page.tsx', 20, 1)]).errors.length
    ).toBeGreaterThan(0);
    expect(
      auditBridges([bridge('src/app/layout.tsx', 20, 1)]).warnings
    ).toHaveLength(1);
  });

  it('检测总行数、文件数量和热点数量超限', () => {
    const rows = [
      'src/app/admin/page.tsx',
      'src/app/live/page.tsx',
      'src/app/layout.tsx',
      'src/app/search/page.tsx',
      'src/components/UserMenu.tsx',
      'src/components/VideoCard.tsx',
      ...Array.from(
        { length: 5 },
        (_, index) => `src/app/extra-${index}/page.tsx`
      ),
    ].map((file) => bridge(file, 15));
    const result = auditBridges(rows);
    expect(result.files).toBe(11);
    expect(result.totalLines).toBe(165);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('既有接入文件超限'),
        expect.stringContaining('既有接入改动超限'),
        expect.stringContaining('高热文件超限'),
      ])
    );
  });

  it('拒绝在既有接入点读写主题状态', () => {
    expect(
      auditBridges([
        bridge(
          'src/app/layout.tsx',
          1,
          0,
          "+localStorage.setItem('lunatv:theme-preset', 'netflix');"
        ),
      ]).errors
    ).toEqual(
      expect.arrayContaining([expect.stringContaining('主题状态逻辑泄漏')])
    );
  });

  it('拒绝在主题目录之外新增功能文件', () => {
    expect(
      auditBridges([
        { ...bridge('src/components/NetflixState.tsx'), existing: false },
      ]).errors.length
    ).toBeGreaterThan(0);
  });
});
