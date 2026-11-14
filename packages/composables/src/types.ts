/**
 * 视图层类型契约：浮层定位与挂载目标。
 * 数据与异步状态契约位于 `@cumquat/core`，这里只保留渲染位置相关的类型。
 */

/** 浮层方位（含主方位与对齐方式） */
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/** 浮层策略：fixed 相对视口，absolute 相对最近定位祖先 */
export type Strategy = 'fixed' | 'absolute';

/** 浮层挂载目标：CSS 选择器或 DOM 元素；挂载到组件时传其根 DOM 元素 */
export type MountTarget = string | HTMLElement;
