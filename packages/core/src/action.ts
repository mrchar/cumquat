/**
 * 动作协议：交互组件通过 `action` 属性传入的异步操作。
 * 动作只表达成功/失败，不承载渲染数据。
 */

import type { AsyncResult } from './status';

/** 动作结果：只表达成功/失败，不承载渲染数据 */
export type ActionResult = AsyncResult<never, 'success' | 'error'>;

/** 动作：交互组件传入的异步操作，执行期间自动派生 loading/disabled */
export type ActionHandler = (...args: any[]) => Promise<ActionResult | void> | ActionResult | void;
