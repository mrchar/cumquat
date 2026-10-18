/**
 * cumquat
 * 统一入口：按子包路径名聚合导出，保持各子包命名空间独立。
 *
 * - composables：headless 组合函数、行为原语与协议类型
 *   （AsyncStateLike / ActionLike / SubscribeHandler / Fetch 等）
 * - components：默认渲染组件、Cumquat 全量安装器与命令式服务
 *
 * 主题样式为纯 CSS，通过主包子路径引入：
 *   import 'cumquat/themes/basic.css';
 *   import 'cumquat/themes/light.css';
 */

export * as composables from '@cumquat/composables';
export * as components from '@cumquat/components';
