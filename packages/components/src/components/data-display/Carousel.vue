<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFetchResource, useIntervalFn } from '@cumquat/composables';
import type { Fetch } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 轮播项标题（演示用）；也可用 slot 自定义内容 */
    items?: string[];
    modelValue?: number;
    height?: string;
    /** 自动播放 */
    autoplay?: boolean;
    /** 播放间隔（ms） */
    interval?: number;
    /** 悬停暂停 */
    pauseOnHover?: boolean;
    /** 循环切换 */
    loop?: boolean;
    /** 统一远程请求：挂载即拉取轮播项，返回数组或 { list, total } */
    fetch?: Fetch<string>;
  }>(),
  {
    items: () => [],
    modelValue: undefined,
    height: '14rem',
    autoplay: false,
    interval: 3000,
    pauseOnHover: true,
    loop: true,
    fetch: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [index: number];
  change: [index: number, previous: number];
}>();

/* ---------------- fetch：挂载即拉轮播项 ---------------- */
const { enabled: fetchEnabled, state: fetchState } = useFetchResource<string[]>(() => props.fetch, {
  getQuery: () => ({}),
  initialData: [] as string[],
});

const sourceItems = computed<string[]>(() =>
  fetchEnabled.value ? (fetchState.value?.data ?? []) : props.items,
);
const remoteLoading = computed(() => fetchState.value?.status === 'pending');
const remoteError = computed(() =>
  fetchState.value?.status === 'error' ? fetchState.value.error : undefined,
);

const count = computed(() => sourceItems.value.length || (fetchEnabled.value ? 0 : 3));

/** 最近一次提交索引（受控 prop 不回写时按钮仍可连续切换） */
const baseIndex = ref(props.modelValue ?? 0);
watch(
  () => props.modelValue,
  (next) => {
    if (next !== undefined) baseIndex.value = next;
  },
);

function commit(next: number) {
  const previous = baseIndex.value;
  if (next === previous) return;
  baseIndex.value = next;
  emit('update:modelValue', next);
  emit('change', next, previous);
}

function goTo(next: number) {
  if (props.loop) {
    commit((next + count.value) % count.value);
  } else {
    commit(Math.min(count.value - 1, Math.max(0, next)));
  }
}

function prev() {
  goTo(baseIndex.value - 1);
}

function next() {
  goTo(baseIndex.value + 1);
}

/* ---------- 自动播放 / 悬停暂停 ---------- */
const hovering = ref(false);

const {
  isActive: playing,
  pause,
  resume,
} = useIntervalFn(() => next(), props.interval, { immediate: false });

function syncPlayback() {
  if (props.autoplay && !(props.pauseOnHover && hovering.value)) resume(props.interval);
  else pause();
}

watch(() => [props.autoplay, props.pauseOnHover && hovering.value], syncPlayback, {
  immediate: true,
});

function onMouseEnter() {
  hovering.value = true;
  if (props.pauseOnHover && props.autoplay) pause();
}

function onMouseLeave() {
  hovering.value = false;
  if (props.autoplay) resume(props.interval);
}
</script>

<template>
  <div
    class="cumquat-carousel"
    :style="{ height }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <Transition name="cumquat-fade" mode="out-in">
      <div
        v-if="fetchEnabled && remoteLoading && sourceItems.length === 0"
        key="state-pending"
        class="cumquat-carousel__state cq-state--pending"
      >
        加载中…
      </div>
      <div
        v-else-if="fetchEnabled && remoteError && sourceItems.length === 0"
        key="state-error"
        class="cumquat-carousel__state cq-state--error"
      >
        加载失败
        <button type="button" class="cumquat-carousel__retry" @click="fetchState?.retry?.()">
          重试
        </button>
      </div>
      <div
        v-else-if="fetchEnabled && sourceItems.length === 0"
        key="state-empty"
        class="cumquat-carousel__state"
      >
        暂无数据
      </div>
      <div v-else :key="baseIndex" class="cumquat-carousel__slide">
        <slot :index="baseIndex">
          <span class="cumquat-carousel__slide-text">{{
            sourceItems[baseIndex] ?? `Slide ${baseIndex + 1}`
          }}</span>
        </slot>
      </div>
    </Transition>

    <button
      type="button"
      aria-label="上一张"
      class="cumquat-carousel__prev"
      :disabled="!loop && baseIndex === 0"
      @click="prev"
    >
      <svg
        class="cumquat-carousel__arrow-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
    <button
      type="button"
      aria-label="下一张"
      class="cumquat-carousel__next"
      :disabled="!loop && baseIndex === count - 1"
      @click="next"
    >
      <svg
        class="cumquat-carousel__arrow-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>

    <div class="cumquat-carousel__indicators">
      <button
        v-for="i in count"
        :key="i"
        type="button"
        :aria-label="`第 ${i} 张`"
        :aria-current="i - 1 === baseIndex"
        class="cumquat-carousel__indicator"
        :class="i - 1 === baseIndex ? 'cumquat-carousel__indicator--active' : ''"
        @click="goTo(i - 1)"
      />
    </div>

    <span v-if="playing" class="cumquat-carousel__playing" aria-hidden="true" />
  </div>
</template>
