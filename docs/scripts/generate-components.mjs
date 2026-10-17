/**
 * 组件文档生成脚本
 *
 * 1. 解析 docs/guide.md：按 `## 分类` / `### 组件` 拆分出每个组件的说明正文；
 * 2. 解析 apps/playground/src/demos/*.vue：提取 code 常量与其引用的状态声明；
 * 3. 生成 docs/components/<kebab>.md —— guide 正文 + 交互演示（CodeCard + LiveDemo）；
 * 4. 生成 docs/fetch.md —— guide 中「远程数据」章节。
 *
 * 用法：node docs/scripts/generate-components.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const docsDir = join(root, 'docs');
const demosDir = join(root, 'apps', 'playground', 'src', 'demos');

/* ------------------------------ 组件注册表 ------------------------------ */

/** @type {Array<{name:string,zh:string,kebab:string,category:string,demos:Array<{file:string,constName:string,title:string}>}>} */
const COMPONENTS = [
  { name: 'Button', zh: '按钮', kebab: 'button', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'buttonTypeCode', title: '按钮类型' },
    { file: 'basic.vue', constName: 'buttonSizeCode', title: '按钮尺寸' },
    { file: 'basic.vue', constName: 'buttonStateCode', title: '禁用与加载' },
  ] },
  { name: 'Icon', zh: '图标', kebab: 'icon', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'iconCode', title: '内置路径与语义色' },
  ] },
  { name: 'Input', zh: '输入框', kebab: 'input', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'inputCode', title: '基础、禁用与校验态' },
  ] },
  { name: 'Card', zh: '卡片', kebab: 'card', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'cardCode', title: '悬浮与无边框' },
  ] },
  { name: 'Divider', zh: '分割线', kebab: 'divider', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'dividerCode', title: '水平、虚线与垂直' },
  ] },
  { name: 'Avatar', zh: '头像', kebab: 'avatar', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'avatarCode', title: '尺寸与形状' },
  ] },
  { name: 'Badge', zh: '徽标', kebab: 'badge', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'badgeCode', title: '计数、溢出与红点' },
  ] },
  { name: 'Statistic', zh: '统计数值', kebab: 'statistic', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'statisticCode', title: '数值与后缀' },
  ] },
  { name: 'Typography', zh: '排版', kebab: 'typography', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'typographyCode', title: '标题层级与复制' },
  ] },
  { name: 'Tag', zh: '标签', kebab: 'tag', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'tagCode', title: '语义类型与可关闭' },
  ] },
  { name: 'Empty', zh: '空状态', kebab: 'empty', category: 'basic', demos: [
    { file: 'basic.vue', constName: 'emptyCode', title: '自定义描述' },
  ] },

  { name: 'Select', zh: '选择器', kebab: 'select', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'selectCode', title: '基础选择' },
    { file: 'form-controls.vue', constName: 'remoteSelectCode', title: '远程搜索（fetch）' },
  ] },
  { name: 'Checkbox', zh: '复选框', kebab: 'checkbox', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'checkboxCode', title: '勾选、半选与禁用' },
  ] },
  { name: 'Radio', zh: '单选框', kebab: 'radio', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'radioCode', title: '单选组' },
  ] },
  { name: 'RadioGroup', zh: '单选组', kebab: 'radio-group', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'radioCode', title: '单选组' },
  ] },
  { name: 'Switch', zh: '开关', kebab: 'switch', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'switchCode', title: '开关状态' },
  ] },
  { name: 'InputNumber', zh: '数字输入框', kebab: 'input-number', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'inputNumberCode', title: '范围限制' },
  ] },
  { name: 'Rate', zh: '评分', kebab: 'rate', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'rateCode', title: '评分与禁用' },
  ] },
  { name: 'Segmented', zh: '分段控制器', kebab: 'segmented', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'segmentedCode', title: '分段切换' },
  ] },
  { name: 'AutoComplete', zh: '自动完成', kebab: 'auto-complete', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'autoCompleteCode', title: '输入建议' },
  ] },
  { name: 'Mention', zh: '提及', kebab: 'mention', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'mentionCode', title: '@ 成员提及' },
  ] },
  { name: 'Form', zh: '表单', kebab: 'form', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'formCode', title: '表单与校验' },
  ] },
  { name: 'FormItem', zh: '表单项', kebab: 'form-item', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'formCode', title: '表单与校验' },
  ] },
  { name: 'TreeSelect', zh: '树选择', kebab: 'tree-select', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'treeSelectCode', title: '树形选择' },
  ] },
  { name: 'Slider', zh: '滑块', kebab: 'slider', category: 'form-controls', demos: [
    { file: 'form-controls.vue', constName: 'sliderCode', title: '滑块取值' },
  ] },

  { name: 'Dialog', zh: '对话框', kebab: 'dialog', category: 'overlay', demos: [
    { file: 'overlay.vue', constName: 'dialogCode', title: '受控对话框' },
  ] },
  { name: 'Drawer', zh: '抽屉', kebab: 'drawer', category: 'overlay', demos: [
    { file: 'overlay.vue', constName: 'drawerCode', title: '侧边抽屉' },
  ] },
  { name: 'Dropdown', zh: '下拉菜单', kebab: 'dropdown', category: 'overlay', demos: [
    { file: 'overlay.vue', constName: 'dropdownCode', title: '下拉菜单' },
  ] },
  { name: 'Popover', zh: '气泡卡片', kebab: 'popover', category: 'overlay', demos: [
    { file: 'overlay.vue', constName: 'popoverCode', title: '气泡卡片' },
  ] },
  { name: 'Popconfirm', zh: '气泡确认', kebab: 'popconfirm', category: 'overlay', demos: [
    { file: 'overlay.vue', constName: 'popconfirmCode', title: '气泡确认' },
  ] },
  { name: 'Tooltip', zh: '文字提示', kebab: 'tooltip', category: 'overlay', demos: [
    { file: 'overlay.vue', constName: 'tooltipCode', title: '文字提示' },
  ] },

  { name: 'Table', zh: '表格', kebab: 'table', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'tableCode', title: '基础表格' },
    { file: 'data-display.vue', constName: 'remoteTableCode', title: '分页 / 排序 / 筛选自动重取（fetch）' },
  ] },
  { name: 'Pagination', zh: '分页', kebab: 'pagination', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'paginationCode', title: '基础分页' },
  ] },
  { name: 'Tabs', zh: '标签页', kebab: 'tabs', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'tabsCode', title: '标签切换' },
  ] },
  { name: 'Collapse', zh: '折叠面板', kebab: 'collapse', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'collapseCode', title: '折叠面板' },
  ] },
  { name: 'Tree', zh: '树形控件', kebab: 'tree', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'treeCode', title: '勾选与展开' },
    { file: 'data-display.vue', constName: 'remoteTreeCode', title: '懒加载树（fetch）' },
  ] },
  { name: 'Cascader', zh: '级联选择', kebab: 'cascader', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'cascaderCode', title: '级联选择' },
  ] },
  { name: 'Timeline', zh: '时间线', kebab: 'timeline', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'timelineCode', title: '时间线' },
  ] },
  { name: 'Steps', zh: '步骤条', kebab: 'steps', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'stepsCode', title: '步骤导航' },
  ] },
  { name: 'Descriptions', zh: '描述列表', kebab: 'descriptions', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'descriptionsCode', title: '描述列表' },
  ] },
  { name: 'Carousel', zh: '走马灯', kebab: 'carousel', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'carouselCode', title: '走马灯' },
  ] },
  { name: 'Progress', zh: '进度条', kebab: 'progress', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'progressCode', title: '进度条' },
  ] },
  { name: 'Image', zh: '图片', kebab: 'image', category: 'data-display', demos: [
    { file: 'data-display.vue', constName: 'imageCode', title: '图片与失败态' },
  ] },

  { name: 'Message', zh: '全局提示', kebab: 'message', category: 'feedback', demos: [
    { file: 'feedback.vue', constName: 'messageCode', title: '消息类型' },
  ] },
  { name: 'MessageContainer', zh: '消息容器', kebab: 'message-container', category: 'feedback', demos: [] },
  { name: 'Alert', zh: '警告提示', kebab: 'alert', category: 'feedback', demos: [
    { file: 'feedback.vue', constName: 'alertCode', title: '警告类型' },
  ] },
  { name: 'Notification', zh: '通知', kebab: 'notification', category: 'feedback', demos: [
    { file: 'feedback.vue', constName: 'notificationCode', title: '通知提醒' },
  ] },
  { name: 'NotificationContainer', zh: '通知容器', kebab: 'notification-container', category: 'feedback', demos: [] },
  { name: 'Loading', zh: '加载', kebab: 'loading', category: 'feedback', demos: [
    { file: 'feedback.vue', constName: 'loadingCode', title: '加载指示' },
  ] },
  { name: 'Skeleton', zh: '骨架屏', kebab: 'skeleton', category: 'feedback', demos: [
    { file: 'feedback.vue', constName: 'skeletonCode', title: '骨架屏' },
  ] },
  { name: 'Result', zh: '结果页', kebab: 'result', category: 'feedback', demos: [
    { file: 'feedback.vue', constName: 'resultCode', title: '结果状态' },
  ] },
  { name: 'Upload', zh: '上传', kebab: 'upload', category: 'feedback', demos: [
    { file: 'feedback.vue', constName: 'uploadCode', title: '文件列表' },
  ] },

  { name: 'Breadcrumb', zh: '面包屑', kebab: 'breadcrumb', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'breadcrumbCode', title: '基础面包屑' },
  ] },
  { name: 'Menu', zh: '导航菜单', kebab: 'menu', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'menuCode', title: '导航菜单' },
  ] },
  { name: 'Anchor', zh: '锚点', kebab: 'anchor', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'anchorCode', title: '锚点导航' },
  ] },
  { name: 'BackTop', zh: '回到顶部', kebab: 'back-top', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'backTopCode', title: '回到顶部' },
  ] },
  { name: 'Affix', zh: '固钉', kebab: 'affix', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'affixCode', title: '吸顶固钉' },
  ] },
  { name: 'FloatButton', zh: '悬浮按钮', kebab: 'float-button', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'floatButtonCode', title: '悬浮动作组' },
  ] },
  { name: 'DatePicker', zh: '日期选择器', kebab: 'date-picker', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'datePickerCode', title: '日期选择' },
  ] },
  { name: 'TimePicker', zh: '时间选择器', kebab: 'time-picker', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'timePickerCode', title: '时间选择' },
  ] },
  { name: 'Calendar', zh: '日历', kebab: 'calendar', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'calendarCode', title: '日历面板' },
  ] },
  { name: 'ColorPicker', zh: '颜色选择器', kebab: 'color-picker', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'colorPickerCode', title: '颜色选择' },
  ] },
  { name: 'Transfer', zh: '穿梭框', kebab: 'transfer', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'transferCode', title: '穿梭框' },
  ] },
  { name: 'VirtualList', zh: '虚拟列表', kebab: 'virtual-list', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'virtualListCode', title: '虚拟滚动' },
    { file: 'navigation.vue', constName: 'remoteVirtualListCode', title: '远程触底分页（fetch）' },
  ] },
  { name: 'Layout', zh: '布局', kebab: 'layout', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'layoutCode', title: '经典布局' },
  ] },
  { name: 'Grid', zh: '栅格', kebab: 'grid', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'gridCode', title: '栅格排列' },
  ] },
  { name: 'Space', zh: '间距', kebab: 'space', category: 'navigation', demos: [
    { file: 'navigation.vue', constName: 'spaceCode', title: '间距排列' },
  ] },

  { name: 'QRCode', zh: '二维码', kebab: 'qrcode', category: 'extras', demos: [
    { file: 'extras.vue', constName: 'qrCode', title: '二维码' },
  ] },
  { name: 'Tour', zh: '漫游引导', kebab: 'tour', category: 'extras', demos: [
    { file: 'extras.vue', constName: 'tourCode', title: '分步引导' },
  ] },
  { name: 'Watermark', zh: '水印', kebab: 'watermark', category: 'extras', demos: [
    { file: 'extras.vue', constName: 'watermarkCode', title: '文字水印' },
  ] },
  { name: 'CodeCard', zh: '代码卡片', kebab: 'code-card', category: 'extras', demos: [] },
];

