<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  useDismiss,
  useFloating,
  useFormField,
  useListboxNavigation,
  useOpen,
  useSelectModel,
} from '@cumquat/composables';
import type { AsyncStateLike } from '@cumquat/composables';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** 分组标题：相同 group 的选项在面板内聚合 */
  group?: string;
}

type V = string | number;

const props = withDefaults(
  defineProps<{
    modelValue?: V | V[] | null;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    multiple?: boolean;
    filterable?: boolean;
    clearable?: boolean;
    name?: string;
    /** 远程数据状态：传入后优先于 options 渲染，组件自身不发请求 */
    state?: AsyncStateLike<SelectOption[]>;
  }>(),
  {
    options: () => [],
    placeholder: '请选择',
    disabled: false,
    multiple: false,
    filterable: false,
    clearable: false,
    name: undefined,
    state: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: V | V[] | null];
  change: [value: V | V[] | null];
}>();

/** 远程四态归一：优先消费外部 AsyncStateLike */
const remoteLoading = computed(() => props.state?.status === 'pending');
const remoteError = computed(() =>
  props.state?.status === 'error' ? props.state.error : undefined,
);
const allOptions = computed<SelectOption[]>(() => {
  if (props.state && props.state.status !== 'pending') return props.state.data ?? [];
  if (props.state) return props.state.data ?? [];
  return props.options;
});

const field = useFormField<V | V[] | null>({
  name: props.name,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => emit('update:modelValue', value),
  disabled: () => props.disabled,
});

const select = useSelectModel<V, string>({
  options: allOptions,
  multiple: props.multiple,
  filterable: props.filterable,
  modelValue: field.value,
  // select 自身不持有写回调，写入统一回灌 field（由其决定受控 emit / 内部落值）
  onChange: (next) => field.handleChange(next as V | V[] | null),
});

watch(select.model, (value) => emit('change', value));

const { isOpen, open, close, toggle } = useOpen();

watch(isOpen, (next) => {
  if (next) {
    nav.reset();
    void nextTick().then(() => {
      dropdownWidth.value = referenceRef.value?.getBoundingClientRect().width ?? 0;
      update();
    });
  } else {
    select.setKeyword('');
  }
});

const { referenceRef, floatingRef, floatingStyles, update } = useFloating({
  placement: 'bottom-start',
  gap: 6,
  open: isOpen,
});

const dropdownWidth = ref(0);
const dropdownStyle = computed(() => ({
  ...floatingStyles.value,
  width: dropdownWidth.value ? `${dropdownWidth.value}px` : undefined,
}));

useDismiss({
  isOpen,
  reference: referenceRef,
  floating: floatingRef,
  onDismiss: close,
});

const nav = useListboxNavigation({
  count: computed(() => select.filteredOptions.value.length),
  isItemDisabled: (index) => !!select.filteredOptions.value[index]?.disabled,
  onSelect: (index) => {
    const option = select.filteredOptions.value[index];
    if (option) pick(option);
  },
});

/** 分组组织：保序输出 { title, options }[] */
const groupedOptions = computed(() => {
  const groups: Array<{ title?: string; options: SelectOption[] }> = [];
  const indexMap = new Map<string, number>();
  for (const option of select.filteredOptions.value) {
    const title = option.group;
    if (!title) {
      groups.push({ options: [option] });
      continue;
    }
    const existing = indexMap.get(title);
    if (existing === undefined) {
      indexMap.set(title, groups.length);
      groups.push({ title, options: [option] });
    } else {
      groups[existing].options.push(option);
    }
  }
  return groups;
});

function onTriggerClick() {
  if (field.disabled.value) return;
  toggle();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (field.disabled.value) return;
  if ((event.key === 'ArrowDown' || event.key === 'Enter') && !isOpen.value) {
    event.preventDefault();
    open();
    nav.moveFirst();
    return;
  }
  if (isOpen.value) nav.onKeydown(event);
}

