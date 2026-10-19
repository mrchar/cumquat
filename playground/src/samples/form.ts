import { ref } from 'vue';
import type { Sample } from '../samples';

/** 表单控件 */
export const formSamples: Sample[] = [
  {
    key: 'select',
    title: 'Select 选择器（远程分页 + 多选）',
    code: `
  <div class="flex items-center gap-3">
    <Select
      v-model="value"
      multiple
      clearable
      filterable
      :fetch="loadFruits"
      :page-size="20"
      placeholder="请选择水果"
      class="w-72"
    />
    <span class="text-sm text-cumquat-text-muted">已选 {{ (value ?? []).length }} 项</span>
  </div>
`,
    scope: () => ({
      value: ref<string[]>([]),
      // 远程分页：滚动到面板底部自动取下一页，搜索词变化回到第 1 页
      loadFruits: async (query: {
        keyword?: string;
        pagination?: { currentPage: number; pageSize: number };
      }) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        // 共 160 条：滚动到底部逐页加载，累积到 100 条以上自动切换为虚拟滚动
        const all = Array.from({ length: 160 }, (_, i) => ({
          value: `f${i}`,
          label: `水果 ${i + 1}`,
        }));
        const matched = query.keyword ? all.filter((o) => o.label.includes(query.keyword!)) : all;
        const size = query.pagination?.pageSize ?? 10;
        const start = ((query.pagination?.currentPage ?? 1) - 1) * size;
        return { list: matched.slice(start, start + size), total: matched.length };
      },
    }),
  },
  {
    key: 'checkbox',
    title: 'Checkbox 复选框',
    code: `
  <div class="flex flex-col gap-3">
    <Checkbox v-model="a" label="接受用户协议" />
    <Checkbox v-model="b" label="订阅更新通知" />
    <Checkbox indeterminate label="半选态" />
    <Checkbox disabled label="禁用" />
  </div>
`,
    scope: () => ({ a: ref(true), b: ref(false) }),
  },
  {
    key: 'radio',
    title: 'Radio 单选框',
    code: `
  <div class="flex items-center gap-4">
    <Radio v-model="picked" value="a" label="选项 A" />
    <Radio v-model="picked" value="b" label="选项 B" />
    <Radio v-model="picked" value="c" label="选项 C" disabled />
  </div>
`,
    scope: () => ({ picked: ref('a') }),
  },
  {
    key: 'radio-group',
    title: 'RadioGroup 单选组',
    code: `
  <div class="flex flex-col gap-3">
    <RadioGroup v-model="plan">
      <Radio value="free" label="免费版" />
      <Radio value="pro" label="专业版" />
      <Radio value="team" label="团队版" />
    </RadioGroup>
    <p class="text-sm text-cumquat-text-muted">当前方案：{{ plan }}</p>
  </div>
`,
    scope: () => ({ plan: ref('pro') }),
  },
  {
    key: 'switch',
    title: 'Switch 开关',
    code: `
  <div class="flex items-center gap-6">
    <Switch v-model="on" label="接收推送" />
    <Switch v-model="off" label="默认关闭" />
    <Switch disabled label="禁用" />
  </div>
`,
    scope: () => ({ on: ref(true), off: ref(false) }),
  },
  {
    key: 'input-number',
    title: 'InputNumber 数字输入框',
    code: `
  <div class="flex w-64 flex-col gap-3">
    <InputNumber v-model="count" :min="0" :max="10" />
    <InputNumber v-model="price" :step="0.5" :precision="2" placeholder="金额" />
    <InputNumber :model-value="3" disabled />
  </div>
`,
    scope: () => ({ count: ref(2), price: ref<number | null>(null) }),
  },
  {
    key: 'rate',
    title: 'Rate 评分',
    code: `
  <div class="flex flex-col gap-3">
    <Rate v-model="score" allow-clear />
    <Rate v-model="half" allow-half />
    <Rate :model-value="4" readonly />
  </div>
`,
    scope: () => ({ score: ref(3), half: ref(2.5) }),
  },
  {
    key: 'segmented',
    title: 'Segmented 分段控制器',
    code: `
  <div class="flex flex-col gap-3">
    <Segmented v-model="view" :options="options" />
    <p class="text-sm text-cumquat-text-muted">当前：{{ view }}</p>
  </div>
`,
    scope: () => ({
      view: ref('day'),
      options: [
        { value: 'day', label: '日' },
        { value: 'week', label: '周' },
        { value: 'month', label: '月' },
      ],
    }),
  },
  {
    key: 'auto-complete',
    title: 'AutoComplete 自动完成',
    code: `
  <div class="w-64">
    <AutoComplete v-model="text" :options="candidates" placeholder="输入水果名" />
  </div>
`,
    scope: () => ({
      text: ref(''),
      candidates: ['apple', 'apricot', 'banana', 'cherry', 'grape', 'orange'],
    }),
  },
  {
    key: 'mention',
    title: 'Mention 提及',
    code: `
  <div class="w-80">
    <Mention v-model="content" :members="members" placeholder="输入 @ 提及成员" />
  </div>
`,
    scope: () => ({
      content: ref(''),
      members: ['alice', 'bob', 'carol', 'dave'],
    }),
  },
  {
    key: 'form',
    title: 'Form 表单',
    code: `
  <Form v-model="values" :rules="rules" class="w-80">
    <FormItem name="name" label="姓名" required>
      <Input v-model="values.name" placeholder="请输入姓名" />
    </FormItem>
    <FormItem name="email" label="邮箱">
      <Input v-model="values.email" placeholder="name@example.com" />
    </FormItem>
    <Button type="primary" native-type="submit">提交</Button>
  </Form>
`,
    scope: () => ({
      values: ref({ name: '', email: '' }),
      rules: {
        name: [{ required: true, message: '请输入姓名' }],
        email: [{ pattern: '^\\S+@\\S+$', message: '邮箱格式不正确' }],
      },
    }),
  },
  {
    key: 'form-item',
    title: 'FormItem 表单项',
    code: `
  <div class="flex w-80 flex-col gap-4">
    <FormItem label="独立标签">
      <Input placeholder="FormItem 可脱离 Form 单独使用" />
    </FormItem>
    <FormItem label="错误态" error="该字段校验未通过">
      <Input invalid />
    </FormItem>
  </div>
`,
  },
  {
    key: 'tree-select',
    title: 'TreeSelect 树选择',
    code: `
  <div class="w-64">
    <TreeSelect v-model="value" :nodes="tree" placeholder="选择节点" clearable />
  </div>
`,
    scope: () => ({
      value: ref<string | null>(null),
      tree: [
        {
          key: 'fruit',
          label: '水果',
          children: [
            { key: 'apple', label: '苹果' },
            { key: 'banana', label: '香蕉' },
          ],
        },
        { key: 'veg', label: '蔬菜', children: [{ key: 'carrot', label: '胡萝卜' }] },
      ],
    }),
  },
  {
    key: 'slider',
    title: 'Slider 滑块',
    code: `
  <div class="flex w-72 flex-col gap-6">
    <Slider v-model="single" :marks="[0, 50, 100]" />
    <Slider v-model="rangeValue" range />
    <Slider :model-value="30" disabled />
  </div>
`,
    scope: () => ({ single: ref(40), rangeValue: ref<[number, number]>([20, 60]) }),
  },
];
