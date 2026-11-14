---
title: 类型参考 · 数据展示组件
---

# 数据展示组件类型

数据展示类组件 props / 事件 / 插槽携带的数据形状。组件用法见对应的组件文档页。

## 数据展示

### CalendarEvent {#calendarevent}

[Calendar 日历](/components/calendar) 的事件项。

```ts
export interface CalendarEvent {
  /** yyyy-MM-dd */
  date: string;
  label?: string;
}
```

### CollapseItem {#collapseitem}

[Collapse 折叠面板](/components/collapse) 的 `items` 项。

```ts
export interface CollapseItem {
  key: string;
  title: string;
  content: string;
  disabled?: boolean;
}
```

### DescriptionProperty {#descriptionproperty}

[Descriptions 描述列表](/components/descriptions) 的 `properties` 项，与资源池投影的 properties 元数据同形。

```ts
export interface DescriptionProperty {
  key: string;
  label: string;
  /** 类型提示：JSON Schema 类型词汇（string / number / integer / boolean / array / object / null） */
  type?: Kind;
  /** 内容格式提示：date / date-time / email / uri / tag / status…（原样透传文档声明） */
  format?: string;
  /** 枚举值：单元格据此识别枚举列 */
  enum?: Array<string | number | boolean | null>;
  /** 枚举选项：enum 单元格据此显示 label */
  options?: Option[];
  /** 显式指定单元格渲染器名称，跳过竞选 */
  cell?: string;
  /** 竞选加成：对指定渲染器加减分 */
  bias?: Record<string, number>;
}
```

### StatisticValue {#statisticvalue}

[Statistic 统计数值](/components/statistic) 的 `value` 可接受类型。

```ts
export type StatisticValue = string | number | Date;
```

### TableColumn {#tablecolumn}

[Table 表格](/components/table) 的 `columns` 项。

```ts
export interface TableColumn {
  key: string;
  /** 列标题；缺省时回落字段名 */
  title?: string;
  /** 帮助提示 */
  help?: string;
  /** 枚举映射：值 → 文案，值可为 string / number / boolean / null；同时作为默认筛选项 */
  enum?: Option[];
  /** 单元格格式化：返回展示内容；提供后优先于竞选 */
  formatter?: (value: unknown, row: Record<string, unknown>, index: number) => VNodeChild;
  /** 筛选候选值：静态数组直接使用，FetchHandler 则展开面板时拉取；缺省时回落到 enum */
  options?: Option[] | FetchHandler<Option>;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** 显式指定单元格渲染器名称（如 'tag'），指定即生效，跳过竞选 */
  cell?: string;
  /** 竞选加成：对指定渲染器加减分（正负均可） */
  bias?: Record<string, number>;
  /** 该列可排序 */
  sortable?: boolean;
  /** 本地排序比较器；远程排序时仅回发状态 */
  sorter?: (a: Record<string, unknown>, b: Record<string, unknown>) => number;
  /** 自定义本地筛选谓词 */
  filterMethod?: (value: string | number | boolean | null, row: Record<string, unknown>) => boolean;
}
```

列就是视图视角的 schema：手写列只声明传统表格属性，加上 `enum` 与 `formatter` 即可；对象 schema 可通过 `schemaToColumns` 投影为列，`type` / `format` / `enum` 等元数据在投影时展开。

### TableAction {#tableaction}

[Table 表格](/components/table) 的行操作配置。

```ts
export interface TableAction<Row = Record<string, unknown>> {
  key: string;
  label: string;
  /** 危险操作，以强调色文本展示 */
  danger?: boolean;
  disabled?: boolean | ((row: Row, index: number) => boolean);
  /** 按行隐藏该操作 */
  hidden?: (row: Row, index: number) => boolean;
  onClick?: (row: Row, index: number) => void;
}
```

### TimelineItem {#timelineitem}

[Timeline 时间线](/components/timeline) 的 `items` 项。

```ts
export interface TimelineItem {
  key: string;
  title: string;
  content?: string;
  time?: string;
  /** 节点颜色 */
  type?: 'primary' | 'success' | 'warning' | 'danger';
}
```
