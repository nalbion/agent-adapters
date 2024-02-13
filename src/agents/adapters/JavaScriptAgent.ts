// import { join } from 'path';
// import { promises as fs } from 'fs';
// import Agent from "../Agent";

// export default class JavascriptAgent extends Agent {

//   /**
//    * Call a method from a JavaScript file
//    * @param filePath Path to the JavaScript file
//    * @param methodName Name of the method to call
//    * @param argString JSON string of arguments to pass to the method
//    * @example callExternalMethod('path/to/file.js', 'methodName', '["arg1", "arg2"]')
//    */
//   private async callExternalMethod(filePath: string, methodName: string, argString: string) {
//     if (!await fs.stat(filePath).then(() => true).catch(() => false)) {
//       throw new Error('File does not exist');
//     }

//     const modulePath = join(process.cwd(), filePath);
//     const module = await import(modulePath);

//     if (typeof module[methodName] === 'function') {
//       const args = JSON.parse(argString);
//       module[methodName](...args);
//     } else {
//       throw new Error('Method not found in module');
//     }
//   }
// }
