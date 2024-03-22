import fs from 'fs';
import path from 'path';
import { AgentContext, logger } from '..';
import Handlebars, { compile } from 'handlebars';

export const getPromptFromFile = async (filePath: string, context: AgentContext): Promise<string | undefined> => {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    logger.warn(`Prompt file not found: ${absolutePath}`);
    return undefined;
  }

  const template = await fs.promises.readFile(absolutePath, 'utf-8');
  return replacePlaceholders(template, context);
};

function replacePlaceholders(templateStr: string, context: AgentContext): string {
  Handlebars.registerHelper('directory_tree', (depth?: number) => context.getDirectoryTree(depth));
  const template = compile(templateStr);
  return template(context.routing);
}
