import { h } from 'vue';
import type { VNodeChild } from 'vue';

/**
 * 单元格竞选：列定义驱动的单元格渲染机制。
 *
 * 每个 Cell 对完整列定义自我评价返回适配度分数（正数越大越适配，0 弃权），
 * 竞选代理按列裁决取最高分（同分先注册者优先），无正分回落默认文本。
 * 优先级链路：插槽 > 显式指定 cell > 竞选推断 > 默认文本。
 */

/** 竞选输入：完整列定义。type / format 只是常用字段，宿主附加的自定义字段同样进入评价输入 */
export interface CellColumn {
  key: string;
  title: string;
  /** 保存格式提示：string / number / boolean / date / datetime / enum */
  type?: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  /** 内容格式提示：email / uri / tag / status…（原样透传文档声明） */
  format?: string;
  /** 枚举选项：enum 单元格据此显示 label */
  options?: Array<{ label: string; value: string | number }>;
  /** 筛选项：与 options 同形，enum 单元格回落使用 */
  filters?: Array<{ label: string; value: string | number }>;
  /** 显式指定单元格渲染器名称，跳过竞选 */
  cell?: string;
  /** 竞选加成：对指定渲染器加减分，正负均可，裁决前应用 */
  bias?: Record<string, number>;
}

/** 单元格渲染器契约：自包含，只声明「擅长什么、怎么渲染」 */
export interface CellRenderer {
  /** 注册名：显式指定的目标；同名重注册替换既有实现（含内建） */
  name: string;
  /** 自我评价：完整列定义 → 适配度分数，0 表示弃权；纯函数、无副作用，不读单元格值 */
  fitness: (column: CellColumn) => number;
  /** 渲染：值 → 展示内容；需自行处理空值与越界值 */
  render: (value: unknown, column: CellColumn) => VNodeChild;
}

const globalCells: CellRenderer[] = [];

/** 注册单元格渲染器：参与全局竞选；同名替换既有实现（含内建） */
export function registerCell(cell: CellRenderer): void {
  const index = globalCells.findIndex((item) => item.name === cell.name);
  if (index >= 0) globalCells.splice(index, 1, cell);
  else globalCells.push(cell);
}

/** 按列裁决：显式指定命中即生效，否则竞选取最高分（同分先注册者优先），无正分返回 undefined 走默认文本 */
export function resolveCell(column: CellColumn, local?: CellRenderer[]): CellRenderer | undefined {
  if (column.cell) {
    const hit =
      local?.find((item) => item.name === column.cell) ??
      globalCells.find((item) => item.name === column.cell);
    if (hit) return hit;
  }
  let best: CellRenderer | undefined;
  let bestScore = 0;
  const consider = (cell: CellRenderer) => {
    const base = cell.fitness(column);
    const score =
      (typeof base === 'number' && Number.isFinite(base) ? base : 0) +
      (column.bias?.[cell.name] ?? 0);
    if (score > bestScore) {
      best = cell;
      bestScore = score;
    }
  };
  // 局部注册先于全局参与竞选：同分时局部优先
  if (local) for (const cell of local) consider(cell);
  for (const cell of globalCells) consider(cell);
  return best;
}

/* ---------------- 值处理工具：空值与越界值由 Cell 自行降级 ---------------- */

function textOf(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

const pad2 = (input: number) => String(input).padStart(2, '0');

/** ISO 纯日期串按原样取前 10 位（避免时区偏移），其余用本地时区格式化 */
function formatDate(value: unknown): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = toDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateTime(value: unknown): string | null {
  const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = toDate(value);
  if (!date) return null;
  const day = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  // 纯日期串渲染为日期本身，不补零点时刻
  return dateOnly ? day : `${day} ${time}`;
}

/** enum label 查找：优先 options，回落 filters；越界值由调用方降级显示原值 */
function enumLabel(column: CellColumn, value: unknown): string | undefined {
  const options = column.options ?? column.filters;
  if (!options) return undefined;
  const hit = options.find((option) => String(option.value) === String(value));
  return hit?.label;
}

function cellClass(kind: string, extra?: string): string {
  return extra
    ? `cumquat-cell cumquat-cell--${kind} ${extra}`
    : `cumquat-cell cumquat-cell--${kind}`;
}

/* ---------------- 内建 Cell 集 ---------------- */

/** 默认文本：恒为 1 的兜底，任何列都不弃权 */
const textCell: CellRenderer = {
  name: 'text',
  fitness: () => 1,
  render: (value) => textOf(value),
};

const numberCell: CellRenderer = {
  name: 'number',
  fitness: (column) => (column.type === 'number' ? 80 : 0),
  render: (value) => {
    const parsed = toNumber(value);
    if (parsed === null) return textOf(value);
    return h('span', { class: cellClass('number') }, parsed.toLocaleString());
  },
};

const booleanCell: CellRenderer = {
  name: 'boolean',
  fitness: (column) => (column.type === 'boolean' ? 90 : 0),
  render: (value) => {
    if (value === null || value === undefined || value === '') return '';
    const yes = !!value;
    return h(
      'span',
      {
        class: cellClass('boolean', yes ? 'cumquat-cell--boolean-yes' : 'cumquat-cell--boolean-no'),
      },
      yes ? '是' : '否',
    );
  },
};

const enumCell: CellRenderer = {
  name: 'enum',
  fitness: (column) => (column.type === 'enum' ? 100 : 0),
  render: (value, column) => {
    if (value === null || value === undefined || value === '') return '';
    const label = enumLabel(column, value);
    return h(
      'span',
      { class: cellClass('enum', label === undefined ? 'cumquat-cell--enum-unknown' : undefined) },
      label ?? textOf(value),
    );
  },
};

const dateCell: CellRenderer = {
  name: 'date',
  fitness: (column) => (column.type === 'date' ? 90 : 0),
  render: (value) => {
    const formatted = formatDate(value);
    if (formatted === null) return textOf(value);
    return h('span', { class: cellClass('date') }, formatted);
  },
};

const datetimeCell: CellRenderer = {
  name: 'datetime',
  fitness: (column) => (column.type === 'datetime' ? 95 : 0),
  render: (value) => {
    const formatted = formatDateTime(value);
    if (formatted === null) return textOf(value);
    return h('span', { class: cellClass('datetime') }, formatted);
  },
};

const emailCell: CellRenderer = {
  name: 'email',
  fitness: (column) => (column.format === 'email' ? 95 : 0),
  render: (value) => {
    const text = textOf(value);
    if (text === '') return '';
    return h('a', { class: cellClass('email'), href: `mailto:${text}` }, text);
  },
};

const linkCell: CellRenderer = {
  name: 'link',
  fitness: (column) => (column.format === 'uri' ? 95 : 0),
  render: (value) => {
    const text = textOf(value);
    if (text === '') return '';
    return h(
      'a',
      { class: cellClass('link'), href: text, target: '_blank', rel: 'noopener noreferrer' },
      text,
    );
  },
};

const tagCell: CellRenderer = {
  name: 'tag',
  fitness: (column) => (column.format === 'tag' || column.format === 'status' ? 85 : 0),
  render: (value) => {
    const text = textOf(value);
    if (text === '') return '';
    return h('span', { class: cellClass('tag') }, text);
  },
};

// 内建集在模块加载时注册；宿主后续 registerCell 同名即可覆盖
for (const cell of [
  textCell,
  numberCell,
  booleanCell,
  enumCell,
  dateCell,
  datetimeCell,
  emailCell,
  linkCell,
  tagCell,
]) {
  registerCell(cell);
}
