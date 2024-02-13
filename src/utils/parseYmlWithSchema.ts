import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as yaml from 'js-yaml';
import SchemaValidationError, { ParseError } from '../config/SchemaValidationError';

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);

export const parseYmlWithSchema = <T>(filePath: string, contents: string, schema: any): T => {
  try {
    const parsed = yaml.load(contents) as T;

    const validate = ajv.compile(schema);

    const valid = validate(parsed);
    if (!valid) {
      console.error('Invalid yaml:', filePath, validate.errors);
      throw new SchemaValidationError(filePath, contents, validate.errors!);
    }

    return parsed;
  } catch (e) {
    if (e instanceof yaml.YAMLException) {
      throw new ParseError(
        filePath,
        e.message,
        { line: e.mark.line, column: e.mark.column },
        e.mark.position,
        e.mark.snippet,
      );
    }

    throw e;
  }
};
