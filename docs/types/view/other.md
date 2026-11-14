---
title: 类型参考 · 其他组件
---

# 其他组件类型

未归入前述分类的组件 props / 事件 / 插槽携带的数据形状。组件用法见对应的组件文档页。

## 其他

### FloatAction {#floataction}

[FloatButton 悬浮按钮](/components/float-button) 的动作项。

```ts
export interface FloatAction {
  key: string;
  label: string;
  disabled?: boolean;
}
```
