import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { Message, Alert, Notification, Loading, Skeleton, Result, Upload } from '../../index';
import type { UploadFile } from '../feedback/Upload.vue';

describe('Message', () => {
  it('closable 点击后隐藏', async () => {
    const wrapper = mount(Message, {
      props: { closable: true, type: 'success' },
      slots: { default: '已保存' },
    });
    expect(wrapper.find('.cumquat-message').exists()).toBe(true);
    expect(wrapper.find('.cumquat-message').classes()).toContain('bg-cumquat-success-soft');
    await wrapper.find('.cumquat-message__close').trigger('click');
    expect(wrapper.find('.cumquat-message').exists()).toBe(false);
  });
});

describe('Alert', () => {
  it('渲染标题与内容，可关闭', async () => {
    const wrapper = mount(Alert, {
      props: { title: '警告', type: 'warning', closable: true },
      slots: { default: '这是一条警告' },
    });
    expect(wrapper.find('.cumquat-alert__title').text()).toBe('警告');
    await wrapper.find('.cumquat-alert__close').trigger('click');
    expect(wrapper.find('.cumquat-alert').exists()).toBe(false);
  });
});

describe('Notification', () => {
  it('visible=false 时不渲染', () => {
    const wrapper = mount(Notification, { props: { title: '通知', visible: false } });
    expect(wrapper.find('.cumquat-notification').exists()).toBe(false);
  });

  it('渲染标题与内容', () => {
    const wrapper = mount(Notification, { props: { title: '通知' }, slots: { default: '内容' } });
    expect(wrapper.find('.cumquat-notification__title').text()).toBe('通知');
  });
});

describe('Loading', () => {
  it('渲染 spinner 与文案', () => {
    const wrapper = mount(Loading, { props: { text: '加载中' } });
    expect(wrapper.find('.cumquat-loading__spinner').exists()).toBe(true);
    expect(wrapper.find('.cumquat-loading__text').text()).toBe('加载中');
  });
});

describe('Skeleton', () => {
  it('按 rows 渲染骨架行', () => {
    const wrapper = mount(Skeleton, { props: { rows: 4, avatar: true } });
    expect(wrapper.findAll('.cumquat-skeleton__line')).toHaveLength(4);
    expect(wrapper.find('.cumquat-skeleton__avatar').exists()).toBe(true);
  });
});

describe('Result', () => {
  it('渲染状态图标与标题', () => {
    const wrapper = mount(Result, { props: { status: 'success', title: '操作成功' } });
    expect(wrapper.find('.cumquat-result__icon').classes()).toContain('bg-cumquat-success-soft');
    expect(wrapper.find('.cumquat-result__title').text()).toBe('操作成功');
  });
});

describe('Upload', () => {
  const fileList: UploadFile[] = [{ name: '设计稿.pdf', size: '2.1 MB', status: 'done' }];

  it('渲染文件列表并派发 remove', async () => {
    const wrapper = mount(Upload, { props: { fileList } });
    expect(wrapper.findAll('.cumquat-upload__item')).toHaveLength(1);
    await wrapper.find('.cumquat-upload__remove').trigger('click');
    expect(wrapper.emitted('remove')?.[0]).toEqual([fileList[0]]);
  });
});
