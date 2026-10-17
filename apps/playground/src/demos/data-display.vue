<script setup lang="ts">
import { ref } from 'vue';
import { CodeCard } from '@cumquat/components';
import type { Fetch, FetchQuery } from '@cumquat/components';
import LiveDemo from '../components/LiveDemo.vue';

const page = ref(1);
const tab = ref('a');
const cascaderValue = ref<string | number | null>(null);
const treeChecked = ref<string[]>([]);
const currentStep = ref(1);
const carouselIndex = ref(0);

const columns = [
  { key: 'name', title: '姓名' },
  { key: 'role', title: '角色', align: 'center' },
  { key: 'status', title: '状态', align: 'right' },
];
const rows = [
  { name: 'Amber', role: '前端', status: '活跃' },
  { name: 'Bolt', role: '后端', status: '休假' },
  { name: 'Cyan', role: '设计', status: '活跃' },
];

const tabs = [
  { key: 'a', label: '标签一' },
  { key: 'b', label: '标签二' },
  { key: 'c', label: '标签三' },
];

const collapseItems = [
  { key: '1', title: '面板一', content: '面板一的内容。' },
  { key: '2', title: '面板二', content: '面板二的内容。' },
];

const treeNodes = [
  {
    key: 'p1',
    label: '父节点一',
    children: [
      { key: 'c1', label: '子节点一' },
      { key: 'c2', label: '子节点二' },
    ],
  },
  { key: 'p2', label: '父节点二' },
];

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

const timelineItems = [
  { key: '1', title: '创建项目', time: '10:00', description: '初始化仓库与脚手架' },
  {
    key: '2',
    title: '开发完成',
    time: '12:30',
    type: 'success' as const,
    description: '全部用例通过',
  },
  { key: '3', title: '发布上线', time: '15:00', description: '等待审核' },
];

const stepItems = [
  { key: '1', title: '填写信息' },
  { key: '2', title: '确认订单' },
  { key: '3', title: '完成支付' },
];

const descriptionItems = [
  { label: '名称', value: 'Cumquat' },
  { label: '版本', value: '0.1.0' },
  { label: '协议', value: 'MIT' },
  { label: '语言', value: 'TypeScript' },
];

const carouselItems = ['第一屏', '第二屏', '第三屏'];

const demoImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='140'><rect width='240' height='140' rx='8' fill='%234f46e5'/><circle cx='64' cy='70' r='30' fill='%23fbbf24' opacity='0.9'/><text x='112' y='78' font-size='20' font-family='sans-serif' fill='white'>Cumquat</text></svg>";

const tableCode = ref(`
  <Table :columns="columns" :rows="rows" />
`);

/* ----------------------------- 远程 fetch 示例 ----------------------------- */

interface RemoteUser {
  id: number;
  name: string;
  role: string;
  status: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const remoteColumns = [
  { key: 'name', title: '姓名', sortable: true },
  {
    key: 'role',
    title: '角色',
    align: 'center' as const,
    filters: [
      { label: '前端', value: '前端' },
      { label: '后端', value: '后端' },
      { label: '设计', value: '设计' },
    ],
  },
  { key: 'status', title: '状态', align: 'right' as const },
];

const allRemoteUsers: RemoteUser[] = Array.from({ length: 57 }, (_, index) => ({
  id: index + 1,
  name: `用户 ${String(index + 1).padStart(2, '0')}`,
  role: (['前端', '后端', '设计'] as const)[index % 3],
  status: index % 5 === 0 ? '休假' : '活跃',
}));

/** 置为 true 后下一次请求失败，用于演示错误态与重试 */
const failNextFetch = ref(false);

const fetchUsers: Fetch<RemoteUser> = async (query: FetchQuery) => {
  await delay(500);
  if (failNextFetch.value) {
    failNextFetch.value = false;
    throw new Error('模拟网络错误，请点击重试');
  }

  let list = [...allRemoteUsers];
  if (query.sorter?.order) {
    const factor = query.sorter.order === 'asc' ? 1 : -1;
    list.sort((a, b) => a.name.localeCompare(b.name, 'zh') * factor);
  }
  const roleFilter = (query.filters as { role?: Array<string | number> } | undefined)?.role;
  if (roleFilter?.length) {
    list = list.filter((user) => roleFilter.includes(user.role));
  }

  const currentPage = query.pagination?.currentPage ?? 1;
  const pageSize = query.pagination?.pageSize ?? 10;
  return {
    list: list.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    total: list.length,
  };
};

interface OrgNode {
  key: string;
  label: string;
  leaf?: boolean;
  children?: OrgNode[];
}

const fetchOrg: Fetch<OrgNode> = async (query: FetchQuery) => {
  await delay(400);
  const parentKey = (query.filters as { parentKey?: string } | undefined)?.parentKey;
  if (!parentKey) {
    // 根层：研发中心可继续展开，市场中心为叶子
    return [
      { key: 'rd', label: '研发中心' },
      { key: 'mk', label: '市场中心', leaf: true },
    ];
  }
  return [1, 2, 3].map((i) => ({
    key: `${parentKey}-${i}`,
    label: `${parentKey === 'rd' ? '研发' : '市场'}小组 ${i}`,
    leaf: true,
  }));
};

const remoteTableCode = ref(`
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <Button size="sm" @click="failNextFetch = true">模拟下一次请求失败</Button>
      <span class="text-sm text-cumquat-text-muted">
        绑定 fetch 后，翻页、点表头排序、角色筛选都会自动重新请求
      </span>
    </div>
    <Table :columns="remoteColumns" :fetch="fetchUsers" pagination :page-size="10" />
  </div>
`);

const remoteTreeCode = ref(`
  <Tree :fetch="fetchOrg" />
`);

const paginationCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Pagination v-model="page" :total="50" :page-size="10" />
    <span class="text-sm text-cumquat-text-muted">当前第 {{ page }} 页</span>
  </div>
`);

const tabsCode = ref(`
  <div class="flex flex-col gap-3">
    <Tabs v-model="tab" :tabs="tabs" />
    <p class="text-sm text-cumquat-text-muted">当前标签：{{ tab }}</p>
  </div>
`);

const collapseCode = ref(`
  <Collapse :items="collapseItems" />
`);

const treeCode = ref(`
  <div class="flex flex-wrap items-start gap-6">
    <Tree
      v-model:checked="treeChecked"
      :nodes="treeNodes"
      :default-expand-all="true"
      :checkable="true"
    />
    <span class="text-sm text-cumquat-text-muted"
      >勾选：{{ treeChecked.join('、') || '（无）' }}</span
    >
  </div>
`);

const cascaderCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Cascader v-model="cascaderValue" :options="cascadeOptions" class="w-56" />
    <span class="text-sm text-cumquat-text-muted"
      >选中值：{{ cascaderValue ?? '（未选）' }}</span
    >
  </div>
`);

