<script setup lang="ts">
import { ref } from 'vue';
import {
  Affix,
  Anchor,
  BackTop,
  Breadcrumb,
  Button,
  Calendar,
  CodeCard,
  ColorPicker,
  DatePicker,
  FloatButton,
  Grid,
  Layout,
  Menu,
  Space,
  TimePicker,
  Transfer,
  VirtualList,
} from '@cumquat/components';
import type { Fetch, FetchQuery } from '@cumquat/components';

const menuActive = ref('home');
const dateValue = ref<number | null>(null);
const colorValue = ref('#4f46e5');
const transferTarget = ref<string[]>([]);

const breadcrumbItems = [
  { label: '首页', href: '#breadcrumb' },
  { label: '组件', href: '#breadcrumb' },
  { label: '面包屑' },
];

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

const anchorItems = [
  { href: '#breadcrumb', label: 'Breadcrumb' },
  { href: '#menu', label: 'Menu' },
  { href: '#calendar', label: 'Calendar' },
];

const transferData = [
  { key: '1', label: '条目一' },
  { key: '2', label: '条目二' },
  { key: '3', label: '条目三' },
];

const virtualItems = Array.from({ length: 50 }, (_, index) => `虚拟列表条目 ${index + 1}`);

const floatActions = [
  { key: 'edit', label: '编' },
  { key: 'share', label: '享' },
  { key: 'fav', label: '藏' },
];

const breadcrumbCode = `
  <Breadcrumb :items="breadcrumbItems" />
`;

const menuCode = `
  <Menu v-model="menuActive" :items="menuItems" class="max-w-56" />
`;

const anchorCode = `
  <Anchor :items="anchorItems" />
`;

const backTopCode = `
  <BackTop />
`;

const affixCode = `
  <Affix :top="16">
    <div
      class="rounded-cumquat border border-cumquat-border bg-cumquat-surface-2 px-4 py-2 text-sm"
    >
      吸顶内容（滚动页面时吸附在顶部）
    </div>
  </Affix>
`;

const floatButtonCode = `
  <FloatButton :actions="floatActions" />
`;

const datePickerCode = `
  <DatePicker v-model="dateValue" />
`;

const timePickerCode = `
  <TimePicker />
`;

const calendarCode = `
  <Calendar class="max-w-xl" />
`;

const colorPickerCode = `
  <ColorPicker v-model="colorValue" />
`;

const transferCode = `
  <Transfer v-model="transferTarget" :data="transferData" />
`;

const virtualListCode = `
  <VirtualList :items="virtualItems" class="max-w-sm" />
`;

/* 远程虚拟列表：触底自动请求下一页（每页 20 条）并累积，共 87 条 */
const fetchVirtualItems: Fetch<string> = async (query: FetchQuery) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const currentPage = query.pagination?.currentPage ?? 1;
  const pageSize = query.pagination?.pageSize ?? 20;
  const total = 87;
  const list = Array.from(
    { length: Math.min(pageSize, total - (currentPage - 1) * pageSize) },
    (_, index) => `远程条目 ${(currentPage - 1) * pageSize + index + 1}`,
  );
  return { list, total };
};

const remoteVirtualListCode = `
  <VirtualList :fetch="fetchVirtualItems" class="max-w-sm" />
`;

const layoutCode = `
  <Layout class="overflow-hidden rounded-cumquat border border-cumquat-border">
    <div class="flex h-10 items-center bg-cumquat-surface-3 px-4 text-sm">Header</div>
    <div class="flex min-h-28">
      <div class="w-32 bg-cumquat-surface-2 px-4 py-3 text-sm text-cumquat-text-muted">
        Aside
      </div>
      <div class="flex-1 px-4 py-3 text-sm">Content</div>
    </div>
  </Layout>
`;

const gridCode = `
  <Grid :cols="3">
    <div
      class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
    >
      1
    </div>
    <div
      class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
    >
      2
    </div>
    <div
      class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
    >
      3
    </div>
  </Grid>
`;

