---
layout: home

hero:
  name: Cumquat
  text: Vue 3 组件库
  tagline: 一个状态自持的组件库
  actions:
    - theme: brand
      text: 快速上手
      link: /getting-started
    - theme: alt
      text: 组件总览
      link: /components/button

features:
  - icon: 🔌
    title: 状态自持
    details: 组件自己处理加载、错误、空态、重试、竞态——这些胶水代码不用再写，你只管绑业务方法。
  - icon: 🧩
    title: 逻辑与外观解耦
    details: composables 管行为、.vue 只做渲染壳、主题换 token 即可换肤，任一层独立替换不影响其他。
  - icon: 🏷️
    title: 元数据驱动
    details: 给列定义和字段定义，组件自动推断 Table 单元格怎么展示、Form 字段用什么控件录入。
  - icon: 📐
    title: 三种异步协议
    details: fetch 查列表、action 绑动作、subscribe 收推送，统一状态机自动处理竞态和四态渲染。
  - icon: 🪄
    title: Headless 组合函数
    details: 所有交互逻辑抽成 composables，默认 .vue 只提供 Tailwind 渲染，插槽或自定义渲染随时接管。
  - icon: 🗂️
    title: OpenAPI 对接
    details: useResources 绑定服务器和 Swagger 文档，自动导出资源方法和字段元数据，组件据此推断展示与录入。
---
