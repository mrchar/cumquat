import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

/**
 * 表单上下文：useForm 提供整表模型，useFormField 注入后完成
 * 字段注册、规则继承与提交/重置联动；FormItem 再向具体控件注入字段上下文。
 */

export interface FormFieldContext {
  /** 字段名 */
  name: string | number;
  /** 当前校验错误信息（无错误为 undefined） */
  error?: string;
  /** 是否被触碰过（blur 后置 true） */
  touched: boolean;
  /** 控件 id（label/aria 关联） */
  fieldId: string;
  /** 校验状态变化时由控件调用 */
  setError?: (error: string | undefined) => void;
}

/** 字段注册到表单时提供的控制器 */
export interface FormFieldController {
  validate: () => Promise<string | true> | string | true;
  reset: () => void;
  clearValidate: () => void;
  getValue?: () => unknown;
  setValue?: (value: unknown) => void;
}

export interface FormContext {
  /** 整表值的只读快照（响应式对象） */
  values: Record<string, unknown>;
  /** 整表校验错误映射 */
  errors: Record<string, string | undefined>;
  /** 注册字段，返回注销函数 */
  registerField: (name: string | number, controller: FormFieldController) => () => void;
  /** 读取字段在表单规则中的校验器 */
  getFieldRules?: (name: string | number) => unknown;
  /** 提交表单（经 useForm 编排，触发校验与 submit 事件） */
  submit: () => Promise<void>;
  /** 重置整表 */
  reset: () => void;
  /** 字段值变化时回写整表聚合值 */
  setFieldValue?: (name: string | number, value: unknown) => void;
  /** 是否禁用整表 */
  disabled?: boolean;
  /** label 位置等布局信息（仅传递，不参与逻辑） */
  labelPosition?: 'left' | 'right' | 'top';
}

const FORM_KEY: InjectionKey<FormContext> = Symbol('cumquat-form');
const FIELD_KEY: InjectionKey<FormFieldContext> = Symbol('cumquat-form-field');

/** useForm 注册整表上下文 */
export function provideForm(context: FormContext): void {
  provide(FORM_KEY, context);
}

/** 表单控件 / FormItem 注入整表上下文，未处于表单中时返回 undefined */
export function injectForm(): FormContext | undefined {
  return inject(FORM_KEY, undefined);
}

/** FormItem 注册字段上下文（向内部控件传递错误、id 等） */
export function provideFormField(context: FormFieldContext): void {
  provide(FIELD_KEY, context);
}

/** 具体表单控件注入所属字段上下文 */
export function injectFormField(): FormFieldContext | undefined {
  return inject(FIELD_KEY, undefined);
}
