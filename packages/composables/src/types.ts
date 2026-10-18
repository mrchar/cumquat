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

/** 动作结果：action 返回值可导出状态与错误，组件据此控制状态与错误提示 */
export interface ActionResult {
  /** 动作结果状态，缺省视为 success */
  status?: 'success' | 'error';
  /** 失败信息；status 为 error 或携带 error 时组件进入失败分支 */
  error?: unknown;
  /** 提示文案，覆盖组件默认错误文案 */
  message?: string;
}

/** 动作：交互组件传入的异步操作，执行期间自动派生 loading/disabled */
export type ActionLike = (...args: any[]) => Promise<ActionResult | void> | ActionResult | void;

/** 订阅结果：subscribe 处理方法返回值，导出状态、数据与错误 */
export interface SubscribeResult<T> {
  /** 订阅状态，缺省视为 success */
  status?: 'loading' | 'success' | 'error';
  /** 订阅到的数据；status 为 success 时由组件渲染 */
  data?: T;
  /** 失败信息；status 为 error 或携带 error 时组件进入失败分支 */
  error?: unknown;
  /** 提示文案，覆盖组件默认错误文案 */
  message?: string;
}

/** 订阅处理：数据展示组件传入的订阅函数，挂载时调用，resolve 后渲染数据 */
export type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;

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
