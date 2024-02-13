declare module 'ajv-formats' {
  import Ajv from 'ajv';
  function addFormats(ajv: Ajv): void;
  export = addFormats;
}