/* ------------------------------ 演示源码解析 ------------------------------ */

/** 提取 <script setup> 内容 */
function extractScript(vueSource) {
  const match = vueSource.match(/<script setup[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('未找到 script setup');
  return match[1];
}

/**
 * 将 script 内容切分为顶层声明块（const/let/var/function/interface/type），
 * 通过括号与反引号深度判断边界，并携带紧邻的前置注释。
 */
function parseDeclarations(script) {
  const decls = [];
  const lines = script.split('\n');
  const startRe = /^(const|let|var|function|interface|type)\s+([A-Za-z_$][\w$]*)/;
  let pendingComment = [];
  let buf = null; // { kind, name, lines }
  let depth = 0;
  let inBacktick = false;

  const flush = () => {
    if (buf) {
      decls.push({ kind: buf.kind, name: buf.name, text: buf.lines.join('\n') });
      buf = null;
    }
  };

  for (const line of lines) {
    if (depth === 0 && !inBacktick) {
      const m = line.match(startRe);
      if (m) {
        flush();
        buf = { kind: m[1], name: m[2], lines: [...pendingComment, line] };
        pendingComment = [];
      } else if (/^\s*(\/\/|\/\*)/.test(line) && !buf) {
        pendingComment.push(line);
        continue;
      } else if (buf) {
        buf.lines.push(line);
      } else {
        pendingComment = [];
        continue; // import / 空行等
      }
    } else if (buf) {
      buf.lines.push(line);
    } else {
      continue;
    }

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '\\') { i++; continue; }
      if (inBacktick) {
        if (ch === '`') inBacktick = false;
        continue;
      }
      if (ch === '`') { inBacktick = true; continue; }
      if (ch === '{' || ch === '(' || ch === '[') depth++;
      else if (ch === '}' || ch === ')' || ch === ']') depth--;
    }
    // 深度归零且语句已收尾（; 或 } 结尾）才视为声明完成，
    // 避免 const demoImage =\n  "..." 这类首行无括号的声明被截断
    if (buf && depth === 0 && !inBacktick && /[;}]$/.test(line.trimEnd())) flush();
  }
  flush();
  return decls;
}

