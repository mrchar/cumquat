<script setup lang="ts">
import { ref } from 'vue';
import {
  AutoComplete,
  Button,
  Checkbox,
  CodeCard,
  Form,
  FormItem,
  Input,
  InputNumber,
  Mention,
  Radio,
  RadioGroup,
  Rate,
  Segmented,
  Select,
  Slider,
  Switch,
  TreeSelect,
} from '@cumquat/components';
import type { Fetch, FetchQuery } from '@cumquat/components';

const selectValue = ref<string | number | null>('bj');
const selectOptions = [
  { label: '北京', value: 'bj' },
  { label: '上海', value: 'sh' },
  { label: '广州', value: 'gz' },
];
const checked = ref(false);
const radioValue = ref<string | number | null>('a');
const switchOn = ref(true);
const numValue = ref(5);
const rateValue = ref(3);
const segmentedValue = ref<string | number>('day');
const autoCompleteValue = ref('');
const mentionValue = ref('请通知 @');
const treeSelectValue = ref<string | null>(null);
const sliderValue = ref(40);

const segmentedOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
];

const mentionMembers = ['Amber', 'Bolt', 'Cyan', 'Della'];

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

const selectCode = `
  <Select v-model="selectValue" :options="selectOptions" class="w-48" />
`;

/* 远程搜索 Select：输入关键词防抖 300ms 自动重取 */
const remoteSelectValue = ref<string | number | null>(null);
const remoteUserOptions = Array.from({ length: 30 }, (_, index) => ({
  label: `用户 ${String(index + 1).padStart(2, '0')}`,
  value: index + 1,
}));

const fetchRemoteUsers: Fetch<{ label: string; value: number }> = async (query: FetchQuery) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const keyword = query.keyword?.trim() ?? '';
  return keyword
    ? remoteUserOptions.filter((option) => option.label.includes(keyword))
    : remoteUserOptions;
};

const remoteSelectCode = `
  <Select v-model="remoteSelectValue" :fetch="fetchRemoteUsers" filterable class="w-48" />
`;

const checkboxCode = `
  <Checkbox v-model="checked" label="同意服务协议" />
  <Checkbox label="半选态" :indeterminate="true" />
  <Checkbox label="禁用态" :disabled="true" />
`;

const radioCode = `
  <RadioGroup v-model="radioValue">
    <Radio value="a" label="选项A" />
    <Radio value="b" label="选项B" />
    <Radio value="c" label="选项C" />
  </RadioGroup>
`;

const switchCode = `
  <Switch v-model="switchOn" />
  <Switch :model-value="false" />
  <Switch :model-value="true" :disabled="true" />
`;

const inputNumberCode = `
  <InputNumber v-model="numValue" :min="0" :max="10" />
`;

const rateCode = `
  <Rate v-model="rateValue" />
  <Rate :model-value="0" :disabled="true" />
`;

const segmentedCode = `
  <Segmented v-model="segmentedValue" :options="segmentedOptions" />
`;

const autoCompleteCode = `
  <AutoComplete
    v-model="autoCompleteValue"
    :options="['苹果', '香蕉', '樱桃', '葡萄', '柠檬']"
    placeholder="输入水果名"
    class="w-64"
  />
`;

const mentionCode = `
  <Mention v-model="mentionValue" :members="mentionMembers" class="w-72" />
`;

const formCode = `
  <Form class="max-w-sm">
    <FormItem label="用户名" required>
      <Input placeholder="请输入用户名" />
    </FormItem>
    <FormItem label="邮箱" error="邮箱格式不正确">
      <Input placeholder="name@example.com" invalid />
    </FormItem>
    <FormItem label="备注">
      <Input placeholder="选填" />
    </FormItem>
    <Button type="primary" block>提交</Button>
  </Form>
`;

const treeSelectCode = `
  <TreeSelect v-model="treeSelectValue" :nodes="treeNodes" class="w-56" />
`;

