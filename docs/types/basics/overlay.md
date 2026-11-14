---
title: 类型参考 · 浮层与视图基础
---

# 浮层与视图基础

基础层中唯一面向视图的一组类型：浮层方位、定位策略、挂载目标，以及应用级全局配置。它们与数据协议无关，描述的是“渲染在什么位置、挂到哪个节点”。

## 浮层方位与挂载

### Placement {#placement}

浮层组件（Popover、Tooltip、Select 下拉等）共用的方位。

```ts
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
```

### Strategy {#strategy}

```ts
/** fixed 相对视口，absolute 相对最近定位祖先 */
export type Strategy = 'fixed' | 'absolute';
```

### MountTarget {#mounttarget}

所有浮层挂载属性和逐条消息的 `target`。CSS 选择器未命中时回退 `body`；挂载到组件时传其根 DOM 元素。

```ts
export type MountTarget = string | HTMLElement;
```

## 浮层定位

### UseFloatingOptions {#usefloatingoptions}

`useFloating` 的入参：方位、定位策略、翻转 / 移位与打开状态来源。

```ts
export interface UseFloatingOptions {
  placement?: MaybeRefOrGetter<Placement>;
  strategy?: Strategy;
  /** 浮层与锚点的主间距，默认 4 */
  gap?: number;
  /** 距视口边缘的最小留白（移位与箭头钳制共用），默认 4 */
  shiftPadding?: number;
  /** 空间不足时自动翻转，默认 true */
  flip?: boolean;
  /** 超出视口时平移回可见区，默认 true */
  shift?: boolean;
  /** 箭头元素尺寸（不传则从箭头元素测量） */
  arrowSize?: number;
  /** 打开状态来源；变为 true 后立即重新定位 */
  open?: MaybeRefOrGetter<boolean>;
  /** 定位完成回调（可读取最终方位） */
  onPositioned?: (data: { placement: Placement; x: number; y: number }) => void;
}
```

## 全局配置

### CumquatConfig {#cumquatconfig}

```ts
export interface CumquatConfig {
  overlay?: {
    /** 所有浮层的默认挂载目标 */
    appendTo?: MountTarget;
  };
}
```

`MountTarget` 与 `CumquatConfig` 均可从主包导入；前者也可从 composables 子包导入，后者也可从 components 子包导入：

```ts
import Cumquat from '@mrchar/cumquat';
import type { CumquatConfig, MountTarget } from '@mrchar/cumquat';

app.use(Cumquat, { overlay: { appendTo: '#overlays' } });
```

`ConfigProvider` 不接收此配置对象，而是使用独立的 `append-to` 属性。
