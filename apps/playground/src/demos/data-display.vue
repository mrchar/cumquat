<script setup lang="ts">
import { ref } from 'vue';
import {
  Button,
  Carousel,
  Cascader,
  Collapse,
  Descriptions,
  Image,
  Pagination,
  Progress,
  Steps,
  Table,
  Tabs,
  Timeline,
  Tree,
} from '@cumquat/components';

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
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="table" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Table 表格</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Table :columns="columns" :rows="rows" />
      </div>
    </section>

    <section id="pagination" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Pagination 分页</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <Pagination v-model="page" :total="50" :page-size="10" />
        <span class="text-sm text-cumquat-text-muted">当前第 {{ page }} 页</span>
      </div>
    </section>

    <section id="tabs" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tabs 标签页</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Tabs v-model="tab" :tabs="tabs" />
        <p class="mt-3 text-sm text-cumquat-text-muted">当前标签：{{ tab }}</p>
      </div>
    </section>

    <section id="collapse" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Collapse 折叠面板</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Collapse :items="collapseItems" />
      </div>
    </section>

    <section id="tree" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tree 树形控件</h2>
      <div
        class="flex flex-wrap items-start gap-6 rounded-cumquat border border-cumquat-border p-4"
      >
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
    </section>

    <section id="cascader" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Cascader 级联选择</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <Cascader v-model="cascaderValue" :options="cascadeOptions" class="w-56" />
        <span class="text-sm text-cumquat-text-muted"
          >选中值：{{ cascaderValue ?? '（未选）' }}</span
        >
      </div>
    </section>

    <section id="timeline" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Timeline 时间轴</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Timeline :items="timelineItems" />
      </div>
    </section>

    <section id="steps" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Steps 步骤条</h2>
      <div class="flex flex-col gap-4 rounded-cumquat border border-cumquat-border p-4">
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
    </section>

    <section id="descriptions" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Descriptions 描述列表</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Descriptions title="项目信息" :items="descriptionItems" :bordered="true" :column="2" />
      </div>
    </section>

    <section id="carousel" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Carousel 轮播</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Carousel v-model="carouselIndex" :items="carouselItems" />
      </div>
    </section>

    <section id="progress" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Progress 进度条</h2>
      <div class="flex flex-col gap-3 rounded-cumquat border border-cumquat-border p-4">
        <Progress :value="30" />
        <Progress :value="66" />
        <Progress :value="100" />
      </div>
    </section>

    <section id="image" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Image 图片</h2>
      <div
        class="flex flex-wrap items-start gap-4 rounded-cumquat border border-cumquat-border p-4"
      >
        <Image :src="demoImage" alt="演示图片" :rounded="true" class="w-60" />
        <Image
          src="https://invalid.cumquat.dev/none.png"
          alt="加载失败"
          :rounded="true"
          class="w-60"
        />
      </div>
    </section>
  </div>
</template>
