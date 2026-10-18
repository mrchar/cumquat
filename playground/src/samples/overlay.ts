import { ref } from 'vue';
import type { Sample } from '../samples';

/** 浮层 */
export const overlaySamples: Sample[] = [
  {
    key: 'dialog',
    title: 'Dialog 对话框',
    code: `
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary" @click="open = true">打开对话框</Button>
    <Dialog v-model:open="open" title="提示">
      这是一段确认内容，点击确认后关闭。
    </Dialog>
  </div>
`,
    scope: () => ({ open: ref(false) }),
  },
  {
    key: 'drawer',
    title: 'Drawer 抽屉',
    code: `
  <div class="flex flex-wrap items-center gap-3">
    <Button @click="open = true">打开抽屉</Button>
    <Drawer v-model:open="open" title="详情" direction="right" size="320px">
      <p class="text-sm text-cumquat-text-muted">从右侧滑出的面板内容。</p>
    </Drawer>
  </div>
`,
    scope: () => ({ open: ref(false) }),
  },
  {
    key: 'dropdown',
    title: 'Dropdown 下拉菜单',
    code: `
  <div class="flex items-center gap-4">
    <Dropdown :items="items" @select="onSelect">
      <Button>操作菜单</Button>
    </Dropdown>
    <Dropdown :items="items" trigger="hover">
      <Button>悬停展开</Button>
    </Dropdown>
    <span class="text-sm text-cumquat-text-muted">最近选择：{{ last }}</span>
  </div>
`,
    scope: () => {
      const last = ref('无');
      return {
        items: [
          { key: 'edit', label: '编辑' },
          { key: 'share', label: '分享' },
          { key: 'delete', label: '删除' },
        ],
        last,
        onSelect: (item: { label: string }) => {
          last.value = item.label;
        },
      };
    },
  },
  {
    key: 'popover',
    title: 'Popover 气泡卡片',
    code: `
  <div class="flex items-center gap-4">
    <Popover title="卡片标题" trigger="click">
      <Button>点击展开</Button>
      <template #content>
        <p class="max-w-48 text-sm text-cumquat-text-muted">气泡卡片内容，支持富文本。</p>
      </template>
    </Popover>
    <Popover title="悬停触发" trigger="hover">
      <Button>悬停展开</Button>
      <template #content>
        <p class="max-w-48 text-sm text-cumquat-text-muted">鼠标移入展开，移出关闭。</p>
      </template>
    </Popover>
  </div>
`,
  },
  {
    key: 'popconfirm',
    title: 'Popconfirm 气泡确认',
    code: `
  <Popconfirm text="确定删除该记录吗？" :action="onConfirm">
    <Button type="danger">删除</Button>
  </Popconfirm>
`,
    scope: () => ({
      onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
      },
    }),
  },
  {
    key: 'tooltip',
    title: 'Tooltip 文字提示',
    code: `
  <div class="flex items-center gap-4">
    <Tooltip content="这是一段提示文字">
      <Button>悬停我</Button>
    </Tooltip>
    <Tooltip content="出现在上方" placement="top">
      <Button>上方提示</Button>
    </Tooltip>
  </div>
`,
  },
];
