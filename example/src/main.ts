import { createApp } from 'vue';
// 命名空间入口：全量安装器
import { components } from '@mrchar/cumquat';
// 预编译样式（无需 Tailwind 的宿主）
import '@mrchar/cumquat/style.css';
// 主题子路径导出验证（Tailwind v4 宿主的接入路径）
import '@mrchar/cumquat/themes/light.css';
import App from './App.vue';

createApp(App).use(components.Cumquat).mount('#app');
