---
title: 类型参考 · 导航组件
---

# 导航组件类型

导航类组件 props / 事件 / 插槽携带的数据形状。组件用法见对应的组件文档页。

## 导航

### AnchorItem {#anchoritem}

[Anchor 锚点](/components/anchor) 的 `items` 项。

```ts
export interface AnchorItem {
  href: string;
  label: string;
}
```

### BreadcrumbItem {#breadcrumbitem}

[Breadcrumb 面包屑](/components/breadcrumb) 的 `items` 项。

```ts
export interface BreadcrumbItem {
  label: string;
  href?: string;
}
```

### DropdownItem {#dropdownitem}

[Dropdown 下拉菜单](/components/dropdown) 的 `items` 项。

```ts
export interface DropdownItem {
  key: string;
  label: string;
  disabled?: boolean;
  /** 渲染为分隔线（其余字段忽略） */
  divider?: boolean;
}
```

### MenuItem {#menuitem}

[Menu 导航菜单](/components/menu) 的 `items` 项，可嵌套子菜单。

```ts
export interface MenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  icon?: string;
  children?: MenuItem[];
}
```

### StepItem {#stepitem}

[Steps 步骤条](/components/steps) 的 `items` 项。

```ts
export interface StepItem {
  key: string;
  title: string;
  description?: string;
  /** 单步状态覆盖（如标记某一步 error） */
  status?: 'done' | 'active' | 'error';
  disabled?: boolean;
}
```

### TabItem {#tabitem}

[Tabs 标签页](/components/tabs) 的 `items` 项。

```ts
export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  closable?: boolean;
}
```

### PopoverTrigger {#popovertrigger}

[Popover](/components/popover)、[Dropdown](/components/dropdown) 等浮层的触发方式。

```ts
export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual';
```

### PaginationPageItem {#paginationpageitem}

页码序列中的单项：数字页码或省略号占位。

```ts
export type PaginationPageItem = number | 'start-ellipsis' | 'end-ellipsis';
```
