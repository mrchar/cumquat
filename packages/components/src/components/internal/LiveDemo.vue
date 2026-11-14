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
import * as Vue from 'vue';
import { parse, compileScript } from '@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js';
import { transform as sucraseTransform } from 'sucrase';
import * as Composables from '@cumquat/composables';
import { components } from '../../registry';

const props = withDefaults(
  defineProps<{
    /** 完整 SFC 代码（含 <script setup> 与 <template>），或纯模板片段 */
    code: string;
    /** 纯模板模式下的渲染作用域：模板中可访问的变量与函数（SFC 模式下忽略） */
    scope?: Record<string, unknown>;
  }>(),
  { scope: () => ({}) },
);

/** 组件注册表作为运行时模板的局部组件映射，
 * 使片段中的 <Table> 等标签无需手动注册即可解析。 */
const libraryComponents = components as Record<string, Component>;

/** 主入口命名空间：组件 + 组合函数扁平导出，与 @mrchar/cumquat 主包语义一致 */
const libraryNamespace = {
  ...Composables,
  ...libraryComponents,
  components: libraryComponents,
  composables: Composables,
};

/** 模块解析表：将 SFC 中的 import 来源映射到运行时可用的对象。
 * - 'vue' → Vue 运行时（含 ref、reactive、compile 等）
 * - 主入口 → 组件与组合函数的扁平命名空间（推荐）
 * - 子路径 → 仅保留给显式使用具体路径的场景 */
const modules: Record<string, unknown> = {
  vue: Vue,
  '@mrchar/cumquat/components': libraryComponents,
  '@cumquat/components': libraryComponents,
  '@mrchar/cumquat/composables': Composables,
  '@cumquat/composables': Composables,
  '@mrchar/cumquat': libraryNamespace,
  '@cumquat': libraryNamespace,
};

/** 判断 code 是否为完整 SFC（包含 <script> 块） */
function isSFC(code: string): boolean {
  return /<script\b/.test(code);
}

/** 将编译后脚本中的 import 语句转换为从 __modules 解构，
 * 并把 export default 改为 return，以便用 new Function 执行。 */
function transformCompiledScript(
  code: string,
  moduleMap: Record<string, unknown>,
): string {
  const importsReplaced = code.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?\s*/g,
    (_, names: string, mod: string) => {
      if (!(mod in moduleMap)) return '';
      const destructured = names
        .split(',')
        .map((n: string) => {
          n = n.trim();
          if (!n) return '';
          const parts = n.split(/\s+as\s+/);
          return parts.length === 2
            ? `${parts[0].trim()}: ${parts[1].trim()}`
            : n;
        })
        .filter(Boolean)
        .join(', ');
      return `const { ${destructured} } = __modules[${JSON.stringify(mod)}];\n`;
    },
  );
  return importsReplaced.replace(/export\s+default\s+/, 'return ');
}

/** 编译完整 SFC 并返回可挂载的组件定义 */
function compileSFC(code: string): Component {
  const { descriptor, errors } = parse(code, { filename: 'LiveDemo.vue' });
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }
  const compiled = compileScript(descriptor, {
    id: 'live-demo',
    inlineTemplate: true,
  });
  // compileScript 不剥离 TypeScript 类型（含生成的渲染函数参数 : any），
  // 需用 sucrase 转译为纯 JS，否则 new Function 执行时报 "Unexpected token ':'"。
  const isTs = descriptor.script?.lang === 'ts' || descriptor.scriptSetup?.lang === 'ts';
  const stripped = isTs
    ? sucraseTransform(compiled.content, { transforms: ['typescript'], production: true }).code
    : compiled.content;
  const transformed = transformCompiledScript(stripped, modules);
  // eslint-disable-next-line no-new-func
  const factory = new Function('__modules', transformed);
  return factory(modules) as Component;
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
  try {
    if (isSFC(code)) {
      const comp = compileSFC(code);
      compileError.value = null;
      return comp;
    }
    // 纯模板模式：向后兼容，使用 scope 作为 setup 返回值
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
    return defineComponent({
      name: 'LiveDemoInstance',
      components: libraryComponents,
      setup: () => props.scope,
      template: code,
    });
  } catch (error) {
    compileError.value = error instanceof Error ? error.message : String(error);
    return null;
  }
});

onErrorCaptured((error) => {
  runtimeError.value = error instanceof Error ? error.message : String(error);
  return false;
});
</script>

<template>
  <div class="cumquat-live-demo">
    <!-- code 作为 key：每次修改强制重挂载，片段内部状态回到初始 -->
    <component :is="dynamicComponent" v-if="dynamicComponent" :key="renderCode" />
    <p
      v-if="compileError"
      class="cq-state--error rounded-md border border-cumquat-border bg-cumquat-surface-2 px-4 py-3 text-sm text-cumquat-danger"
    >
      编译失败：{{ compileError }}
    </p>
    <p
      v-if="runtimeError"
      class="cq-state--error rounded-md border border-cumquat-border bg-cumquat-surface-2 px-4 py-3 text-sm text-cumquat-danger"
    >
      渲染出错：{{ runtimeError }}
    </p>
  </div>
</template>
