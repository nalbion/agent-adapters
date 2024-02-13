// import * as readline from 'readline';
// import { EventEmitter } from 'events';
// import Agent from '../Agent';

// class UserProxyAgent extends Agent {
//   private rl: readline.Interface;
//   private eventEmitter: EventEmitter = new EventEmitter();

//   constructor() {
//     super();
//     this.rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout
//     });
//   }

//   askFeedback(question: string, callback: (input: string) => void): void {
//     this.rl.question(question, (input: string) => {
//       this.eventEmitter.emit('feedback', input);
//       callback(input); // pass the user's input to the callback
//       this.rl.close(); // Close the readline interface once we get the input
//     });
//   }
// }