function pick(option: SelectOption) {
  const changed = select.selectOption(option);
  if (!changed) return;
  field.handleChange(select.model.value);
  if (!props.multiple) close();
}

function removeTag(event: MouseEvent, option: SelectOption) {
  event.stopPropagation();
  select.removeValue(option.value);
  field.handleChange(select.model.value);
}

function clearSelection(event: MouseEvent) {
  event.stopPropagation();
  select.clear();
  field.handleChange(select.model.value);
}
</script>

<template>
  <div class="cumquat-select" :class="field.error.value ? 'cumquat-select--invalid' : ''">
    <button
      ref="referenceRef"
      type="button"
      class="cumquat-select__trigger"
      :class="[
        isOpen ? 'cumquat-select__trigger--open' : '',
        multiple && select.selectedOptions.value.length ? 'cumquat-select__trigger--multiple' : '',
      ]"
      :disabled="field.disabled.value"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
    >
      <template v-if="multiple">
        <span
          v-if="select.selectedOptions.value.length === 0"
          class="cumquat-select__value cumquat-select__value--placeholder"
        >
          {{ placeholder }}
        </span>
        <span
          v-for="option in select.selectedOptions.value"
          :key="option.value"
          class="cumquat-select__tag"
        >
          {{ option.label }}
          <i
            v-if="!field.disabled.value"
            role="button"
            aria-label="移除"
            class="cumquat-select__tag-close"
            @click="removeTag($event, option)"
          />
        </span>
      </template>
      <input
        v-else-if="filterable"
        v-model="select.keyword.value"
        class="cumquat-select__search"
        :placeholder="String(select.selectedLabel.value ?? placeholder)"
        :disabled="field.disabled.value"
      />
      <span
        v-else
        class="cumquat-select__value"
        :class="
          select.selectedLabel.value === undefined ? 'cumquat-select__value--placeholder' : ''
        "
      >
        {{ select.selectedLabel.value ?? placeholder }}
      </span>

      <i
        v-if="clearable && select.model.value !== null && !field.disabled.value"
        role="button"
        aria-label="清空"
        class="cumquat-select__clear"
        @click="clearSelection"
      />
      <svg
        class="cumquat-select__arrow"
        :class="isOpen ? 'cumquat-select__arrow--open' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <Transition name="cumquat-fade">
      <ul
        v-if="isOpen"
        ref="floatingRef"
        role="listbox"
        class="cumquat-select__dropdown"
        :style="dropdownStyle"
        @keydown="nav.onKeydown"
      >
        <template
          v-for="(group, groupIndex) in groupedOptions"
          :key="group.title ?? `flat-${groupIndex}`"
        >
          <li v-if="group.title" class="cumquat-select__group-title">{{ group.title }}</li>
          <li
            v-for="option in group.options"
            :key="option.value"
            role="option"
            :aria-selected="select.isSelected(option)"
            class="cumquat-select__option"
            :class="[
              option.disabled
                ? 'cumquat-select__option--disabled'
                : select.isSelected(option)
                  ? 'cumquat-select__option--active'
                  : '',
              nav.activeIndex.value === select.filteredOptions.value.indexOf(option)
                ? 'cumquat-select__option--hover'
                : '',
            ]"
            :aria-disabled="option.disabled || undefined"
            @click="pick(option)"
            @mousemove="nav.setActiveIndex(select.filteredOptions.value.indexOf(option))"
          >
            {{ option.label }}
          </li>
        </template>

        <li v-if="remoteLoading" class="cumquat-select__loading cq-state--pending">加载中…</li>
        <li v-else-if="remoteError" class="cumquat-select__error cq-state--error">加载失败</li>
        <li v-else-if="select.filteredOptions.value.length === 0" class="cumquat-select__empty">
          暂无数据
        </li>
      </ul>
    </Transition>
  </div>
</template>
