<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 轮播项标题（演示用）；也可用 slot 自定义内容 */
    items?: string[];
    height?: string;
  }>(),
  { items: () => [], height: '14rem' },
);

const index = defineModel<number>({ default: 0 });

const count = computed(() => props.items.length || 3);

function prev() {
  index.value = (index.value - 1 + count.value) % count.value;
}

function next() {
  index.value = (index.value + 1) % count.value;
}
</script>

<template>
  <div
    class="cumquat-carousel group relative w-full overflow-hidden rounded-cumquat border border-cumquat-border bg-cumquat-surface-2"
    :style="{ height }"
  >
    <Transition name="cumquat-fade" mode="out-in">
      <div
        :key="index"
        class="cumquat-carousel__slide flex size-full flex-col items-center justify-center gap-2 bg-cumquat-surface-3"
      >
        <slot :index="index">
          <span class="text-2xl font-semibold text-cumquat-text-muted">{{
            items[index] ?? `Slide ${index + 1}`
          }}</span>
        </slot>
      </div>
    </Transition>

    <button
      type="button"
      aria-label="上一张"
      class="cumquat-carousel__prev absolute top-1/2 left-3 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-cumquat-surface/80 text-cumquat-text shadow transition-opacity hover:bg-cumquat-surface"
      @click="prev"
    >
      <svg
        class="size-5"
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
      class="cumquat-carousel__next absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-cumquat-surface/80 text-cumquat-text shadow transition-opacity hover:bg-cumquat-surface"
      @click="next"
    >
      <svg
        class="size-5"
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

    <div
      class="cumquat-carousel__indicators absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2"
    >
      <button
        v-for="i in count"
        :key="i"
        type="button"
        :aria-label="`第 ${i} 张`"
        class="cumquat-carousel__indicator h-2 cursor-pointer rounded-full transition-all"
        :class="
          i - 1 === index
            ? 'w-6 bg-cumquat-accent'
            : 'w-2 bg-cumquat-border-strong hover:bg-cumquat-text-muted'
        "
        @click="index = i - 1"
      />
    </div>
  </div>
</template>
