---
title: List 列表
---

# List 列表

通用列表，双模式工作：**数据驱动**（items / fetch / subscribe + 映射器）与**插槽编排**（List.Item 自由组合）。数据侧完整继承 fetch / subscribe / 四态渲染惯例，分页结果自动启用加载更多。

三件套结构：

- `List`：容器与数据接入，负责四态与分页
- `List.Item`：一条的容器，内容区 + 操作区（`#actions`）+ 附加区（`#extra`）
- `List.Item.Meta`：三段式头部（头像 + 标题 + 描述）

数据模式下每行的**渲染降级链**：

```
#item 插槽 > 内建 Meta（title / description / avatar 映射器驱动）> 原始值 String(item) 兜底
```

映射器为 `(item) => string` 函数而非静态值，对象不做字段魔法推断。

## 使用形态

| 场景 | 形态 |
| --- | --- |
| SFC 模板 | 导入 `List`、`ListItem`、`ListItemMeta` 直接使用 |
| 渲染函数 / JSX | 经 `List.Item`、`List.Item.Meta` 点号访问 |
| 全量注册 | `<c-list>` + `<c-list-item>` + `<c-list-item-meta>` |

## List

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| items | `unknown[]` | `[]` | 本地数据：对象或原始值均可 |
| data | `AsyncStateLike<unknown[]>` | - | 远程数据状态：传入后 items 由其派生 |
| fetch | `Fetch<unknown>` | - | 统一远程请求：返回数组即普通列表，返回 `{ list, total }` 自动启用加载更多 |
| subscribe | `SubscribeHandler<unknown[]>` | - | 订阅数据；优先级 subscribe > fetch > data > items |
| header | `string` | `''` | 头部文本；`#header` 插槽优先 |
| footer | `string` | `''` | 底部文本；`#footer` 插槽优先 |
| emptyText | `string` | `'暂无数据'` | 空态文案 |
| title | `(item) => string` | - | 标题映射器 |
| description | `(item) => string` | - | 描述映射器 |
| avatar | `(item) => string` | - | 头像地址映射器 |
| rowKey | `(item, index) => string \| number` | - | 列表项唯一键 |
| defaultExpandAll | `boolean` | `false` | 默认展开全部含 `children` 的列表项（缺省收起） |
| height | `string` | `''` | 最大高度：设置后容器内部滚动，触底自动加载下一页 |
| pageSize | `number` | `20` | 每页条数（分页结果时生效） |

插槽：`#item { item, index, depth, hasChildren, expanded, toggle }` 数据模式下整行接管、`#header`、`#footer`。

事件：`expand { item, expanded }` 列表项折叠状态变化。

**children 树形数据**：列表项含 `children` 数组时自动渲染为可折叠的子列表——子项按层级缩进，箭头展开/收起；`defaultExpandAll` 控制初始展开，`expand` 事件回传每次切换。子项同样走渲染降级链；`#item` 插槽接管时通过 `depth` / `hasChildren` / `expanded` / `toggle` 插槽参数自行编排缩进与箭头。

## List.Item

纯布局容器，无 props。

插槽：默认（内容）、`#actions` 操作区、`#extra` 附加区。

## List.Item.Meta

| Prop | 类型 | 说明 |
| --- | --- | --- |
| avatar | `string` | 头像图片地址 |
| title | `string` | 标题文本 |
| description | `string` | 描述文本 |

插槽：`#avatar`、`#title`、`#description` 同名覆盖对应区域。

## 交互演示

### 映射器驱动的数据列表

<CodeCard v-model:code="mapperCode" editable title="映射器驱动">
  <LiveDemo :code="mapperCode" :scope="mapperScope" />
</CodeCard>

### 分页触底加载

fetch 返回 `{ list, total }` 即自动启用「加载更多」；设置 `height` 后容器内部滚动，触底自动加载下一页。

<CodeCard v-model:code="pagedCode" editable title="分页触底">
  <LiveDemo :code="pagedCode" :scope="pagedScope" />
</CodeCard>

### children 树形折叠

列表项含 `children` 数组即渲染为可折叠子列表：子项按层级缩进、箭头切换展开收起。

<CodeCard v-model:code="treeCode" editable title="children 折叠">
  <LiveDemo :code="treeCode" :scope="treeScope" />
</CodeCard>

### 插槽编排

数据源缺席时 List 渲染默认插槽，由 List.Item + List.Item.Meta 自由组合。

<CodeCard v-model:code="slotCode" editable title="插槽编排">
  <LiveDemo :code="slotCode" :scope="slotScope" />
</CodeCard>

<script setup lang="ts">
import { ref } from 'vue';

const users = [
  {
    id: 1,
    name: '金橘',
    sign: '前端工程师 · 杭州',
    avatar:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20kumquat%20orange%20fruit%20cartoon%20avatar%20flat%20illustration&image_size=square',
  },
  {
    id: 2,
    name: '青柠',
    sign: '产品设计师 · 上海',
    avatar:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green%20lime%20fruit%20cartoon%20avatar%20flat%20illustration&image_size=square',
  },
];

const mapperCode = ref(`
  <List
    :items="users"
    :title="(item) => item.name"
    :description="(item) => item.sign"
    :avatar="(item) => item.avatar"
    header="团队成员"
    class="max-w-xl"
  />
`);

/** LiveDemo 渲染作用域 */
const mapperScope = { users, mapperCode };

const pagedCode = ref(`
  <List
    :fetch="fetchUsers"
    :title="(item) => item.name"
    :description="(item) => item.sign"
    height="240px"
    :page-size="4"
    class="max-w-xl"
  />
`);

/** 模拟远程分页接口 */
const fetchUsers = async ({ pagination }: { pagination?: { currentPage?: number } }) => {
  const all = Array.from({ length: 11 }, (_, index) => ({
    name: `成员 ${index + 1}`,
    sign: `成员签名 ${index + 1}`,
  }));
  const page = pagination?.currentPage ?? 1;
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { list: all.slice((page - 1) * 4, page * 4), total: all.length };
};

const pagedScope = { fetchUsers, pagedCode };

const treeCode = ref(`
  <List
    :items="departments"
    :title="(item) => item.name"
    :description="(item) => item.sign"
    default-expand-all
    class="max-w-xl"
  />
`);

/** 部门树：children 数组表达层级 */
const departments = [
  {
    id: 1,
    name: '研发部',
    sign: '12 人',
    children: [
      { id: 11, name: '前端组', sign: '4 人' },
      { id: 12, name: '后端组', sign: '5 人' },
    ],
  },
  {
    id: 2,
    name: '设计部',
    sign: '6 人',
    children: [{ id: 21, name: '视觉组', sign: '3 人' }],
  },
  { id: 3, name: '市场部', sign: '8 人' },
];

const treeScope = { departments, treeCode };

const slotCode = ref(`
  <List class="max-w-xl">
    <List.Item>
      <List.Item.Meta title="金橘" description="前端工程师 · 杭州">
        <template #avatar><Avatar text="金" /></template>
      </List.Item.Meta>
      <template #actions><Tag>在线</Tag></template>
      <template #extra><Avatar text="金" shape="square" /></template>
    </List.Item>
    <List.Item>
      <List.Item.Meta title="青柠" description="产品设计师 · 上海">
        <template #avatar><Avatar text="青" /></template>
      </List.Item.Meta>
      <template #actions><Tag>会议中</Tag></template>
    </List.Item>
  </List>
`);

const slotScope = { slotCode };
</script>
