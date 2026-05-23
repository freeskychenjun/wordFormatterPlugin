import { describe, it, expect } from 'vitest';
import { classifyParagraph } from '../src/engine/style-classifier.js';

describe('classifyParagraph', () => {
  it('classifies image paragraphs', () => {
    expect(classifyParagraph({ text: '任意文本', outlineLevel: 10, hasImage: true, inTable: false }))
      .toEqual({ type: 'image' });
  });

  it('classifies figCaption by pattern', () => {
    expect(classifyParagraph({ text: '图 1-1 总平面布置图', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'figCaption' });
    expect(classifyParagraph({ text: '图一 总平面布置图', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'figCaption' });
  });

  it('classifies tblCaption by pattern', () => {
    expect(classifyParagraph({ text: '表2-3 工程量清单', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'tblCaption' });
    expect(classifyParagraph({ text: '表一 工程量清单', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'tblCaption' });
  });

  it('classifies heading by outline level', () => {
    expect(classifyParagraph({ text: '第一章 概述', outlineLevel: 1, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading1' });
    expect(classifyParagraph({ text: '1.1 项目背景', outlineLevel: 2, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading2' });
    expect(classifyParagraph({ text: '1.1.1 自然地理', outlineLevel: 3, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading3' });
    expect(classifyParagraph({ text: '1.1.1.1 地形地貌', outlineLevel: 4, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading4' });
  });

  it('classifies heading by text pattern when outlineLevel is body text', () => {
    expect(classifyParagraph({ text: '3 工程概况', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading1' });
    expect(classifyParagraph({ text: '3.2 设计标准', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading2' });
    expect(classifyParagraph({ text: '3.2.1 防洪标准', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'heading3' });
  });

  it('classifies table content', () => {
    expect(classifyParagraph({ text: '数据内容', outlineLevel: 10, hasImage: false, inTable: true }))
      .toEqual({ type: 'tableContent' });
  });

  it('classifies body text as default', () => {
    expect(classifyParagraph({ text: '这是一段普通正文内容。', outlineLevel: 10, hasImage: false, inTable: false }))
      .toEqual({ type: 'body' });
  });

  it('does not classify long heading-like text as heading', () => {
    const longText = '1.1 这是一个非常非常长的标题文本超过了六十个字符的限制所以应该被降级为正文而不是标题来处理这里需要更多的文本来确保长度超过六十个字符的限制这样才能正确测试边界条件';
    const result = classifyParagraph({ text: longText, outlineLevel: 2, hasImage: false, inTable: false });
    expect(result.type).not.toBe('heading2');
  });
});
