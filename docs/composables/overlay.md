---
title: 浮层模型
---

# 浮层模型

浮层类组件（Dialog、Drawer、Popover、Dropdown、Tooltip、各选择器）共享的开合、定位与关闭编排。

## useModal

模态开合编排：`useOpen` + 锁定滚动 + 焦点陷阱 / 归还 + ESC + 层级。Dialog、Drawer 使用。

```ts
const { isOpen, open, close, zIndex, rendered, visible, onAfterLeave } = useModal({
  maskClosable: true,
  escClosable: true,
  lockScroll: true,
  onOpen: () => {},
  onClose: () => {},
});
```

## usePopoverModel

非模态浮层编排：触发方式（click / hover / focus / manual）+ 定位 + 关闭策略。Popover、Dropdown、Tooltip、Popconfirm 使用。

```ts
const { isOpen, open, close, referenceProps, floatingProps } = usePopoverModel({
  trigger: 'hover',
  openDelay: 100,
  closeDelay: 100,
});
```

## useFloating

锚点浮层定位引擎：placement、自动翻转、移位、边距、箭头坐标，滚动 / 尺寸变化自动更新。

```ts
const { referenceRef, floatingRef, floatingStyle, placement, arrowStyle, update } = useFloating({
  placement: 'bottom',
  strategy: 'fixed',
  gap: 4,
  flip: true,
  shift: true,
});
```

参数见类型 `UseFloatingOptions`；`Placement` / `Strategy` 定义见[类型参考](/types)。

## useOpen

基础开合状态（受控可选）+ 延迟关闭。

```ts
const { isOpen, open, close, toggle } = useOpen({
  defaultValue: false,
  openDelay: 0,
  closeDelay: 100,
  onChange: (open) => {},
});
```

## useDismiss

ESC、外部点击、滚动失焦的统一关闭编排。

```ts
useDismiss({
  isOpen,
  reference,
  floating,
  onDismiss: close,
  escapeKey: true,
});
```

## useHoverIntent

悬停触发的开合延迟（防抖）。

```ts
const { isHovered, onMouseEnter, onMouseLeave } = useHoverIntent({
  showDelay: 100,
  hideDelay: 100,
});
```

## useOverlayContainer

Teleport 目标容器的 SSR 安全解析。

```ts
const { container } = useOverlayContainer({ to: '#overlay-root', fallbackToBody: true });
```
