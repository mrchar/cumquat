/**
 * 订阅协议：数据展示组件通过 `subscribe` 属性传入的订阅函数。
 * 订阅返回渲染数据，挂载时调用，resolve 后渲染。
 */

import type { AsyncResult } from './status';

/** 订阅结果：承载渲染数据；status 为 pending 时保持加载态 */
export type SubscribeResult<T> = AsyncResult<T>;

/** 订阅处理：数据展示组件传入的订阅函数，挂载时调用，resolve 后渲染数据 */
export type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;
