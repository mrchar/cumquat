---
title: 类型参考 · 反馈组件
---

# 反馈组件类型

反馈类组件 props / 事件 / 插槽携带的数据形状。组件用法见对应的组件文档页。

## 反馈

### DialogAction {#dialogaction}

[Dialog 对话框](/components/dialog) 的 `action` / `actions` 配置项。

```ts
export interface DialogAction {
  /** 动作标识；不传则按索引 */
  key?: string;
  /** 按钮文案 */
  label: string;
  /** 异步执行方法 */
  handler: ActionHandler;
  /** 按钮类型，与 Button 的 type 对齐 */
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** 成功后是否自动关闭，默认 true */
  closeOnSuccess?: boolean;
  /** 失败后是否关闭，默认 false */
  closeOnFail?: boolean;
  /** 覆盖组件默认错误文案 */
  errorText?: string;
  /** 按钮禁用态 */
  disabled?: boolean | (() => boolean);
}
```

### TourStep {#tourstep}

[Tour 漫游引导](/components/tour) 的 `steps` 项。

```ts
export interface TourStep {
  key: string;
  title: string;
  content: string;
  /** 目标元素选择器（高亮挖空 + 卡片定位） */
  target?: string;
  /** 卡片相对目标的位置 */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
```
