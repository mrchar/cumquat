import type { RuleKind } from '@cumquat/core';

/** 内置默认文案：中文兜底，使用方可按规则类型整体覆盖 */
export const DEFAULT_VALIDATION_MESSAGES: Record<RuleKind, string> = {
  required: '{label}不能为空',
  type: '{label}格式不正确',
  enum: '{label}不在可选范围内',
  minimum: '{label}不能小于{minimum}',
  maximum: '{label}不能大于{maximum}',
  exclusiveMinimum: '{label}必须大于{exclusiveMinimum}',
  exclusiveMaximum: '{label}必须小于{exclusiveMaximum}',
  multipleOf: '{label}必须是{multipleOf}的倍数',
  minLength: '{label}长度不能少于{minLength}个字符',
  maxLength: '{label}长度不能超过{maxLength}个字符',
  pattern: '{label}格式不正确',
  format: '{label}格式不正确',
  minItems: '{label}至少需要{minItems}项',
  maxItems: '{label}最多允许{maxItems}项',
  uniqueItems: '{label}不能包含重复项',
  validate: '{label}校验未通过',
  check: '校验未通过',
};
