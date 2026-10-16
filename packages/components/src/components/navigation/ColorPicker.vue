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
  <div class="cumquat-color-picker">
    <button
      type="button"
      class="cumquat-color-picker__trigger"
      :class="open ? 'cumquat-color-picker__trigger--open' : ''"
      @click="open = !open"
    >
      <span class="cumquat-color-picker__swatch" :style="{ backgroundColor: model }" />
      <span class="cumquat-color-picker__value">{{ model }}</span>
    </button>

    <Transition name="cumquat-fade">
      <div v-if="open" class="cumquat-color-picker__panel">
        <!-- 饱和度/明度区块（渐变演示） -->
        <div class="cumquat-color-picker__area" :style="{ backgroundColor: model }">
          <span class="cumquat-color-picker__gradient-dark" />
          <span class="cumquat-color-picker__gradient-light" />
          <span class="cumquat-color-picker__thumb" />
        </div>

        <!-- 色相条 -->
        <div class="cumquat-color-picker__hue">
          <span class="cumquat-color-picker__hue-thumb" />
        </div>

        <!-- 预设色板 -->
        <div class="cumquat-color-picker__presets">
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            :aria-label="`选择颜色 ${preset}`"
            class="cumquat-color-picker__preset"
            :class="
              preset === model
                ? 'cumquat-color-picker__preset--selected'
                : 'cumquat-color-picker__preset--default'
            "
            :style="{ backgroundColor: preset }"
            @click="pick(preset)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
