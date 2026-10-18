<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  actionErrorText,
  useActionState,
  useFloating,
  useListboxNavigation,
  useOpen,
  useTimeModel,
} from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string;
    disabled?: boolean;
    /** 小时列步进，默认 1 */
    hourStep?: number;
    /** 分钟列步进，默认 5 */
    minuteStep?: number;
    /** 是否展示秒列 */
    useSeconds?: boolean;
    minTime?: string;
    maxTime?: string;
    /** 确定动作：执行期间禁用面板按钮，失败保持面板打开并展示错误提示 */
    action?: ActionLike;
    /** 动作失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    modelValue: undefined,
    placeholder: '选择时间',
    disabled: false,
    hourStep: 1,
    minuteStep: 5,
    useSeconds: false,
    minTime: undefined,
    maxTime: undefined,
    action: undefined,
    errorText: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  change: [value: string | null];
  /** 确定动作失败（reject 或返回值导出错误）时触发 */
  actionError: [error: unknown];
}>();

const { isOpen, toggle, close } = useOpen();

const time = useTimeModel({
  modelValue: props.modelValue !== undefined ? props.modelValue : undefined,
  hourStep: props.hourStep,
  minuteStep: props.minuteStep,
  useSeconds: props.useSeconds,
  minTime: props.minTime,
  maxTime: props.maxTime,
  onChange: (value) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: 'bottom-start',
  gap: 6,
  open: isOpen,
});

/** 当前键盘聚焦的列：hour / minute / second */
type Unit = 'hour' | 'minute' | 'second';
const activeUnit = ref<Unit>('hour');

const nav = useListboxNavigation({
  count: computed(() =>
    activeUnit.value === 'hour'
      ? time.hourColumn.value.length
      : activeUnit.value === 'minute'
        ? time.minuteColumn.value.length
        : time.secondColumn.value.length,
  ),
  isItemDisabled: (index) =>
    activeUnit.value === 'hour'
      ? !!time.hourColumn.value[index]?.disabled
      : activeUnit.value === 'minute'
        ? !!time.minuteColumn.value[index]?.disabled
        : !!time.secondColumn.value[index]?.disabled,
  onSelect: (index) => {
    if (activeUnit.value === 'hour') time.setHour(time.hourColumn.value[index].value);
    else if (activeUnit.value === 'minute') time.setMinute(time.minuteColumn.value[index].value);
    else time.setSecond(time.secondColumn.value[index].value);
  },
});

function focusUnit(unit: Unit, event: KeyboardEvent) {
  activeUnit.value = unit;
  nav.onKeydown(event);
}

const {
  pending: actionPending,
  error: actionError,
  run: runAction,
} = useActionState(() => props.action?.(), { onError: (err) => emit('actionError', err) });

const errorText = computed(() =>
  actionError.value != null ? actionErrorText(actionError.value, props.errorText) : null,
);

/** 确定：有 action 时执行并等待，成功才提交并关闭；失败保持面板打开并展示错误条 */
async function confirm() {
  if (actionPending.value) return;
  if (props.action) {
    await runAction();
    if (actionError.value != null) return;
  }
  const value = time.confirm();
  emit('update:modelValue', value);
  emit('change', value);
  close();
}

function cancel() {
  close();
}

const displayText = computed(() => time.displayText.value);
</script>

<template>
  <div class="cumquat-time-picker">
    <button
      ref="referenceRef"
      type="button"
      class="cumquat-time-picker__trigger"
      :class="isOpen ? 'cumquat-time-picker__trigger--open' : ''"
      :disabled="disabled"
      @click="toggle()"
    >
      <span
        :class="
          displayText
            ? 'cumquat-time-picker__value--selected'
            : 'cumquat-time-picker__value--placeholder'
        "
      >
        {{ displayText || placeholder }}
      </span>
      <svg
        class="cumquat-time-picker__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    </button>

    <Transition name="cumquat-fade">
      <div
        v-if="isOpen"
        ref="floatingRef"
        class="cumquat-time-picker__panel"
        :style="floatingStyles"
      >
        <div class="cumquat-time-picker__columns">
          <ul class="cumquat-time-picker__hours" @keydown="focusUnit('hour', $event)">
            <li
              v-for="item in time.hourColumn.value"
              :key="`h-${item.value}`"
              class="cumquat-time-picker__hour"
              :class="[
                item.value === time.hour.value
                  ? 'cumquat-time-picker__hour--selected'
                  : 'cumquat-time-picker__hour--default',
                item.disabled ? 'cumquat-time-picker__hour--disabled' : '',
              ]"
              @click="!item.disabled && time.setHour(item.value)"
            >
              {{ item.label }} 时
            </li>
          </ul>
          <ul class="cumquat-time-picker__minutes" @keydown="focusUnit('minute', $event)">
            <li
              v-for="item in time.minuteColumn.value"
              :key="`m-${item.value}`"
              class="cumquat-time-picker__minute"
              :class="[
                item.value === time.minute.value
                  ? 'cumquat-time-picker__minute--selected'
                  : 'cumquat-time-picker__minute--default',
                item.disabled ? 'cumquat-time-picker__minute--disabled' : '',
              ]"
              @click="!item.disabled && time.setMinute(item.value)"
            >
              {{ item.label }} 分
            </li>
          </ul>
          <ul
            v-if="useSeconds"
            class="cumquat-time-picker__seconds"
            @keydown="focusUnit('second', $event)"
          >
            <li
              v-for="item in time.secondColumn.value"
              :key="`s-${item.value}`"
              class="cumquat-time-picker__second"
              :class="
                item.value === time.second.value
                  ? 'cumquat-time-picker__second--selected'
                  : 'cumquat-time-picker__second--default'
              "
              @click="!item.disabled && time.setSecond(item.value)"
            >
              {{ item.label }} 秒
            </li>
          </ul>
        </div>
        <p v-if="errorText" class="cumquat-time-picker__error cq-state--error" role="alert">
          {{ errorText }}
        </p>
        <div class="cumquat-time-picker__actions">
          <button
            type="button"
            class="cumquat-time-picker__cancel"
            :disabled="actionPending"
            @click="cancel"
          >
            取消
          </button>
          <button
            type="button"
            class="cumquat-time-picker__confirm"
            :disabled="actionPending"
            @click="confirm"
          >
            {{ actionPending ? '处理中…' : '确定' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
