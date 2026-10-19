import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { Message, Alert, Notification, Loading, Skeleton, Result, Upload, Chat } from '../../index';
import type { ChatMessage } from '@cumquat/composables';
import type { UploadFile } from '../feedback/Upload.vue';

describe('Message', () => {
  it('closable 点击后隐藏', async () => {
    const wrapper = mount(Message, {
      props: { closable: true, type: 'success' },
      slots: { default: '已保存' },
    });
    expect(wrapper.find('.cumquat-message').exists()).toBe(true);
    expect(wrapper.find('.cumquat-message').classes()).toContain('cumquat-message--success');
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
    expect(wrapper.find('.cumquat-result').classes()).toContain('cumquat-result--success');
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

describe('Chat', () => {
  it('fetch 加载历史并渲染气泡方向', async () => {
    const wrapper = mount(Chat, {
      props: {
        fetch: async () =>
          [
            { id: 1, sender: 'Alice', content: '早' },
            { id: 2, content: '晚', self: true },
          ] as ChatMessage[],
      },
    });
    await flushPromises();
    const rows = wrapper.findAll('.cumquat-chat__row');
    expect(rows).toHaveLength(2);
    expect(rows[0].classes()).not.toContain('cumquat-chat__row--self');
    expect(rows[1].classes()).toContain('cumquat-chat__row--self');
    expect(wrapper.find('.cumquat-chat__sender').text()).toBe('Alice');
  });

  it('发送消息：action 调用、气泡上屏、输入清空并 emit send', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Chat, { props: { action } });
    await wrapper.find('input').setValue('你好');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(action).toHaveBeenCalledWith('你好');
    const rows = wrapper.findAll('.cumquat-chat__row');
    expect(rows).toHaveLength(1);
    expect(rows[0].classes()).toContain('cumquat-chat__row--self');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
    expect(wrapper.emitted('send')).toHaveLength(1);
  });

  it('发送失败保留气泡可重试并展示错误条', async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error('超时'))
      .mockResolvedValueOnce(undefined);
    const wrapper = mount(Chat, { props: { action } });
    await wrapper.find('input').setValue('hi');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('.cumquat-chat__bubble--failed').exists()).toBe(true);
    expect(wrapper.find('.cumquat-chat__alert').text()).toContain('超时');
    expect(wrapper.emitted('error')).toHaveLength(1);
    await wrapper.find('.cumquat-chat__retry').trigger('click');
    await flushPromises();
    expect(action).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.cumquat-chat__bubble--failed').exists()).toBe(false);
    expect(wrapper.find('.cumquat-chat__alert').exists()).toBe(false);
  });

  it('subscribe 推送追加新消息', async () => {
    const source = reactive<ChatMessage[]>([{ id: 1, content: 'a' }]);
    const wrapper = mount(Chat, {
      props: { subscribe: async () => ({ status: 'success', data: source }) },
    });
    await flushPromises();
    expect(wrapper.findAll('.cumquat-chat__row')).toHaveLength(1);
    source.push({ id: 2, content: 'b' });
    await flushPromises();
    expect(wrapper.findAll('.cumquat-chat__row')).toHaveLength(2);
    expect(wrapper.text()).toContain('b');
  });

  it('无消息渲染空态，disabled 禁用输入与按钮', async () => {
    const wrapper = mount(Chat, { props: { disabled: true } });
    await flushPromises();
    expect(wrapper.find('.cumquat-chat__empty').text()).toBe('暂无消息');
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.cumquat-chat__footer button').attributes('disabled')).toBeDefined();
  });
});
