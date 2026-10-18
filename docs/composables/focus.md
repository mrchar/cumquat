---
title: 焦点与键盘
---

# 焦点与键盘

a11y 键盘交互原语：焦点陷阱 / 归还、roving-tabindex、键盘检索、列表导航。

## useFocusTrap

焦点陷阱：Tab 在容器内循环，打开时聚焦初始元素。模态组件使用。

```ts
const { isActive, trap, release } = useFocusTrap(dialogRef, {
  initialFocus: () => confirmButtonRef.value,
});
```

## useFocusReturn

关闭浮层后焦点归还到触发元素。

```ts
const { record, restore } = useFocusReturn({ autoRestore: true });
```

## useRovingFocus

列表内 roving-tabindex 焦点管理：方向键移动、禁用项跳过、循环。

```ts
const { activeIndex, onKeydown, setActive } = useRovingFocus({
  count: () => items.length,
  isItemDisabled: (i) => items[i].disabled,
  orientation: 'vertical', // 'horizontal'
  loop: true,
});
```

## useTypeahead

键盘输入匹配选项（按字符跳转），连续输入从上次命中后继续轮询。

```ts
const { query, onKeydown } = useTypeahead({
  getLabels: () => options.map((o) => o.label),
  onMatch: (index) => select(index),
  resetDelay: 500,
});
```

## useListboxNavigation

选项列表键盘导航：上下移动、Home / End、回车选中、禁用项跳过、循环。Select、Menu、Cascader 等使用。

```ts
const { activeIndex, onKeydown, move, select, reset } = useListboxNavigation({
  count: () => options.length,
  isItemDisabled: (i) => options[i].disabled,
  onSelect: (i) => commit(options[i]),
});
```
