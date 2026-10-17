---
title: Layout 布局
---

# Layout 布局

页面骨架，含侧栏折叠与响应式断点。

| Prop             | 类型                           | 默认值       | 说明                                |
| ---------------- | ------------------------------ | ------------ | ----------------------------------- |
| direction        | `'vertical' \| 'horizontal'`   | `'vertical'` | 布局主轴方向                        |
| collapsed        | `boolean`                      | -            | 受控侧栏折叠态（v-model:collapsed） |
| defaultCollapsed | `boolean`                      | `false`      | 非受控初始折叠态                    |
| breakpoint       | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`       | 低于该断点时自动折叠侧栏            |
| hasSider         | `boolean`                      | `false`      | 是否提供 sider 插槽区域             |

| 事件             | 参数                 | 说明       |
| ---------------- | -------------------- | ---------- |
| update:collapsed | `collapsed: boolean` | 折叠态更新 |
| collapse         | -                    | 折叠时     |
| expand           | -                    | 展开时     |

| 插槽    | 说明                                          |
| ------- | --------------------------------------------- |
| header  | 头部区，slot props：`{ collapsed, toggle }`   |
| sider   | 侧栏区，slot props：`{ collapsed, toggle }`   |
| default | 主内容区，slot props：`{ collapsed, toggle }` |
| footer  | 底部区                                        |

Expose：`collapsed` / `toggle()` / `collapse()` / `expand()`。

```vue
<Layout has-sider breakpoint="lg">
  <template #header>顶栏</template>
  <template #sider="{ collapsed }"><Menu :collapsed="collapsed" :items="nav" /></template>
  <main>内容</main>
  <template #footer>© 2026</template>
</Layout>
```

## 交互演示

### 经典布局

<CodeCard v-model:code="layoutCode" editable title="经典布局">
  <LiveDemo :code="layoutCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const layoutCode = ref(`
  <Layout class="overflow-hidden rounded-cumquat border border-cumquat-border">
    <div class="flex h-10 items-center bg-cumquat-surface-3 px-4 text-sm">Header</div>
    <div class="flex min-h-28">
      <div class="w-32 bg-cumquat-surface-2 px-4 py-3 text-sm text-cumquat-text-muted">
        Aside
      </div>
      <div class="flex-1 px-4 py-3 text-sm">Content</div>
    </div>
  </Layout>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { layoutCode };
</script>
