---
layout: home

hero:
  name: Cumquat
  text: Vue 3 组件库
  tagline: 绑定一个方法，剩下的交给组件 —— 数据、动作、订阅全部内置状态管理
  actions:
    - theme: brand
      text: 快速上手
      link: /getting-started
    - theme: alt
      text: 组件总览
      link: /components/button

features:
  - icon: 🔌
    title: 绑定 fetch 即完成远程接入
    details: 分页、搜索、排序、懒加载的参数注入、防抖、竞态、错误重试、骨架空态全部内置，不写一行状态管理代码。
  - icon: ⚡
    title: action 动作协议
    details: 交互组件绑定返回 Promise 的方法，自动派生加载与禁用；失败在原地展示错误，切换型操作自动回退旧值。
  - icon: 📡
    title: subscribe 订阅实时数据
    details: WebSocket、响应式 store 等外部推送源直接绑到展示组件，失败保留旧数据，优先级高于本地与请求数据。
  - icon: 🎨
    title: 五套主题开箱即用
    details: 浅色、深色、高对比、液态玻璃随 class 一键切换；组件只暴露语义变量，宿主重写同名变量即可深度换肤。
  - icon: 🧩
    title: 默认渲染也可逐层替换
    details: 零配置直接用、插槽覆盖局部、完全自定义结构，三种用法在同一组件上共存，升级路径无断点。
  - icon: 🛡️
    title: 可访问性与 SSR 内建
    details: 键盘导航、焦点管理、aria 语义全部随组件自带；所有浏览器 API 访问惰性化，服务端渲染安全。
---
