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
const { x, y, direction } = useScroll();           // 默认窗口
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
scrollIntoView();                    // 滚动默认目标
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
const { currentZIndex, nextZIndex } = useZIndex();
nextZIndex(); // 每次打开浮层取新层级
```