const spaceCode = `
  <Space>
    <Button>按钮一</Button>
    <Button>按钮二</Button>
    <Button>按钮三</Button>
  </Space>
`;
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="breadcrumb" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Breadcrumb 面包屑</h2>
      <CodeCard title="基础面包屑" :code="breadcrumbCode">
        <div>
          <Breadcrumb :items="breadcrumbItems" />
        </div>
      </CodeCard>
    </section>

    <section id="menu" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Menu 导航菜单</h2>
      <CodeCard title="导航菜单" :code="menuCode">
        <div>
          <Menu v-model="menuActive" :items="menuItems" class="max-w-56" />
        </div>
      </CodeCard>
    </section>

    <section id="anchor" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Anchor 锚点</h2>
      <CodeCard title="锚点导航" :code="anchorCode">
        <div>
          <Anchor :items="anchorItems" />
        </div>
      </CodeCard>
    </section>

    <section id="back-top" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">BackTop 回到顶部</h2>
      <CodeCard title="回到顶部" :code="backTopCode">
        <div class="flex flex-wrap items-center gap-3">
          <BackTop />
          <span class="text-sm text-cumquat-text-muted">点击按钮返回页面顶部。</span>
        </div>
      </CodeCard>
    </section>

    <section id="affix" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Affix 固钉</h2>
      <CodeCard title="吸顶固钉" :code="affixCode">
        <div>
          <Affix :top="16">
            <div
              class="rounded-cumquat border border-cumquat-border bg-cumquat-surface-2 px-4 py-2 text-sm"
            >
              吸顶内容（滚动页面时吸附在顶部）
            </div>
          </Affix>
        </div>
      </CodeCard>
    </section>

    <section id="float-button" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">FloatButton 悬浮按钮</h2>
      <CodeCard title="悬浮动作组" :code="floatButtonCode">
        <div>
          <FloatButton :actions="floatActions" />
          <p class="mt-2 text-sm text-cumquat-text-muted">点击主按钮展开动作组。</p>
        </div>
      </CodeCard>
    </section>

    <section id="datepicker" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">DatePicker 日期选择框</h2>
      <CodeCard title="日期选择" :code="datePickerCode">
        <div class="flex flex-wrap items-center gap-3">
          <DatePicker v-model="dateValue" />
          <span class="text-sm text-cumquat-text-muted">
            选中：{{
              dateValue != null ? `2026-10-${String(dateValue).padStart(2, '0')}` : '（未选）'
            }}
          </span>
        </div>
      </CodeCard>
    </section>

    <section id="timepicker" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">TimePicker 时间选择框</h2>
      <CodeCard title="时间选择" :code="timePickerCode">
        <div class="flex flex-wrap items-center gap-3">
          <TimePicker />
        </div>
      </CodeCard>
    </section>

    <section id="calendar" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Calendar 日历</h2>
      <CodeCard title="日历面板" :code="calendarCode">
        <div>
          <Calendar class="max-w-xl" />
        </div>
      </CodeCard>
    </section>

    <section id="colorpicker" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">ColorPicker 颜色选择器</h2>
      <CodeCard title="颜色选择" :code="colorPickerCode">
        <div class="flex flex-wrap items-center gap-3">
          <ColorPicker v-model="colorValue" />
          <span class="text-sm text-cumquat-text-muted">当前颜色：{{ colorValue }}</span>
        </div>
      </CodeCard>
    </section>

    <section id="transfer" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Transfer 穿梭框</h2>
      <CodeCard title="穿梭框" :code="transferCode">
        <div>
          <Transfer v-model="transferTarget" :data="transferData" />
        </div>
      </CodeCard>
    </section>

    <section id="virtual-list" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">VirtualList 虚拟列表</h2>
      <CodeCard title="虚拟滚动" :code="virtualListCode">
        <div>
          <VirtualList :items="virtualItems" class="max-w-sm" />
        </div>
      </CodeCard>
      <CodeCard title="远程触底分页（fetch，自动累积）" :code="remoteVirtualListCode">
        <div>
          <VirtualList :fetch="fetchVirtualItems" class="max-w-sm" />
        </div>
      </CodeCard>
    </section>

    <section id="layout" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Layout 布局</h2>
      <CodeCard title="经典布局" :code="layoutCode">
        <div>
          <Layout class="overflow-hidden rounded-cumquat border border-cumquat-border">
            <div class="flex h-10 items-center bg-cumquat-surface-3 px-4 text-sm">Header</div>
            <div class="flex min-h-28">
              <div class="w-32 bg-cumquat-surface-2 px-4 py-3 text-sm text-cumquat-text-muted">
                Aside
              </div>
              <div class="flex-1 px-4 py-3 text-sm">Content</div>
            </div>
          </Layout>
        </div>
      </CodeCard>
    </section>

    <section id="grid" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Grid 栅格</h2>
      <CodeCard title="栅格排列" :code="gridCode">
        <div>
          <Grid :cols="3">
            <div
              class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
            >
              1
            </div>
            <div
              class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
            >
              2
            </div>
            <div
              class="flex h-16 items-center justify-center rounded bg-cumquat-accent-soft text-sm text-cumquat-accent"
            >
              3
            </div>
          </Grid>
        </div>
      </CodeCard>
    </section>

    <section id="space" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Space 间距</h2>
      <CodeCard title="间距排列" :code="spaceCode">
        <div>
          <Space>
            <Button>按钮一</Button>
            <Button>按钮二</Button>
            <Button>按钮三</Button>
          </Space>
        </div>
      </CodeCard>
    </section>
  </div>
</template>
