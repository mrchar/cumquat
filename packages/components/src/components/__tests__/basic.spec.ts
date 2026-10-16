import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  Button,
  Icon,
  Input,
  Card,
  Divider,
  Avatar,
  Badge,
  Statistic,
  Typography,
  Tag,
  Empty,
} from '../../index';

describe('Button', () => {
  it('渲染锚点类与语义类型', () => {
    const wrapper = mount(Button, { props: { type: 'primary' } });
    expect(wrapper.classes()).toContain('cumquat-button');
    expect(wrapper.classes()).toContain('cumquat-button--primary');
  });

  it('loading 时禁用', async () => {
    const wrapper = mount(Button, { props: { loading: true } });
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('点击派发原生 click', async () => {
    const wrapper = mount(Button);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});

describe('Icon', () => {
  it('渲染 svg 容器', () => {
    const wrapper = mount(Icon);
    expect(wrapper.find('svg.cumquat-icon').exists()).toBe(true);
  });
});

describe('Input', () => {
  it('v-model 双向绑定', async () => {
    const wrapper = mount(Input, { props: { modelValue: 'a' } });
    const input = wrapper.find('input.cumquat-input__inner');
    expect((input.element as HTMLInputElement).value).toBe('a');
    await input.setValue('hello');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello']);
  });

  it('invalid 态使用 danger 描边', () => {
    const wrapper = mount(Input, { props: { invalid: true } });
    expect(wrapper.classes()).toContain('cumquat-input--invalid');
  });
});

describe('Card', () => {
  it('渲染标题与内容', () => {
    const wrapper = mount(Card, { props: { title: '卡片' }, slots: { default: '<p>内容</p>' } });
    expect(wrapper.find('.cumquat-card__header').text()).toBe('卡片');
    expect(wrapper.find('.cumquat-card__body').text()).toBe('内容');
  });
});

describe('Divider', () => {
  it('水平线渲染', () => {
    const wrapper = mount(Divider);
    expect(wrapper.classes()).toContain('cumquat-divider');
  });
});

describe('Avatar', () => {
  it('无图片时显示首字', () => {
    const wrapper = mount(Avatar, { props: { text: '柠' } });
    expect(wrapper.text()).toBe('柠');
  });
});

describe('Badge', () => {
  it('count 大于 0 时显示角标', () => {
    const wrapper = mount(Badge, { props: { count: 5 }, slots: { default: '<i/>' } });
    expect(wrapper.find('.cumquat-badge__sup').text()).toBe('5');
  });

  it('超过 max 显示 max+', () => {
    const wrapper = mount(Badge, { props: { count: 120, max: 99 }, slots: { default: '<i/>' } });
    expect(wrapper.find('.cumquat-badge__sup').text()).toBe('99+');
  });

  it('count 为 0 且非 dot 时不显示', () => {
    const wrapper = mount(Badge, { props: { count: 0 }, slots: { default: '<i/>' } });
    expect(wrapper.find('.cumquat-badge__sup').exists()).toBe(false);
  });
});

describe('Statistic', () => {
  it('渲染标题与数值', () => {
    const wrapper = mount(Statistic, { props: { title: '下载量', value: 1234, suffix: '次' } });
    expect(wrapper.find('.cumquat-statistic__title').text()).toBe('下载量');
    expect(wrapper.find('.cumquat-statistic__number').text()).toBe('1234');
    expect(wrapper.find('.cumquat-statistic__suffix').text()).toBe('次');
  });
});

describe('Typography', () => {
  it('level 映射标题标签', () => {
    const wrapper = mount(Typography, { props: { level: 1 }, slots: { default: '标题' } });
    expect(wrapper.element.tagName).toBe('H1');
  });

  it('copyable 点击进入已复制态', async () => {
    const wrapper = mount(Typography, { props: { copyable: true }, slots: { default: '文本' } });
    await wrapper.find('.cumquat-typography__copy').trigger('click');
    expect(wrapper.find('.cumquat-typography__copy').attributes('aria-label')).toBe('已复制');
  });
});

describe('Tag', () => {
  it('closable 关闭后隐藏', async () => {
    const wrapper = mount(Tag, { props: { closable: true }, slots: { default: '标签' } });
    expect(wrapper.find('.cumquat-tag').exists()).toBe(true);
    await wrapper.find('.cumquat-tag__close').trigger('click');
    expect(wrapper.find('.cumquat-tag').exists()).toBe(false);
  });
});

describe('Empty', () => {
  it('渲染占位图与描述', () => {
    const wrapper = mount(Empty);
    expect(wrapper.find('svg.cumquat-empty__image').exists()).toBe(true);
    expect(wrapper.find('.cumquat-empty__description').text()).toBe('暂无数据');
  });
});
