---
title: CodeCard 代码卡片
---

# CodeCard 代码卡片

演示插槽与示例源码展示卡片，内置代码高亮（明暗主题自适应），支持复制、展开/收起；开启 `editable` 后可直接编辑示例代码并实时生效，一键恢复初始代码。

| Prop          | 类型      | 默认值  | 说明                                                          |
| ------------- | --------- | ------- | ------------------------------------------------------------- |
| title         | `string`  | `''`    | 卡片标题，不传则不渲染标题栏                                  |
| code          | `string`  | -       | 示例源码（必填，支持带公共缩进的模板字符串）                  |
| language      | `string`  | `'vue'` | 源码语言（vue / typescript / javascript / css / html / json） |
| defaultExpand | `boolean` | `false` | 初始是否展开代码                                              |
| editable      | `boolean` | `false` | 是否允许编辑代码；编辑内容经 300ms 防抖同步给宿主             |

| 事件        | 参数           | 说明                                     |
| ----------- | -------------- | ---------------------------------------- |
| update:code | `code: string` | 编辑防抖后的最新代码，配合 v-model:code  |
| reset       | -              | 点击恢复后触发，代码还原至首次加载的快照 |

| 插槽    | 说明           |
| ------- | -------------- |
| default | 实时演示内容区 |

## 交互演示

### 基础用法

<CodeCard v-model:code="cardDemoCode" editable title="嵌套渲染的代码卡片">
  <LiveDemo :code="cardDemoCode" />
</CodeCard>

### 可编辑与恢复

下方演示区与代码同源：点击「编辑代码」修改源码，演示区即时更新；点击「恢复」还原初始代码。

<CodeCard v-model:code="editableDemoCode" editable title="编辑下方演示区代码试试">
  <LiveDemo :code="editableDemoCode" />
</CodeCard>

> 高亮器懒加载且全局单例，未就绪时降级渲染纯文本；明暗主题下自动切换代码配色。

<script setup>
import { ref } from 'vue';

const cardDemoCode = ref(`
  <CodeCard title="复制与展开" code="<Button type='primary'>主要按钮</Button>">
    <Button type="primary">主要按钮</Button>
  </CodeCard>
`);

const editableDemoCode = ref(`
  <div class="flex flex-col gap-3">
    <Button type="primary">主要按钮</Button>
    <Button>次要按钮</Button>
    <Button type="danger">危险按钮</Button>
  </div>
`);

const demoScope = {};
</script>
