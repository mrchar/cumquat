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
  <div class="cumquat-carousel" :style="{ height }">
    <Transition name="cumquat-fade" mode="out-in">
      <div :key="index" class="cumquat-carousel__slide">
        <slot :index="index">
          <span class="cumquat-carousel__slide-text">{{
            items[index] ?? `Slide ${index + 1}`
          }}</span>
        </slot>
      </div>
    </Transition>

    <button type="button" aria-label="上一张" class="cumquat-carousel__prev" @click="prev">
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
    <button type="button" aria-label="下一张" class="cumquat-carousel__next" @click="next">
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
        class="cumquat-carousel__indicator"
        :class="i - 1 === index ? 'cumquat-carousel__indicator--active' : ''"
        @click="index = i - 1"
      />
    </div>
  </div>
</template>
