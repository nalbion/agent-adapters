import { ErrorObject } from 'ajv';
import * as yamlAstParser from 'yaml-ast-parser';

const errorToString = (e: Partial<ErrorObject>) =>
  `${e.instancePath} ${e.message}. ${e.params ? JSON.stringify(e.params) : ''}`;

type Position = {
  line: number;
  column: number;
};

export class ParseError extends Error {
  private end: Position;

  constructor(filePath: string, message: string, start: Position, end: Position);
  constructor(filePath: string, message: string, start: Position, end: number, snippet: string);
  constructor(
    public filePath: string,
    message: string,
    private start: Position,
    end: Position | number,
    snippet?: string,
  ) {
    super(message);

    if (typeof end !== 'number') {
      this.end = end;
    } else {
      this.end = getPositionFromOffset(snippet!, end);
      this.end.line += start.line;
    }
  }

  getErrors() {
    return [
      {
        message: this.message,
        start: this.start,
        end: this.end,
      },
    ];
  }
}

export default class SchemaValidationError extends Error {
  constructor(
    public filePath: string,
    public fileContent: string,
    private errors: Partial<ErrorObject>[],
  ) {
    const message = `${filePath} is invalid:\n${errors.map((e) => ` - ${errorToString(e)}`).join('\n')}`;
    super(message);
  }

  getErrors(): Array<{
    message: string;
    start: Position;
    end: Position;
  }> {
    // import * as jsonToAst from 'json-to-ast';
    // let ast;
    // if (this.filePath.endsWith('.json')) {
    //   ast = jsonToAst(this.fileContent);
    // } else {
    const ast = yamlAstParser.safeLoad(this.fileContent);
    // }

    // instancePath
    return this.errors.map((e) => ({
      ...getErrorLocation(this.fileContent, ast, e),
      message: errorToString(e),
    }));
  }
}

function getErrorLocation(fileContent: string, ast: yamlAstParser.YAMLNode, e: Partial<ErrorObject>) {
  let node: yamlAstParser.YAMLNode | undefined = ast;

  let instancePath = e.instancePath as string;
  if (e.params?.additionalProperty) {
    instancePath += `/${e.params.additionalProperty}`;
  }

  for (const part of instancePath.split('/').slice(1)) {
    if (node && node.kind === yamlAstParser.Kind.MAP) {
      const mapNode = node as yamlAstParser.YamlMap;
      node = mapNode.mappings.find((m) => m.key.value === part)?.value;
    } else if (node && node.kind === yamlAstParser.Kind.SEQ) {
      const seqNode = node as yamlAstParser.YAMLSequence;
      node = seqNode.items[Number(part)];
    } else {
      node = undefined;
      break;
    }
  }

  if (!node) {
    return { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
  }

  return {
    start: getPositionFromOffset(fileContent, node.startPosition),
    end: getPositionFromOffset(fileContent, node.endPosition),
  };
}

function getPositionFromOffset(fileContent: string, offset: number): Position {
  let line = 0;
  let column = 0;

  for (let i = 0; i < offset; i++) {
    if (fileContent[i] === '\n') {
      line++;
      column = 0;
    } else {
      column++;
    }
  }

  return { line, column };
}
