import { describe, it, expect } from 'vitest';
import { validateRule } from '../src/config/rule-schema.js';

describe('validateRule', () => {
  it('rejects rule without name', () => {
    const result = validateRule({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('规则必须有名称(name)');
  });

  it('rejects invalid fontSize', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { fontSize: 100 } },
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid fontSize range', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { fontSize: 13 } },
    });
    expect(result.errors.filter(e => e.includes('fontSize'))).toHaveLength(0);
  });

  it('rejects invalid alignment', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { alignment: 'diagonal' } },
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid alignment', () => {
    const result = validateRule({
      name: 'test',
      styles: { body: { alignment: 'both' } },
    });
    expect(result.errors.filter(e => e.includes('alignment'))).toHaveLength(0);
  });

  it('accepts a complete valid rule', () => {
    const result = validateRule({
      name: 'test',
      pageSetup: { paperSize: 'A4', marginTop: 3.7 },
      styles: {
        heading1: { fontSize: 16, alignment: 'center', lineRule: 'exact', lineSpacing: 20 },
        body: { fontSize: 13, alignment: 'both', lineRule: 'exact', lineSpacing: 25 },
      },
    });
    expect(result.valid).toBe(true);
  });
});
