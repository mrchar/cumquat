<script setup lang="ts">
import { ref } from 'vue';
import {
  Affix,
  Anchor,
  BackTop,
  Breadcrumb,
  Button,
  Calendar,
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
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="breadcrumb" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Breadcrumb 面包屑</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Breadcrumb :items="breadcrumbItems" />
      </div>
    </section>

    <section id="menu" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Menu 导航菜单</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Menu v-model="menuActive" :items="menuItems" class="max-w-56" />
      </div>
    </section>

    <section id="anchor" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Anchor 锚点</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Anchor :items="anchorItems" />
      </div>
    </section>

    <section id="back-top" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">BackTop 回到顶部</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <BackTop />
        <span class="text-sm text-cumquat-text-muted">点击按钮返回页面顶部。</span>
      </div>
    </section>

    <section id="affix" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Affix 固钉</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Affix :top="16">
          <div
            class="rounded-cumquat border border-cumquat-border bg-cumquat-surface-2 px-4 py-2 text-sm"
          >
            吸顶内容（滚动页面时吸附在顶部）
          </div>
        </Affix>
      </div>
    </section>

    <section id="float-button" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">FloatButton 悬浮按钮</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <FloatButton :actions="floatActions" />
        <p class="mt-2 text-sm text-cumquat-text-muted">点击主按钮展开动作组。</p>
      </div>
    </section>

    <section id="datepicker" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">DatePicker 日期选择框</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <DatePicker v-model="dateValue" />
        <span class="text-sm text-cumquat-text-muted">
          选中：{{
            dateValue != null ? `2026-10-${String(dateValue).padStart(2, '0')}` : '（未选）'
          }}
        </span>
      </div>
    </section>

    <section id="timepicker" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">TimePicker 时间选择框</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <TimePicker />
      </div>
    </section>

    <section id="calendar" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Calendar 日历</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Calendar class="max-w-xl" />
      </div>
    </section>

    <section id="colorpicker" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">ColorPicker 颜色选择器</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <ColorPicker v-model="colorValue" />
        <span class="text-sm text-cumquat-text-muted">当前颜色：{{ colorValue }}</span>
      </div>
    </section>

    <section id="transfer" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Transfer 穿梭框</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Transfer v-model="transferTarget" :data="transferData" />
      </div>
    </section>

    <section id="virtual-list" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">VirtualList 虚拟列表</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <VirtualList :items="virtualItems" class="max-w-sm" />
      </div>
    </section>

    <section id="layout" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Layout 布局</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
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
    </section>

    <section id="grid" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Grid 栅格</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
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
    </section>

    <section id="space" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Space 间距</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Space>
          <Button>按钮一</Button>
          <Button>按钮二</Button>
          <Button>按钮三</Button>
        </Space>
      </div>
    </section>
  </div>
</template>
