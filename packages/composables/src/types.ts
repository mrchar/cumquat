/**
 * 公共类型契约：所有组合函数与组件之间共享的最小类型集合。
 */

/** 异步数据状态：数据型组件/组合函数唯一依赖的数据契约 */
export interface AsyncStateLike<T> {
  status: 'pending' | 'success' | 'error';
  data: T;
  error?: unknown;
  isStale?: boolean;
  retry?: () => void;
}

/** 动作：动作型组件传入的异步操作，执行期间自动派生 pending/disabled */
export type ActionLike = (...args: any[]) => Promise<unknown> | unknown;

/** 受控值的标准入参形态 */
export interface ControlledProps<T> {
  modelValue?: T;
  defaultValue?: T;
  'onUpdate:modelValue'?: (value: T) => void;
}

/** 异步请求函数：返回 Promise，可携带任意参数 */
export type AsyncFn<T, A extends unknown[]> = (...args: A) => Promise<T>;

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
