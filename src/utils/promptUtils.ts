import fs from 'fs';
import path from 'path';
import { AgentContext, logger } from '..';

export const getPromptFromFile = async (filePath: string, context: AgentContext): Promise<string | undefined> => {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    logger.warn(`Prompt file not found: ${absolutePath}`);
    return undefined;
  }

  const template = await fs.promises.readFile(absolutePath, 'utf-8');
  return replacePlaceholders(template, context);
};

function replacePlaceholders(template: string, context: AgentContext): string {
  return template.replace(/{([^}]+)}/g, (_match, key: string) => {
    key = key.trim();

    const value = key === 'directory_tree' ? context.getDirectoryTree() : context.routing[key];

    return value !== undefined ? String(value) : '';
  });
}
