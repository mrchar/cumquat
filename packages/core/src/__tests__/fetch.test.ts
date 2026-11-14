import { describe, expect, it } from 'vitest';
import { reactive, ref } from 'vue';
import { isPagedResult, normalizeFetchResult, resolveFetchQuery } from '../fetch';

describe('resolveFetchQuery', () => {
  it('解包 reactive 对象与 ref 片段', () => {
    const filters = reactive({ status: ['on'] });
    const query = {
      page: ref(2),
      size: 20,
      keyword: ref('张'),
      filters,
    };
    expect(resolveFetchQuery(query)).toEqual({
      page: 2,
      size: 20,
      keyword: '张',
      filters: { status: ['on'] },
    });
  });

  it('支持片段 getter 与整体 getter', () => {
    const query = { sorter: () => ({ key: 'name', order: 'asc' as const }) };
    expect(resolveFetchQuery(() => query)).toEqual({
      sorter: { key: 'name', order: 'asc' },
    });
  });

  it('空查询返回空快照', () => {
    expect(resolveFetchQuery()).toEqual({});
    expect(resolveFetchQuery(null)).toEqual({});
  });
});

describe('isPagedResult', () => {
  it('识别 { list, page, size, total } 形态', () => {
    expect(isPagedResult({ list: [1, 2], page: 1, size: 10, total: 2 })).toBe(true);
    // page / size 缺失仍按分页处理，由调用方以请求参数兜底
    expect(isPagedResult({ list: [1, 2], total: 2 })).toBe(true);
  });

  it('数组、单值与非数字 total 不算分页', () => {
    expect(isPagedResult([1, 2])).toBe(false);
    expect(isPagedResult({ list: [1], total: '2' })).toBe(false);
    expect(isPagedResult(null)).toBe(false);
    expect(isPagedResult('x')).toBe(false);
  });
});

describe('normalizeFetchResult', () => {
  it('数组归一为列表并回填长度', () => {
    const raw = [1, 2, 3];
    expect(normalizeFetchResult(raw)).toEqual({ data: raw, total: 3, raw });
  });

  it('分页结果归一为 list、page、size 与 total', () => {
    const raw = { list: ['a'], page: 2, size: 10, total: 10 };
    expect(normalizeFetchResult(raw)).toEqual({
      data: raw.list,
      total: 10,
      page: 2,
      size: 10,
      raw,
    });
  });

  it('分页结果缺 page / size 时归一为 undefined，由调用方兜底', () => {
    const raw = { list: ['a'], total: 10 };
    const result = normalizeFetchResult(raw);
    expect(result).toEqual({ data: raw.list, total: 10, raw });
    expect(result.page).toBeUndefined();
    expect(result.size).toBeUndefined();
  });

  it('单值原样作为 data', () => {
    const raw = { id: 1 };
    expect(normalizeFetchResult(raw)).toEqual({ data: raw, raw });
  });
});
