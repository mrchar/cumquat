---
layout: home

hero:
  name: Cumquat
  text: Vue 3 组件库
  tagline: Headless 组合函数 + 开箱即用默认渲染 + 主题包，逻辑与渲染彻底解耦
  actions:
    - theme: brand
      text: 快速上手
      link: /getting-started
    - theme: alt
      text: 组件总览
      link: /components/button
    - theme: alt
      text: 远程数据
      link: /fetch

features:
  - icon: 🧩
    title: 逻辑与渲染解耦
    details: 每个交互组件先有 Headless 组合函数，再有默认渲染壳；状态机、键盘行为、浮层定位只实现一次。
  - icon: 🎯
    title: 三层视图策略
    details: 零配置默认渲染、逐插槽覆盖、完全自定义渲染函数，逐层可替换，互不锁定。
  - icon: 🎨
    title: 语义 Token 主题化
    details: 组件只含语义类名与 CSS 变量，主题包经同一套机制覆盖变量即可换肤，深色模式开箱即用。
  - icon: 🔌
    title: 统一远程数据
    details: 资源型组件绑定 fetch 方法即可完成接入，防抖、竞态、分页联动、错误重试、四态渲染全部内置。
  - icon: ✍️
    title: 可编辑的活文档
    details: 每个组件页内置代码卡片，修改示例代码即时看到渲染效果，一键恢复初始代码。
  - icon: 🪶
    title: 按需打包
    details: composable、headless、components 三个入口独立分包，默认渲染代码不使用就不会被打包。
---
