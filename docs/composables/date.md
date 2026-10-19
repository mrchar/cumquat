---
title: 日期时间模型
---

# 日期时间模型

DatePicker、Calendar、TimePicker 共享的无头模型；宿主自研日期类界面可直接复用。

## useDateGrid

日历网格纯计算：月首偏移、当月天数、范围 / 禁用标记、多面板。

```ts
const { panels, viewDate, prevMonth, nextMonth, prevYear, nextYear } = useDateGrid({
  type: 'date', // 'date' | 'month' | 'year'
  firstDayOfWeek: 1,
  disabledDate: (d) => d < new Date(),
  isSelected: (d) => isSameDay(d, value),
  panelCount: 2, // 范围选择双面板
});
```

## useDateModel

日期值模型：解析 / 格式化、粒度（日 / 月 / 年）、范围选择、快捷选项。受控 / 非受控统一。

```ts
const { value, rangeValue, displayText, select, selectRange, applyPreset } = useDateModel({
  modelValue: () => props.modelValue,
  onChange: (v) => emit('update:modelValue', v),
  type: 'date',
});
```

## useTimeModel

时 / 分 / 秒列选择、步进、范围限制、确认回写。

```ts
const { hour, minute, second, columns, setTime, confirm } = useTimeModel({
  modelValue: () => props.modelValue,
  onChange: (v) => emit('update:modelValue', v),
  hourStep: 1,
  minuteStep: 15,
});
```
