/**
 * 状态契约：所有异步协议共用的状态词汇。
 * 具体协议的入参与返回形状见 `action.ts`、`fetch.ts`、`subscribe.ts`。
 */

import type { MaybeRefOrGetter } from 'vue';

/** 异步生命周期状态：所有异步协议共用的唯一状态词汇 */
export type Status = 'idle' | 'pending' | 'success' | 'error';

/**
 * 处理器结果基类型：action 与 subscribe 结果协议的共同形状。
 * 只描述“处理器返回了什么”，不承载组件渲染的完整状态快照。
 * 字段接受裸值、Ref 或 getter，消费方统一以 toValue 解包。
 */
export interface AsyncResult<T = unknown, S extends Status = Status> {
  /** 结果状态，缺省视为 success */
  status?: MaybeRefOrGetter<S>;
  /** 结果携带的数据 */
  data?: MaybeRefOrGetter<T>;
  /** 失败信息；status 为 error 或携带 error 时进入失败分支 */
  error?: MaybeRefOrGetter<unknown>;
  /** 提示文案，覆盖默认错误文案 */
  message?: MaybeRefOrGetter<string>;
}
