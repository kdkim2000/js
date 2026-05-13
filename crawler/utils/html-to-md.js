const TurndownService = require('turndown');

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  fence: '```',
  bulletListMarker: '-',
});

// Preserve <pre><code> blocks with language detection
td.addRule('fencedCodeBlock', {
  filter(node) {
    return node.nodeName === 'PRE' && node.querySelector('code');
  },
  replacement(content, node) {
    const code = node.querySelector('code');
    const lang = (code.className || '').replace('language-', '').split(' ')[0] || 'javascript';
    const text = code.textContent || '';
    return `\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
  },
});

// Convert note/warn/important boxes to GitHub-style blockquotes
td.addRule('noteBox', {
  filter(node) {
    if (node.nodeName !== 'DIV') return false;
    const cls = node.className || '';
    return cls.includes('important') || cls.includes('warn') || cls.includes('info') || cls.includes('smart');
  },
  replacement(content, node) {
    const cls = node.className || '';
    let prefix = '> [!NOTE]';
    if (cls.includes('warn')) prefix = '> [!WARNING]';
    else if (cls.includes('important')) prefix = '> [!IMPORTANT]';

    const lines = content.trim().split('\n').map(l => `> ${l}`).join('\n');
    return `\n${prefix}\n${lines}\n\n`;
  },
});

// Strip task solution blocks (keep task headers, hide solutions in summary/details)
td.addRule('taskSolution', {
  filter(node) {
    return node.nodeName === 'DIV' && (node.className || '').includes('solution');
  },
  replacement(content) {
    return `\n<details>\n<summary>정답 보기</summary>\n\n${content.trim()}\n\n</details>\n\n`;
  },
});

function htmlToMarkdown(html) {
  return td.turndown(html);
}

module.exports = { htmlToMarkdown };
