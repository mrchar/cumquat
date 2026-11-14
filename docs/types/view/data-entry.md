---
title: 类型参考 · 数据输入组件
---

# 数据输入组件类型

数据输入类组件 props / 事件 / 插槽携带的数据形状。组件用法见对应的组件文档页。

## 数据输入

### CascaderOption {#cascaderoption}

[Cascader 级联选择](/components/cascader) 的选项，可嵌套。

```ts
export interface CascaderOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: CascaderOption[];
  /** 远程懒加载时显式标记：true 叶子；false 表示子级尚未加载 */
  leaf?: boolean;
}
```

### SegmentedOption {#segmentedoption}

[Segmented 分段控制器](/components/segmented) 的 `options` 项。

```ts
export interface SegmentedOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}
```

### SelectOption {#selectoption}

[Select 选择器](/components/select) 的 `options` 项；相同 `group` 的选项在面板内聚合为分组。

```ts
export interface SelectOption<V = string | number, L = string> {
  value: V;
  label: L;
  disabled?: boolean;
  /** 选项分组标题（扁平数据中用于分组组织） */
  group?: string;
}
```

### SliderMark {#slidermark}

[Slider 滑块](/components/slider) 的 `marks` 项。

```ts
export interface SliderMark {
  value: number;
  label?: string;
}
```

### TransferItem {#transferitem}

[Transfer 穿梭框](/components/transfer) 的 `data` 项。

```ts
export interface TransferItem {
  key: string;
  label: string;
  disabled?: boolean;
}
```

### TreeNode {#treenode}

[Tree 树形控件](/components/tree) 的节点，可嵌套；远程模式用 `leaf` 标记叶子。

```ts
export interface TreeNode {
  key: string;
  label: string;
  disabled?: boolean;
  children?: TreeNode[];
  /** 远程懒加载时显式标记：true 叶子；false 表示子级尚未加载 */
  leaf?: boolean;
}
```

### TreeSelectNode {#treeselectnode}

[TreeSelect 树选择](/components/tree-select) 的节点。

```ts
export interface TreeSelectNode {
  key: string;
  label: string;
  disabled?: boolean;
  children?: TreeSelectNode[];
  /** 远程懒加载时显式标记：true 叶子；false 表示子级尚未加载 */
  leaf?: boolean;
}
```

### UploadFile {#uploadfile}

[Upload 上传](/components/upload) 的文件项。

```ts
export interface UploadFile {
  /** 内部唯一标识（外部传入数据可缺省） */
  uid?: string | number;
  name: string;
  size?: string;
  status?: 'uploading' | 'done' | 'error';
  /** 0-100 上传进度 */
  percent?: number;
  /** 原始浏览器文件（内部入队项携带） */
  raw?: File;
}
```
