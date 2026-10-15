<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    /** 预设色板 */
    presets?: string[];
  }>(),
  {
    presets: () => [
      '#4f46e5',
      '#0284c7',
      '#16a34a',
      '#d97706',
      '#dc2626',
      '#7c3aed',
      '#db2777',
      '#0d9488',
      '#525252',
      '#171717',
    ],
  },
);

const open = ref(false);
const model = defineModel<string>({ default: '#4f46e5' });

function pick(color: string) {
  model.value = color;
}
</script>

<template>
  <div class="cumquat-color-picker relative inline-block">
    <button
      type="button"
      class="cumquat-color-picker__trigger flex h-10 w-40 cursor-pointer items-center gap-2.5 rounded-cumquat border border-cumquat-border bg-cumquat-surface px-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20"
      :class="open ? 'border-cumquat-accent' : ''"
      @click="open = !open"
    >
      <span
        class="cumquat-color-picker__swatch size-5 rounded border border-cumquat-border"
        :style="{ backgroundColor: model }"
      />
      <span class="cumquat-color-picker__value font-mono text-xs text-cumquat-text uppercase">{{
        model
      }}</span>
    </button>

    <Transition name="cumquat-fade">
      <div
        v-if="open"
        class="cumquat-color-picker__panel absolute z-20 mt-1.5 w-64 rounded-cumquat border border-cumquat-border bg-cumquat-surface p-3 shadow-cumquat-overlay"
      >
        <!-- 饱和度/明度区块（渐变演示） -->
        <div
          class="cumquat-color-picker__area relative h-28 cursor-pointer rounded-cumquat"
          :style="{ backgroundColor: model }"
        >
          <span
            class="absolute inset-0 rounded-cumquat bg-gradient-to-r from-black/60 to-transparent"
          />
          <span
            class="absolute inset-0 rounded-cumquat bg-gradient-to-t from-white to-transparent"
          />
          <span
            class="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          />
        </div>

        <!-- 色相条 -->
        <div
          class="cumquat-color-picker__hue relative mt-3 h-2.5 cursor-pointer rounded-full bg-[linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
        >
          <span
            class="absolute top-1/2 left-1/3 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cumquat-surface shadow"
          />
        </div>

        <!-- 预设色板 -->
        <div class="cumquat-color-picker__presets mt-3 grid grid-cols-10 gap-1.5">
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            :aria-label="`选择颜色 ${preset}`"
            class="cumquat-color-picker__preset size-4.5 cursor-pointer rounded border transition-transform hover:scale-110"
            :class="
              preset === model
                ? 'border-cumquat-text ring-2 ring-cumquat-accent ring-offset-1'
                : 'border-cumquat-border'
            "
            :style="{ backgroundColor: preset }"
            @click="pick(preset)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
