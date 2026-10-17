---
title: Cascader 级联选择
---

# Cascader 级联选择

多级联动选择。

`CascaderOption` 结构：`{ label: string; value: string | number; disabled?: boolean; children?: CascaderOption[] }`。

| Prop           | 类型                                                  | 默认值     | 说明                               |
| -------------- | ----------------------------------------------------- | ---------- | ---------------------------------- |
| options        | `CascaderOption[]`                                    | -          | 级联数据（绑定 fetch 时可省略） |
| fetch          | `Fetch<CascaderOption>`                               | -          | 远程级联：展开列时以 `query.filters.parentKey` 懒加载下一列 |
| modelValue     | `string \| number \| Array<string \| number> \| null` | -          | 叶子 value；emitPath 时为路径数组  |
| placeholder    | `string`                                              | `'请选择'` | 占位文本                           |
| disabled       | `boolean`                                             | `false`    | 禁用                               |
| changeOnSelect | `boolean`                                             | `false`    | 允许选择任意一级                   |
| emitPath       | `boolean`                                             | `false`    | v-model 携带完整路径而非叶子 value |

| 事件              | 参数               | 说明   |
| ----------------- | ------------------ | ------ |
| update:modelValue | `value: … \| null` | 值更新 |
| change            | `value: … \| null` | 值变化 |

```vue
<Cascader v-model="region" :options="regions" />
<Cascader v-model="path" :options="regions" emit-path change-on-select />
```

## 交互演示

### 级联选择

<CodeCard v-model:code="cascaderCode" editable title="级联选择">
  <LiveDemo :code="cascaderCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const cascaderValue = ref<string | number | null>(null);

const cascadeOptions = [
  {
    label: '华东',
    value: 'east',
    children: [
      { label: '上海', value: 'sh' },
      { label: '杭州', value: 'hz' },
    ],
  },
  {
    label: '华南',
    value: 'south',
    children: [{ label: '广州', value: 'gz' }],
  },
];

const cascaderCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Cascader v-model="cascaderValue" :options="cascadeOptions" class="w-56" />
    <span class="text-sm text-cumquat-text-muted"
      >选中值：{{ cascaderValue ?? '（未选）' }}</span
    >
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { cascaderValue, cascadeOptions, cascaderCode };
</script>

