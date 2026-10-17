<script setup lang="ts">
import {
  compile,
  computed,
  defineComponent,
  onErrorCaptured,
  ref,
  watch,
  type Component,
} from 'vue';
import * as Library from '@cumquat/components';

const props = withDefaults(
  defineProps<{
    /** 组件模板片段（Vue 模板语法），变化后自动重新渲染 */
    code: string;
    /** 渲染作用域：模板中可访问的变量与函数 */
    scope?: Record<string, unknown>;
  }>(),
  { scope: () => ({}) },
);

/**
 * 组件库具名导出作为运行时模板的局部组件映射，
 * 使演示代码中的 <Table> 等标签无需手动注册即可解析。
 */
const libraryComponents = Object.fromEntries(
  Object.entries(Library).filter(([, value]) => isComponentDefinition(value)),
) as Record<string, Component>;

function isComponentDefinition(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  return 'render' in value || 'setup' in value;
}

const renderCode = ref(props.code);
const compileError = ref<string | null>(null);
const runtimeError = ref<string | null>(null);

watch(
  () => props.code,
  (value) => {
    renderCode.value = value;
  },
);

const dynamicComponent = computed<Component | null>(() => {
  runtimeError.value = null;
  const code = renderCode.value.trim();
  if (!code) {
    compileError.value = null;
    return null;
  }
  let errorMessage: string | null = null;
  try {
    compile(code, {
      onError: (error) => {
        errorMessage ??= `${error.message}${error.loc ? `（第 ${error.loc.start.line} 行）` : ''}`;
      },
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }
  compileError.value = errorMessage;
  if (errorMessage) return null;
  const scope = props.scope;
  return defineComponent({
    name: 'LiveDemoInstance',
    components: libraryComponents,
    setup: () => scope,
    template: code,
  });
});

onErrorCaptured((error) => {
  runtimeError.value = error instanceof Error ? error.message : String(error);
  return false;
});
</script>

<template>
  <div class="cumquat-live-demo">
    <!-- code 作为 key：每次修改强制重挂载，演示内部状态回到初始 -->
    <component :is="dynamicComponent" v-if="dynamicComponent" :key="renderCode" />
    <p
      v-if="compileError"
      class="cq-state--error rounded-md border border-cumquat-border bg-cumquat-surface-2 px-4 py-3 text-sm text-cumquat-danger"
    >
      模板编译失败：{{ compileError }}
    </p>
    <p
      v-if="runtimeError"
      class="cq-state--error rounded-md border border-cumquat-border bg-cumquat-surface-2 px-4 py-3 text-sm text-cumquat-danger"
    >
      渲染出错：{{ runtimeError }}
    </p>
  </div>
</template>
