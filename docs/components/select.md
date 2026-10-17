---
title: Select 选择器
---

# Select 选择器

下拉单选 / 多选，支持搜索、分组、清空与远程四态。

`SelectOption` 结构：`{ label: string; value: string | number; disabled?: boolean; group?: string }`，相同 `group` 的选项在面板内聚合为分组。

| Prop        | 类型                             | 默认值     | 说明                                                      |
| ----------- | -------------------------------- | ---------- | --------------------------------------------------------- |
| modelValue  | `V \| V[] \| null`               | -          | 绑定值（v-model，多选为数组）                             |
| options     | `SelectOption[]`                 | `[]`       | 静态选项                                                  |
| placeholder | `string`                         | `'请选择'` | 占位文本                                                  |
| disabled    | `boolean`                        | `false`    | 禁用                                                      |
| multiple    | `boolean`                        | `false`    | 多选（标签回显，可逐个移除）                              |
| filterable  | `boolean`                        | `false`    | 可搜索                                                    |
| clearable   | `boolean`                        | `false`    | 可清空                                                    |
| name        | `string`                         | -          | 表单字段名                                                |
| state       | `AsyncStateLike<SelectOption[]>` | -          | 远程数据状态：传入后优先于 options 渲染，组件自身不发请求 |
| fetch       | `Fetch<SelectOption>`            | -          | 远程选项源：挂载即请求，输入时以 `query.keyword` 自动重取（防抖 300ms），自动四态 |

| 事件              | 参数                      | 说明   |
| ----------------- | ------------------------- | ------ |
| update:modelValue | `value: V \| V[] \| null` | 值更新 |
| change            | `value: V \| V[] \| null` | 值变化 |

```vue
<Select v-model="city" :options="cityOptions" placeholder="选择城市" clearable />
<Select v-model="tags" :options="tagOptions" multiple filterable />
<Select v-model="uid" :state="userListState" filterable />
<Select v-model="uid" :fetch="fetchUsers" filterable placeholder="搜索用户" />
```

## 交互演示

### 基础选择

<CodeCard v-model:code="selectCode" editable title="基础选择">
  <LiveDemo :code="selectCode" :scope="demoScope" />
</CodeCard>

### 远程搜索（fetch）

<CodeCard v-model:code="remoteSelectCode" editable title="远程搜索（fetch）">
  <LiveDemo :code="remoteSelectCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

import type { Fetch, FetchQuery } from '@cumquat/components';

const selectValue = ref<string | number | null>('bj');

const selectOptions = [
  { label: '北京', value: 'bj' },
  { label: '上海', value: 'sh' },
  { label: '广州', value: 'gz' },
];

const selectCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Select v-model="selectValue" :options="selectOptions" class="w-48" />
    <span class="text-sm text-cumquat-text-muted">选中值：{{ selectValue ?? '（未选）' }}</span>
  </div>
`);

/* 远程搜索 Select：输入关键词防抖 300ms 自动重取 */
const remoteSelectValue = ref<string | number | null>(null);

const remoteUserOptions = Array.from({ length: 30 }, (_, index) => ({
  label: `用户 ${String(index + 1).padStart(2, '0')}`,
  value: index + 1,
}));

const fetchRemoteUsers: Fetch<{ label: string; value: number }> = async (query: FetchQuery) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const keyword = query.keyword?.trim() ?? '';
  return keyword
    ? remoteUserOptions.filter((option) => option.label.includes(keyword))
    : remoteUserOptions;
};

const remoteSelectCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Select
      v-model="remoteSelectValue"
      :fetch="fetchRemoteUsers"
      filterable
      placeholder="输入「用户」试试"
      class="w-48"
    />
    <span class="text-sm text-cumquat-text-muted"
      >选中值：{{ remoteSelectValue ?? '（未选）' }}</span
    >
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { selectValue, selectOptions, selectCode, remoteSelectValue, remoteUserOptions, fetchRemoteUsers, remoteSelectCode };
</script>

