import { ref } from 'vue';

/** 沙盒预置片段：每个片段自包含，需要状态的通过 scope 工厂按需创建 */
export interface Sample {
  key: string;
  title: string;
  code: string;
  scope?: () => Record<string, unknown>;
}

export const samples: Sample[] = [
  {
    key: 'button',
    title: 'Button 按钮',
    code: `
  <div class="flex flex-wrap items-center gap-3">
    <Button>次要按钮</Button>
    <Button type="primary">主要按钮</Button>
    <Button type="danger">危险按钮</Button>
    <Button disabled>禁用状态</Button>
  </div>
`,
  },
  {
    key: 'input',
    title: 'Input 输入框',
    code: `
  <div class="flex w-72 flex-col gap-3">
    <Input v-model="text" placeholder="输入点什么" clearable />
    <Input invalid placeholder="校验失败" />
    <Input disabled placeholder="禁用状态" />
    <p class="text-sm text-cumquat-text-muted">当前值：{{ text }}</p>
  </div>
`,
    scope: () => ({ text: ref('') }),
  },
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
    key: 'select',
    title: 'Select 选择器',
    code: `
  <div class="flex items-center gap-3">
    <Select v-model="value" :options="options" placeholder="请选择水果" clearable class="w-56" />
    <span class="text-sm text-cumquat-text-muted">已选：{{ value ?? '无' }}</span>
  </div>
`,
    scope: () => ({
      value: ref<string | null>(null),
      options: [
        { value: 'apple', label: '苹果' },
        { value: 'banana', label: '香蕉' },
        { value: 'cherry', label: '樱桃', disabled: true },
      ],
    }),
  },
  {
    key: 'table',
    title: 'Table 远程数据',
    code: `
  <Table :columns="columns" :fetch="loadRows" />
`,
    scope: () => ({
      columns: [
        { key: 'name', title: '名称' },
        { key: 'age', title: '年龄', align: 'center' },
      ],
      loadRows: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          list: Array.from({ length: 8 }, (_, i) => ({ name: `用户 ${i + 1}`, age: 18 + i })),
          total: 8,
        };
      },
    }),
  },
  {
    key: 'message',
    title: 'Message 消息提示',
    code: `
  <div class="flex flex-col gap-3">
    <Message type="info">这是一条信息提示</Message>
    <Message v-model="visible" type="success" closable>操作成功，点击关闭</Message>
    <Button size="sm" @click="visible = true">重新显示</Button>
  </div>
`,
    scope: () => ({ visible: ref(true) }),
  },
];