/** 从模板代码字符串中收集出现在声明表里的标识符 */
const IDENT_RE = /[A-Za-z_$][\w$]*/g;
function referencedNames(text, nameSet) {
  const found = new Set();
  for (const m of text.matchAll(IDENT_RE)) {
    if (nameSet.has(m[0])) found.add(m[0]);
  }
  return found;
}

/** 解析单个演示文件，返回 { decls, declByName, codeConst: { name -> 模板文本 } } */
function parseDemoFile(fileName) {
  const source = readFileSync(join(demosDir, fileName), 'utf8');
  const decls = parseDeclarations(extractScript(source));
  const declByName = new Map(decls.map((d) => [d.name, d]));
  const codeConst = new Map();
  for (const decl of decls) {
    const m = decl.text.match(new RegExp(`^const ${decl.name}\\s*=\\s*ref\\(\`([\\s\\S]*)\`\\s*\\);\\s*$`, 'm'));
    if (m) codeConst.set(decl.name, m[1]);
  }
  return { decls, declByName, codeConst };
}

const demoFiles = new Map();
function getDemoFile(fileName) {
  if (!demoFiles.has(fileName)) demoFiles.set(fileName, parseDemoFile(fileName));
  return demoFiles.get(fileName);
}

/**
 * 依据 code 常量收集页面 script 所需的全部声明（含传递引用），按源文件顺序返回
 */
