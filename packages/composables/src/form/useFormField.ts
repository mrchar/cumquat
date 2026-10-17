import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { MaybeRefOrGetter, WritableComputedRef } from 'vue';
import { toValue } from 'vue';
import { injectForm } from '../behavior/useFormContext';
import { useControllableModel } from '../core/useControllableModel';
import { useId } from '../core/useId';
import { normalizeRules, runRules } from './form-types';
import type { FormRule } from './form-types';

export interface UseFormFieldOptions<T> {
  /** 字段名；处于表单上下文中时用于注册与聚合 */
  name?: string | number;
  modelValue?: MaybeRefOrGetter<T>;
  defaultValue?: T;
  onChange?: (value: T) => void;
  /** 字段级规则（会与表单同名规则合并执行） */
  rules?: Array<FormRule> | FormRule;
  /** blur 时触发校验，默认 true */
  validateOnBlur?: boolean;
  /** change 时触发校验（仅在校验过一次或触碰后生效），默认 true */
  validateOnChange?: boolean;
  /** 外部禁用条件 */
  disabled?: MaybeRefOrGetter<boolean>;
  /** id 前缀 */
  idPrefix?: string;
}

export interface UseFormFieldReturn<T> {
  value: WritableComputedRef<T>;
  error: ReturnType<typeof ref<string | undefined>>;
  touched: ReturnType<typeof ref<boolean>>;
  valid: ReturnType<typeof computed<boolean>>;
  disabled: ReturnType<typeof computed<boolean>>;
  fieldId: ReturnType<typeof useId>;
  errorId: ReturnType<typeof useId>;
  /** 绑定到控件的 aria 属性集合 */
  aria: ReturnType<typeof computed<Record<string, unknown>>>;
  /** 值变化统一入口（同步 v-model + 按策略校验） */
  handleChange: (next: T) => void;
  /** blur 统一入口 */
  handleBlur: () => void;
  validate: () => Promise<string | true>;
  reset: () => void;
  clearValidate: () => void;
}

/**
 * 单字段模型：值的受控/非受控统一、校验信息、touched 状态、
 * aria 注入与表单上下文联动。所有表单控件共用。
 */
export function useFormField<T>(options: UseFormFieldOptions<T> = {}): UseFormFieldReturn<T> {
  const {
    name,
    modelValue,
    defaultValue,
    onChange,
    rules,
    validateOnBlur = true,
    validateOnChange = true,
    disabled,
    idPrefix = 'cq-field',
  } = options;

  const form = injectForm();
  const fieldId = useId(idPrefix);
  const errorId = useId(`${idPrefix}-error`);

  const initialValue = toValue(modelValue as MaybeRefOrGetter<T>) ?? defaultValue;

  const { value } = useControllableModel<T>({
    modelValue,
    defaultValue,
    onChange: (next) => {
      onChange?.(next);
      if (form && name !== undefined) form.setFieldValue?.(name, next);
    },
  });

  const error = ref<string | undefined>(undefined);
  const touched = ref(false);

  const mergedRules = (): FormRule[] => {
    const own = normalizeRules(rules);
    const fromForm = name !== undefined ? normalizeRules(form?.getFieldRules?.(name) as never) : [];
    return [...fromForm, ...own];
  };

  const validate = async (): Promise<string | true> => {
    const list = mergedRules();
    const result =
      list.length > 0 ? await runRules(value.value, form?.values ?? {}, list) : undefined;
    error.value = result;
    if (form && name !== undefined) form.errors[String(name)] = result;
    return result ?? true;
  };

  const clearValidate = () => {
    error.value = undefined;
    if (form && name !== undefined) delete form.errors[String(name)];
  };

  const reset = () => {
    value.value = initialValue;
    touched.value = false;
    clearValidate();
  };

  const handleChange = (next: T) => {
    value.value = next;
    if (validateOnChange && (touched.value || error.value !== undefined)) {
      void validate();
    }
  };

  const handleBlur = () => {
    touched.value = true;
    if (form && name !== undefined) form.errors[String(name)] = error.value;
    if (validateOnBlur) void validate();
  };

  // 与表单聚合值双向联动
  if (form && name !== undefined) {
    form.setFieldValue?.(name, value.value);
    watch(value, (next) => form.setFieldValue?.(name, next));
    const unregister = form.registerField(name, {
      validate,
      reset,
      clearValidate,
      getValue: () => value.value,
      setValue: (next) => {
        value.value = next as T;
      },
    });
    onBeforeUnmount(unregister);
    // 初始同步表单侧已存在的错误
    error.value = form.errors[String(name)];
  }

  const valid = computed(() => error.value === undefined);
  const disabledState = computed(() => form?.disabled === true || toValue(disabled) === true);

  const aria = computed(() => ({
    id: fieldId.value,
    'aria-invalid': error.value ? true : undefined,
    'aria-describedby': error.value ? errorId.value : undefined,
  }));

  return {
    value,
    error,
    touched,
    valid,
    disabled: disabledState,
    fieldId,
    errorId,
    aria,
    handleChange,
    handleBlur,
    validate,
    reset,
    clearValidate,
  };
}
