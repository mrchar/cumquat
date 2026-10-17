<script setup lang="ts">
import { ref } from 'vue';
import {
  Button,
  CodeCard,
  Dialog,
  Drawer,
  Dropdown,
  Popconfirm,
  Popover,
  Tooltip,
} from '@cumquat/components';

const dialogOpen = ref(false);
const drawerOpen = ref(false);

const dialogCode = `
  <Button type="primary" @click="dialogOpen = true">打开对话框</Button>
  <Dialog v-model:open="dialogOpen" title="确认操作">
    <p class="text-sm text-cumquat-text-muted">
      这是一段对话框内容，点击遮罩或取消按钮可关闭。
    </p>
    <div class="mt-5 flex justify-end gap-2">
      <Button @click="dialogOpen = false">取消</Button>
      <Button type="primary" @click="dialogOpen = false">确认</Button>
    </div>
  </Dialog>
`;

const drawerCode = `
  <Button type="primary" @click="drawerOpen = true">打开抽屉</Button>
  <Drawer v-model:open="drawerOpen" title="侧边抽屉">
    <p class="text-sm text-cumquat-text-muted">抽屉内容区，点击关闭按钮或遮罩可收起。</p>
  </Drawer>
`;

const dropdownCode = `
  <Dropdown>
    <template #trigger>
      <Button>操作菜单</Button>
    </template>
    <div class="flex flex-col py-1 text-sm">
      <span class="cursor-pointer px-4 py-1.5 transition-colors hover:bg-cumquat-surface-2"
        >编辑</span
      >
      <span class="cursor-pointer px-4 py-1.5 transition-colors hover:bg-cumquat-surface-2"
        >复制</span
      >
      <span
        class="cursor-pointer px-4 py-1.5 text-cumquat-danger transition-colors hover:bg-cumquat-danger-soft"
        >删除</span
      >
    </div>
  </Dropdown>
`;

const popoverCode = `
  <Popover title="气泡标题">
    <template #trigger>
      <Button>点击弹出</Button>
    </template>
    <p class="text-sm text-cumquat-text-muted">这里是气泡卡片的内容区域。</p>
  </Popover>
`;

const popconfirmCode = `
  <Popconfirm>
    <template #trigger>
      <Button type="danger">删除</Button>
    </template>
  </Popconfirm>
`;

const tooltipCode = `
  <Tooltip content="悬停时显示提示文字">
    <Button>悬停查看</Button>
  </Tooltip>
  <Tooltip content="顶部提示">
    <span class="cursor-help border-b border-dashed border-cumquat-border-strong text-sm"
      >文字锚点</span
    >
  </Tooltip>
`;
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="dialog" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Dialog 对话框</h2>
      <CodeCard title="受控对话框" :code="dialogCode">
        <div>
          <Button type="primary" @click="dialogOpen = true">打开对话框</Button>
          <Dialog v-model:open="dialogOpen" title="确认操作">
            <p class="text-sm text-cumquat-text-muted">
              这是一段对话框内容，点击遮罩或取消按钮可关闭。
            </p>
            <div class="mt-5 flex justify-end gap-2">
              <Button @click="dialogOpen = false">取消</Button>
              <Button type="primary" @click="dialogOpen = false">确认</Button>
            </div>
          </Dialog>
        </div>
      </CodeCard>
    </section>

    <section id="drawer" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Drawer 抽屉</h2>
      <CodeCard title="侧边抽屉" :code="drawerCode">
        <div>
          <Button type="primary" @click="drawerOpen = true">打开抽屉</Button>
          <Drawer v-model:open="drawerOpen" title="侧边抽屉">
            <p class="text-sm text-cumquat-text-muted">抽屉内容区，点击关闭按钮或遮罩可收起。</p>
          </Drawer>
        </div>
      </CodeCard>
    </section>

    <section id="dropdown" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Dropdown 下拉菜单</h2>
      <CodeCard title="下拉菜单" :code="dropdownCode">
        <div class="flex flex-wrap items-center gap-6">
          <Dropdown>
            <template #trigger>
              <Button>操作菜单</Button>
            </template>
            <div class="flex flex-col py-1 text-sm">
              <span class="cursor-pointer px-4 py-1.5 transition-colors hover:bg-cumquat-surface-2"
                >编辑</span
              >
              <span class="cursor-pointer px-4 py-1.5 transition-colors hover:bg-cumquat-surface-2"
                >复制</span
              >
              <span
                class="cursor-pointer px-4 py-1.5 text-cumquat-danger transition-colors hover:bg-cumquat-danger-soft"
                >删除</span
              >
            </div>
          </Dropdown>
        </div>
      </CodeCard>
    </section>

    <section id="popover" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Popover 气泡卡片</h2>
      <CodeCard title="气泡卡片" :code="popoverCode">
        <div class="flex flex-wrap items-center gap-6">
          <Popover title="气泡标题">
            <template #trigger>
              <Button>点击弹出</Button>
            </template>
            <p class="text-sm text-cumquat-text-muted">这里是气泡卡片的内容区域。</p>
          </Popover>
        </div>
      </CodeCard>
    </section>

    <section id="popconfirm" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Popconfirm 气泡确认框</h2>
      <CodeCard title="气泡确认" :code="popconfirmCode">
        <div class="flex flex-wrap items-center gap-6">
          <Popconfirm>
            <template #trigger>
              <Button type="danger">删除</Button>
            </template>
          </Popconfirm>
        </div>
      </CodeCard>
    </section>

    <section id="tooltip" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tooltip 文字提示</h2>
      <CodeCard title="文字提示" :code="tooltipCode">
        <div class="flex flex-wrap items-center gap-6">
          <Tooltip content="悬停时显示提示文字">
            <Button>悬停查看</Button>
          </Tooltip>
          <Tooltip content="顶部提示">
            <span class="cursor-help border-b border-dashed border-cumquat-border-strong text-sm"
              >文字锚点</span
            >
          </Tooltip>
        </div>
      </CodeCard>
    </section>
  </div>
</template>
