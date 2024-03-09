import { writeFileSync } from 'fs';
import { ToolManager } from '../ToolManager';
import { ToolContext } from '../ToolTypes';
// import axios from 'axios';
import { JSDOM } from 'jsdom';
import TurndownService, { type Node } from 'turndown';

export const TOOL_WEB_PAGE_AS_MARKDOWN = 'web_page_as_markdown';

/**
 * Fetch HTML from a URL and convert it to Markdown
 * @param url The URL to fetch HTML from
 * @param enable_js Whether to enable JavaScript while fetching the HTML
 */
const web_page_as_markdown = async (_context: ToolContext, url: string, enable_js = true) => {
  // const response = await axios.get(url);
  const response = await fetch(url);
  const html = await response.text();

  const dom = new JSDOM(html, { runScripts: enable_js ? 'dangerously' : 'outside-only' });
  const turndownService = new TurndownService();

  // Add a rule to include CSS selectors for interactive elements
  turndownService.addRule('interactiveElements', {
    filter: [
      // 'a',
      'button',
      'input',
    ],
    replacement: (content, node) => {
      const cssSelector = getCssSelector(node as HTMLElement);
      return `\n\n[css_selector]: (${cssSelector})\n[${content}]\n`;
    },
  });

  // turndownService.addRule('selectorsForSignificantElements', {
  //   filter: [
  //     'h1',
  //     'h2',
  //     'h3',
  //     'h4',
  //     'img',
  //     // 'canvas',
  //     // 'article', // would be good to have a CSS selector for this, but adding it seems to remove it completely
  //   ],
  //   replacement: (content, node, options) => {
  //     const cssSelector = getCssSelector(node as HTMLElement);
  //     // return `[${cssSelector}]: ${content}\n`;
  //     if (options.defaultReplacement) {
  //       return `\n[css_selector]: (${cssSelector})${options.defaultReplacement(content, node, options)}\n`;
  //     }
  //     console.warn('no keepReplacement for ', node.nodeName);
  //     return `\n[css_selector]: (${cssSelector})\n${content}\n`;
  //     // return `\n[//]: # (${cssSelector})\n${content}\n`;
  //   },
  // });

  turndownService.addRule('ignoreScript', {
    filter: ['script', 'style'],
    replacement: () => '',
  });

  const markdown = turndownService.turndown(dom.serialize());

  // context.onProgress({ type: 'inlineContentReference', title: 'web_page_as_markdown', inlineReference: url });
  // console.info('markdown:', markdown);
  // writeFileSync('web_page_as_markdown.md', markdown);
  return markdown;
};

// web_page_as_markdown({} as ToolContext, 'https://github.com/nalbion/agent-adapters');

function getCssSelector(node: HTMLElement) {
  const tagName = node.tagName.toLowerCase();
  let cssSelector = tagName;
  if (node.id) {
    cssSelector += `#${node.id}`;
  } else {
    for (const className of Array.from(node.classList)) {
      cssSelector += `.${className}`;
    }

    if (tagName === 'a' && node.hasAttribute('href')) {
      cssSelector += `[href="${node.getAttribute('href')}"]`;
    } else if (tagName === 'input' && node.hasAttribute('name')) {
      cssSelector += `[name="${node.getAttribute('name')}"]`;
    }
  }

  // console.info('cssSelector:', cssSelector);
  return cssSelector;
}

ToolManager.registerTool(web_page_as_markdown, {
  name: TOOL_WEB_PAGE_AS_MARKDOWN,
  description: 'Fetch HTML from a URL and convert it to Markdown',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch HTML from',
      },
      enable_js: {
        type: 'boolean',
        description: 'Whether to enable JavaScript while fetching the HTML',
        default: true,
      },
    },
    required: ['url'],
  },
});