function collectDeclarations(fileName, constNames) {
  const { decls, declByName, codeConst } = getDemoFile(fileName);
  const nameSet = new Set(decls.map((d) => d.name));
  const chosen = new Set();
  const queue = [];
  for (const constName of constNames) {
    if (!codeConst.has(constName)) {
      throw new Error(`${fileName} 中未找到 code 常量 ${constName}`);
    }
    chosen.add(constName);
    queue.push(codeConst.get(constName));
  }
  while (queue.length) {
    const text = queue.pop();
    for (const name of referencedNames(text, nameSet)) {
      if (!chosen.has(name)) {
        chosen.add(name);
        queue.push(declByName.get(name).text);
      }
    }
  }
  return decls.filter((d) => chosen.has(d.name));
}

/* ------------------------------ guide.md 解析 ------------------------------ */

function parseGuide() {
  const md = readFileSync(join(docsDir, 'guide.md'), 'utf8');
  const lines = md.split('\n');
  const componentBodies = new Map();
  const specialBodies = new Map();
  let current = null;
  for (const line of lines) {
    let m;
    if ((m = line.match(/^### (.+)$/))) {
      const name = m[1].trim().split(/\s+/)[0];
      current = { type: 'component', key: name };
      componentBodies.set(name, []);
      continue;
    }
    if ((m = line.match(/^## (.+)$/))) {
      const heading = m[1].trim();
      current = /^[一二三四五六七八九十]、/.test(heading)
        ? null // 分类标题
        : { type: 'special', key: heading };
      if (current) specialBodies.set(heading, []);
      continue;
    }
    if (!current) continue;
    (current.type === 'component' ? componentBodies : specialBodies).get(current.key).push(line);
  }
  return { componentBodies, specialBodies };
}

/* ------------------------------ 页面生成 ------------------------------ */

function trimBody(lines) {
  const body = lines.join('\n').replace(/^\n+|\n+$/g, '');
  return body;
}

function buildPage(comp, body) {
  const title = `${comp.name} ${comp.zh}`;
  const parts = ['---', `title: ${title}`, '---', '', `# ${title}`, '', body];

  if (comp.demos.length) {
    parts.push('', '## 交互演示', '');
    const constNames = [...new Set(comp.demos.map((d) => d.constName))];
    const chosen = collectDeclarations(comp.demos[0].file, constNames);
    const valueNames = chosen.filter((d) => d.kind !== 'interface' && d.kind !== 'type').map((d) => d.name);

    for (const demo of comp.demos) {
      parts.push(`### ${demo.title}`, '');
      parts.push(`<CodeCard v-model:code="${demo.constName}" editable title="${demo.title}">`);
      parts.push(`  <LiveDemo :code="${demo.constName}" :scope="demoScope" />`);
      parts.push('</CodeCard>', '');
    }

    parts.push('<script setup lang="ts">', '');
    if (chosen.some((d) => /\bref\(/.test(d.text))) parts.push("import { ref } from 'vue';", '');
    const needFetch = chosen.some((d) => /\bFetch\b/.test(d.text));
    const needQuery = chosen.some((d) => /\bFetchQuery\b/.test(d.text));
    if (needFetch || needQuery) {
      const types = [needFetch && 'Fetch', needQuery && 'FetchQuery'].filter(Boolean).join(', ');
      parts.push(`import type { ${types} } from '@cumquat/components';`, '');
    }
    parts.push(chosen.map((d) => d.text).join('\n\n'), '');
    parts.push('/** LiveDemo 渲染作用域 */');
    parts.push(`const demoScope = { ${valueNames.join(', ')} };`);
    parts.push('</script>', '');
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

/* ------------------------------ 执行 ------------------------------ */

const { componentBodies, specialBodies } = parseGuide();
const outDir = join(docsDir, 'components');
mkdirSync(outDir, { recursive: true });

/** 手工维护的页面，生成器跳过不覆盖 */
const HAND_WRITTEN = new Set(['code-card']);

const missing = [];
const noDemo = [];
for (const comp of COMPONENTS) {
  if (HAND_WRITTEN.has(comp.kebab)) continue;
  const body = componentBodies.get(comp.name);
  if (!body) {
    missing.push(comp.name);
    continue;
  }
  if (!comp.demos.length) noDemo.push(comp.name);
  writeFileSync(join(outDir, `${comp.kebab}.md`), buildPage(comp, trimBody(body)));
}

// 远程数据页
const fetchHeading = [...specialBodies.keys()].find((k) => k.startsWith('远程数据'));
if (fetchHeading) {
  const body = trimBody(specialBodies.get(fetchHeading));
  writeFileSync(
    join(docsDir, 'fetch.md'),
    ['---', 'title: 远程数据 Fetch', '---', '', '# 远程数据 Fetch', '', body].join('\n') + '\n',
  );
}

console.log(`生成组件页 ${COMPONENTS.length - missing.length}/${COMPONENTS.length} 篇 → docs/components/`);
console.log(`无演示组件（仅说明正文）：${noDemo.join(', ') || '无'}`);
if (missing.length) console.warn(`guide.md 中缺失的小节：${missing.join(', ')}`);
console.log(`guide 特殊章节：${[...specialBodies.keys()].join(' | ')}`);
if (!fetchHeading) console.warn('未找到「远程数据」章节，fetch.md 未生成');
