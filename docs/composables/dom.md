---
title: DOM 与浏览器
---

# DOM 与浏览器

与业务无关的基础能力：事件、观察器、滚动、媒体查询、定时器、剪贴板、拖拽、图片加载。全部 SSR 安全，卸载自动清理。

## useEventListener

绑定 DOM 事件，目标支持 ref / getter 响应式切换，卸载自动解绑。

```ts
useEventListener(target, 'click', handler, { passive: true });
```

## useResizeObserver

元素尺寸监听。

```ts
const { width, height } = useResizeObserver(targetRef);
```

## useIntersectionObserver

元素进出视口。

```ts
const { isIntersecting, ratio } = useIntersectionObserver(targetRef, {
  root: scrollContainer,
  rootMargin: '100px',
});
```

## useClickOutside

点击元素外部检测。

```ts
useClickOutside(panelRef, (event) => close(), { event: 'pointerdown' });
```

## useScroll

目标元素 / 窗口滚动位置与方向。

```ts
const { x, y, direction } = useScroll(); // 默认窗口
const box = useScroll(containerRef, { throttle: true });
```

## useScrollLock

锁定背景滚动（浮层打开时），支持多层嵌套计数。

```ts
const { isLocked, lock, unlock } = useScrollLock();
```

## useScrollIntoView

平滑滚动元素至可视区。

```ts
const scrollIntoView = useScrollIntoView(defaultTarget);
scrollIntoView(); // 滚动默认目标
scrollIntoView(otherRef, { block: 'center' });
```

## useMediaQuery

媒体查询订阅。断点语义由宿主定义。

```ts
const isMobile = useMediaQuery('(max-width: 768px)');
```

## useTimeoutFn / useIntervalFn

可立即停止 / 重启的定时器，卸载自动清理。

```ts
const { isPending, start, stop } = useTimeoutFn(() => close(), 3000);
start(1000); // 可改延迟重启

const { pause, resume, isActive } = useIntervalFn(tick, 1000, { immediate: true });
```

## useDebounceFn

连续调用只执行最后一次，可取消或立即执行；卸载自动清理。

```ts
const { run, cancel, flush, isPending } = useDebounceFn(search, 300);
run(keyword); // 300ms 内的重复调用只保留最后一次
```

## useOnceFn

只执行第一次调用并缓存返回值（返回值可以是 Promise），后续调用直接返回同一结果；需要重新执行时手动 `reset`。

```ts
const { run, reset, called } = useOnceFn(() => loadDetail(id));
const detail = run(); // 首次调用执行并缓存
const same = run(); // 直接返回首次结果
reset(); // 允许下次重新执行
```

## useClipboard

复制文本与成功反馈。

```ts
const { copy, copied, error } = useClipboard({ copiedDuration: 1500 });
await copy('hello');
```

## useDraggable

指针拖拽：元素几何测量、边界钳制、比例输出。Slider、ColorPicker 使用。

```ts
const { x, y, ratio, dragging, onPointerDown } = useDraggable(trackRef, {
  handle: handleRef,
  axis: 'x',
  onChange: (ratio) => emit('update:modelValue', ratio * 100),
});
```

## useImageState

图片加载中 / 成功 / 失败状态、懒加载触发。Image、Avatar 使用。

```ts
const { status, onLoad, onError } = useImageState(() => props.src, {
  lazy: true,
  target: imgWrapperRef,
});
```

## useTransitionVisible

进出场过渡的挂载状态机：`rendered` 控制 v-if，`visible` 控制过渡类。

```ts
const { rendered, visible, onAfterLeave } = useTransitionVisible(isOpen);
```

## useZIndex

全局浮层层级递增。

```ts
const { currentZIndex, nextZIndex, getGlobalZIndex } = useZIndex();
nextZIndex(); // 每次打开浮层取新层级
getGlobalZIndex(); // 读取当前全局最大值（供初始化样式参考）
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `currentZIndex` | `Ref<number>` | 当前实例分配到的层级 |
| `nextZIndex` | `() => number` | 取下一个层级，并同步到 `currentZIndex` |
| `getGlobalZIndex` | `() => number` | 读取当前全局最大值，不消耗层级 |

`useZIndex(initial?)` 可传入初始层级；缺省从全局计数读取。

### resetGlobalZIndex

把全局浮层层级计数重置回基准值（默认 `2000`），返回 `void`。仅供测试隔离使用。

```ts
function resetGlobalZIndex(value = BASE_Z_INDEX): void;
```

`useZIndex` 与 `resetGlobalZIndex` 共享同一份模块级计数；重置只影响后续 `nextZIndex()` 的起点，不会修改已打开浮层已取得的 `z-index`。