const sliderCode = `
  <Slider v-model="sliderValue" :min="0" :max="100" />
`;
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="select" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Select 选择器</h2>
      <CodeCard title="基础选择" :code="selectCode">
        <div class="flex flex-wrap items-center gap-3">
          <Select v-model="selectValue" :options="selectOptions" class="w-48" />
          <span class="text-sm text-cumquat-text-muted"
            >选中值：{{ selectValue ?? '（未选）' }}</span
          >
        </div>
      </CodeCard>
      <CodeCard title="远程搜索（fetch，防抖 300ms）" :code="remoteSelectCode">
        <div class="flex flex-wrap items-center gap-3">
          <Select
            v-model="remoteSelectValue"
            :fetch="fetchRemoteUsers"
            filterable
            placeholder="输入「用户」试试"
            class="w-48"
          />
          <span class="text-sm text-cumquat-text-muted"
            >选中值：{{ remoteSelectValue ?? '（未选）' }}</span
          >
        </div>
      </CodeCard>
    </section>

    <section id="checkbox" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Checkbox 多选框</h2>
      <CodeCard title="勾选、半选与禁用" :code="checkboxCode">
        <div class="flex flex-wrap items-center gap-6">
          <Checkbox v-model="checked" label="同意服务协议" />
          <Checkbox label="半选态" :indeterminate="true" />
          <Checkbox label="禁用态" :disabled="true" />
        </div>
      </CodeCard>
    </section>

    <section id="radio" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Radio 单选框</h2>
      <CodeCard title="单选组" :code="radioCode">
        <div class="flex flex-wrap items-center gap-6">
          <RadioGroup v-model="radioValue">
            <Radio value="a" label="选项A" />
            <Radio value="b" label="选项B" />
            <Radio value="c" label="选项C" />
          </RadioGroup>
          <span class="text-sm text-cumquat-text-muted"
            >选中值：{{ radioValue ?? '（未选）' }}</span
          >
        </div>
      </CodeCard>
    </section>

    <section id="switch" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Switch 开关</h2>
      <CodeCard title="开关状态" :code="switchCode">
        <div class="flex flex-wrap items-center gap-6">
          <Switch v-model="switchOn" />
          <Switch :model-value="false" />
          <Switch :model-value="true" :disabled="true" />
          <span class="text-sm text-cumquat-text-muted"
            >状态：{{ switchOn ? '开启' : '关闭' }}</span
          >
        </div>
      </CodeCard>
    </section>

    <section id="input-number" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">InputNumber 数字输入框</h2>
      <CodeCard title="范围限制" :code="inputNumberCode">
        <div class="flex flex-wrap items-center gap-3">
          <InputNumber v-model="numValue" :min="0" :max="10" />
          <span class="text-sm text-cumquat-text-muted">当前值：{{ numValue }}</span>
        </div>
      </CodeCard>
    </section>

    <section id="rate" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Rate 评分</h2>
      <CodeCard title="评分与禁用" :code="rateCode">
        <div class="flex flex-wrap items-center gap-6">
          <Rate v-model="rateValue" />
          <Rate :model-value="0" :disabled="true" />
          <span class="text-sm text-cumquat-text-muted">评分：{{ rateValue }}</span>
        </div>
      </CodeCard>
    </section>

    <section id="segmented" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Segmented 分段控制器</h2>
      <CodeCard title="分段切换" :code="segmentedCode">
        <div class="flex flex-wrap items-center gap-3">
          <Segmented v-model="segmentedValue" :options="segmentedOptions" />
          <span class="text-sm text-cumquat-text-muted">选中：{{ segmentedValue }}</span>
        </div>
      </CodeCard>
    </section>

    <section id="auto-complete" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">AutoComplete 自动完成</h2>
      <CodeCard title="输入建议" :code="autoCompleteCode">
        <div>
          <AutoComplete
            v-model="autoCompleteValue"
            :options="['苹果', '香蕉', '樱桃', '葡萄', '柠檬']"
            placeholder="输入水果名"
            class="w-64"
          />
        </div>
      </CodeCard>
    </section>

    <section id="mention" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Mention 提及</h2>
      <CodeCard title="@ 成员提及" :code="mentionCode">
        <div>
          <Mention v-model="mentionValue" :members="mentionMembers" class="w-72" />
          <p class="mt-2 text-sm text-cumquat-text-muted">输入 @ 唤起成员候选列表。</p>
        </div>
      </CodeCard>
    </section>

    <section id="form" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Form 表单</h2>
      <CodeCard title="表单与校验" :code="formCode">
        <div>
          <Form class="max-w-sm">
            <FormItem label="用户名" required>
              <Input placeholder="请输入用户名" />
            </FormItem>
            <FormItem label="邮箱" error="邮箱格式不正确">
              <Input placeholder="name@example.com" invalid />
            </FormItem>
            <FormItem label="备注">
              <Input placeholder="选填" />
            </FormItem>
            <Button type="primary" block>提交</Button>
          </Form>
        </div>
      </CodeCard>
    </section>

    <section id="tree-select" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">TreeSelect 树选择</h2>
      <CodeCard title="树形选择" :code="treeSelectCode">
        <div>
          <TreeSelect v-model="treeSelectValue" :nodes="treeNodes" class="w-56" />
        </div>
      </CodeCard>
    </section>

    <section id="slider" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Slider 滑块</h2>
      <CodeCard title="滑块取值" :code="sliderCode">
        <div class="flex flex-col gap-4">
          <Slider v-model="sliderValue" :min="0" :max="100" />
          <span class="text-sm text-cumquat-text-muted">当前值：{{ sliderValue }}</span>
        </div>
      </CodeCard>
    </section>
  </div>
</template>
