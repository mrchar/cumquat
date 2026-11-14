import { computed, reactive, ref, toValue, watch } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import { createValidator } from './createValidator';
import type { CreateValidatorOptions, Validator } from './createValidator';
import type { FormRules } from './form-types';
import type { Schema, ValidationResult } from '@cumquat/core';

export type UseValidatorOptions = CreateValidatorOptions;

export interface UseValidatorReturn<T extends Record<string, unknown>> {
  /** 响应式规则表：可直接传给 Form / useForm */
  rules: ComputedRef<FormRules<T>>;
  /** 失败字段 → 错误信息 */
  errors: Record<string, string | undefined>;
  /** 当前是否无错误（未校验时同样为 true） */
  valid: ComputedRef<boolean>;
  /** 是否有校验正在进行 */
  validating: Ref<boolean>;
  /** 最近一次校验结果 */
  result: ComputedRef<ValidationResult>;
  validate(values?: T): Promise<ValidationResult>;
  validateField(name: string, values?: T): Promise<string | true>;
  reset(): void;
}

const EMPTY_SCHEMA: Schema = { type: 'object', properties: {} };

/**
 * 响应式校验器：在 createValidator 之上维护 errors / valid / validating，
 * 便于直接绑定视图。schema 变化时清空状态，异步校验以代次令牌丢弃过期结果。
 */
export function useValidator<T extends Record<string, unknown> = Record<string, unknown>>(
  schema: MaybeRefOrGetter<Schema | undefined>,
  options: UseValidatorOptions = {},
): UseValidatorReturn<T> {
  const validator = computed<Validator<T>>(() =>
    createValidator<T>(toValue(schema) ?? EMPTY_SCHEMA, options),
  );
  const rules = computed(() => validator.value.rules);

  const errors = reactive<Record<string, string | undefined>>({});
  const validating = ref(false);
  let generation = 0;

  function clearErrors() {
    Object.keys(errors).forEach((key) => delete errors[key]);
  }

  function applyErrors(next: Record<string, string>) {
    clearErrors();
    Object.assign(errors, next);
  }

  function reset() {
    generation += 1;
    clearErrors();
    validating.value = false;
  }

  watch(validator, reset);

  async function validate(values?: T): Promise<ValidationResult> {
    const token = ++generation;
    validating.value = true;
    try {
      const result = await validator.value.validate((values ?? {}) as T);
      if (token === generation) applyErrors(result.errors);
      return result;
    } finally {
      if (token === generation) validating.value = false;
    }
  }

  async function validateField(name: string, values?: T): Promise<string | true> {
    const token = ++generation;
    validating.value = true;
    try {
      const result = await validator.value.validateField(name, (values ?? {}) as T);
      if (token === generation) {
        if (result === true) delete errors[name];
        else errors[name] = result;
      }
      return result;
    } finally {
      if (token === generation) validating.value = false;
    }
  }

  const result = computed<ValidationResult>(() => {
    const current: Record<string, string> = {};
    for (const [name, message] of Object.entries(errors)) {
      if (message !== undefined) current[name] = message;
    }
    return { valid: Object.keys(current).length === 0, errors: current };
  });

  const valid = computed(() => result.value.valid);

  return {
    rules,
    errors,
    valid,
    validating,
    result,
    validate,
    validateField,
    reset,
  };
}