const timelineCode = ref(`
  <Timeline :items="timelineItems" />
`);

const stepsCode = ref(`
  <div class="flex flex-col gap-4">
    <Steps :current="currentStep" :steps="stepItems" />
    <div class="flex gap-2">
      <Button size="sm" :disabled="currentStep <= 0" @click="currentStep--">上一步</Button>
      <Button
        size="sm"
        type="primary"
        :disabled="currentStep >= stepItems.length - 1"
        @click="currentStep++"
      >
        下一步
      </Button>
    </div>
  </div>
`);

const descriptionsCode = ref(`
  <Descriptions title="项目信息" :items="descriptionItems" :bordered="true" :column="2" />
`);

const carouselCode = ref(`
  <Carousel v-model="carouselIndex" :items="carouselItems" />
`);

const progressCode = ref(`
  <div class="flex flex-col gap-3">
    <Progress :value="30" />
    <Progress :value="66" />
    <Progress :value="100" />
  </div>
`);

const imageCode = ref(`
  <div class="flex flex-wrap items-start gap-4">
    <Image :src="demoImage" alt="演示图片" :rounded="true" class="w-60" />
    <Image
      src="https://invalid.cumquat.dev/none.png"
      alt="加载失败"
      :rounded="true"
      class="w-60"
    />
  </div>
`);

/** LiveDemo 渲染作用域：代码卡片模板中可访问的变量与函数 */
const demoScope = {
  page,
  tab,
  cascaderValue,
  treeChecked,
  currentStep,
  carouselIndex,
  columns,
  rows,
  tabs,
  collapseItems,
  treeNodes,
  cascadeOptions,
  timelineItems,
  stepItems,
  descriptionItems,
  carouselItems,
  demoImage,
  remoteColumns,
  fetchUsers,
  fetchOrg,
  failNextFetch,
};
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="table" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Table 表格</h2>
      <CodeCard v-model:code="tableCode" editable title="基础表格">
        <LiveDemo :code="tableCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="remote-fetch" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">远程数据 Fetch</h2>
      <CodeCard
        v-model:code="remoteTableCode"
        editable
        title="分页 / 排序 / 筛选自动重取（mock 500ms）"
      >
        <LiveDemo :code="remoteTableCode" :scope="demoScope" />
      </CodeCard>
      <CodeCard v-model:code="remoteTreeCode" editable title="懒加载树（展开节点才请求子级）">
        <LiveDemo :code="remoteTreeCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="pagination" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Pagination 分页</h2>
      <CodeCard v-model:code="paginationCode" editable title="分页联动">
        <LiveDemo :code="paginationCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="tabs" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tabs 标签页</h2>
      <CodeCard v-model:code="tabsCode" editable title="标签切换">
        <LiveDemo :code="tabsCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="collapse" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Collapse 折叠面板</h2>
      <CodeCard v-model:code="collapseCode" editable title="折叠面板">
        <LiveDemo :code="collapseCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="tree" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tree 树形控件</h2>
      <CodeCard v-model:code="treeCode" editable title="勾选树">
        <LiveDemo :code="treeCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="cascader" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Cascader 级联选择</h2>
      <CodeCard v-model:code="cascaderCode" editable title="级联选择">
        <LiveDemo :code="cascaderCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="timeline" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Timeline 时间轴</h2>
      <CodeCard v-model:code="timelineCode" editable title="时间轴">
        <LiveDemo :code="timelineCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="steps" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Steps 步骤条</h2>
      <CodeCard v-model:code="stepsCode" editable title="步骤条控制">
        <LiveDemo :code="stepsCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="descriptions" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Descriptions 描述列表</h2>
      <CodeCard v-model:code="descriptionsCode" editable title="描述列表">
        <LiveDemo :code="descriptionsCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="carousel" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Carousel 轮播</h2>
      <CodeCard v-model:code="carouselCode" editable title="轮播播放">
        <LiveDemo :code="carouselCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="progress" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Progress 进度条</h2>
      <CodeCard v-model:code="progressCode" editable title="进度展示">
        <LiveDemo :code="progressCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="image" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Image 图片</h2>
      <CodeCard v-model:code="imageCode" editable title="加载与失败兜底">
        <LiveDemo :code="imageCode" :scope="demoScope" />
      </CodeCard>
    </section>
  </div>
</template>
