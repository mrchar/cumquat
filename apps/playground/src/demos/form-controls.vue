<script setup lang="ts">
import { ref } from 'vue';
import {
  AutoComplete,
  Button,
  Checkbox,
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
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="select" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Select 选择器</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <Select v-model="selectValue" :options="selectOptions" class="w-48" />
        <span class="text-sm text-cumquat-text-muted">选中值：{{ selectValue ?? '（未选）' }}</span>
      </div>
    </section>

    <section id="checkbox" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Checkbox 多选框</h2>
      <div
        class="flex flex-wrap items-center gap-6 rounded-cumquat border border-cumquat-border p-4"
      >
        <Checkbox v-model="checked" label="同意服务协议" />
        <Checkbox label="半选态" :indeterminate="true" />
        <Checkbox label="禁用态" :disabled="true" />
      </div>
    </section>

    <section id="radio" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Radio 单选框</h2>
      <div
        class="flex flex-wrap items-center gap-6 rounded-cumquat border border-cumquat-border p-4"
      >
        <RadioGroup v-model="radioValue">
          <Radio value="a" label="选项A" />
          <Radio value="b" label="选项B" />
          <Radio value="c" label="选项C" />
        </RadioGroup>
        <span class="text-sm text-cumquat-text-muted">选中值：{{ radioValue ?? '（未选）' }}</span>
      </div>
    </section>

    <section id="switch" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Switch 开关</h2>
      <div
        class="flex flex-wrap items-center gap-6 rounded-cumquat border border-cumquat-border p-4"
      >
        <Switch v-model="switchOn" />
        <Switch :model-value="false" />
        <Switch :model-value="true" :disabled="true" />
        <span class="text-sm text-cumquat-text-muted">状态：{{ switchOn ? '开启' : '关闭' }}</span>
      </div>
    </section>

    <section id="input-number" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">InputNumber 数字输入框</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <InputNumber v-model="numValue" :min="0" :max="10" />
        <span class="text-sm text-cumquat-text-muted">当前值：{{ numValue }}</span>
      </div>
    </section>

    <section id="rate" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Rate 评分</h2>
      <div
        class="flex flex-wrap items-center gap-6 rounded-cumquat border border-cumquat-border p-4"
      >
        <Rate v-model="rateValue" />
        <Rate :model-value="0" :disabled="true" />
        <span class="text-sm text-cumquat-text-muted">评分：{{ rateValue }}</span>
      </div>
    </section>

    <section id="segmented" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Segmented 分段控制器</h2>
      <div
        class="flex flex-wrap items-center gap-3 rounded-cumquat border border-cumquat-border p-4"
      >
        <Segmented v-model="segmentedValue" :options="segmentedOptions" />
        <span class="text-sm text-cumquat-text-muted">选中：{{ segmentedValue }}</span>
      </div>
    </section>

    <section id="auto-complete" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">AutoComplete 自动完成</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <AutoComplete
          v-model="autoCompleteValue"
          :options="['苹果', '香蕉', '樱桃', '葡萄', '柠檬']"
          placeholder="输入水果名"
          class="w-64"
        />
      </div>
    </section>

    <section id="mention" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Mention 提及</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <Mention v-model="mentionValue" :members="mentionMembers" class="w-72" />
        <p class="mt-2 text-sm text-cumquat-text-muted">输入 @ 唤起成员候选列表。</p>
      </div>
    </section>

    <section id="form" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Form 表单</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
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
    </section>

    <section id="tree-select" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">TreeSelect 树选择</h2>
      <div class="rounded-cumquat border border-cumquat-border p-4">
        <TreeSelect v-model="treeSelectValue" :nodes="treeNodes" class="w-56" />
      </div>
    </section>

    <section id="slider" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Slider 滑块</h2>
      <div class="flex flex-col gap-4 rounded-cumquat border border-cumquat-border p-4">
        <Slider v-model="sliderValue" :min="0" :max="100" />
        <span class="text-sm text-cumquat-text-muted">当前值：{{ sliderValue }}</span>
      </div>
    </section>
  </div>
</template>
