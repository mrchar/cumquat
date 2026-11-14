---
title: Menu 导航菜单
---

# Menu 导航菜单

侧边 / 顶部导航，含分组展开与折叠模式。

[`MenuItem`](/types/view/navigation#menuitem) 结构：`{ key: string; label: string; disabled?: boolean; icon?: string; children?: `[`MenuItem`](/types/view/navigation#menuitem)`[] }`。

| Prop                | 类型              | 默认值  | 说明                            |
| ------------------- | ----------------- | ------- | ------------------------------- |
| items               | [`MenuItem`](/types/view/navigation#menuitem)`[]`      | `[]`    | 菜单数据（绑定 fetch 时可省略） |
| fetch               | [`FetchHandler`](/types/basics/core#fetchhandler)`<`[`MenuItem`](/types/view/navigation#menuitem)`>` | -       | 远程菜单：挂载即请求，内置四态  |
| modelValue          | `string`          | -       | 选中项 key（v-model）           |
| collapsed           | `boolean`         | `false` | 折叠模式（仅图标，子菜单弹出）  |
| defaultExpandedKeys | `string[]`        | `[]`    | 默认展开的分组 key              |

| 事件              | 参数             | 说明       |
| ----------------- | ---------------- | ---------- |
| update:modelValue | `key: string`    | 选中更新   |
| select            | `item: `[`MenuItem`](/types/view/navigation#menuitem) | 点击菜单项 |

```vue
<Menu v-model="route" :items="navItems" :default-expanded-keys="['system']" @select="go" />
```

## 补充：订阅数据源

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<`[`MenuItem`](/types/view/navigation#menuitem)`[]>` | `undefined` | 订阅菜单项；挂载时调用，优先于本地 `items` |

`subscribe` 与本地 `items` 同时存在时优先使用 `subscribe`；订阅失败时回退到 `items`。

## 交互演示

### 导航菜单

<CodeCard v-model:code="menuCode" editable title="导航菜单">
  <LiveDemo :code="menuCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const menuActive = ref('home');

const menuItems = [
  { key: 'home', label: '首页' },
  {
    key: 'manage',
    label: '管理',
    children: [
      { key: 'users', label: '用户管理' },
      { key: 'roles', label: '角色管理' },
    ],
  },
];

const menuCode = ref(`
  <Menu v-model="menuActive" :items="menuItems" class="max-w-56" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { menuActive, menuItems, menuCode };
</script>
