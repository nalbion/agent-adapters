// import { ToolManager } from '../ToolManager';
// import { ToolContext } from '../ToolTypes';

// export const TOOL_CLONE_REPO = 'clone_repo';

// /**
//  * Write text to a file
//  * @param filename The name of the file to write
//  * @param contents The contents of the file to write
//  */
// const clone_repo = async (context: ToolContext, repoUrl: string, localPath: string) => {
//   try {
//     const fullPath = await context.git.clone(repoUrl, localPath);
//     const project = localPath.split('/').pop();
//     return `The repository ${repoUrl} has been cloned locally as project "${project}" to ${localPath}`;
//   } catch (err) {
//     return `Error cloning repository from ${repoUrl} to ${localPath}: ${(err as Error).message}`;
//   }
// };

// ToolManager.registerTool(clone_repo, {
//   name: TOOL_CLONE_REPO,
//   description: 'Clone a git repository',
//   parameters: {
//     type: 'object',
//     properties: {
//       repository_url: {
//         type: 'string',
//         description: 'The URL of the repository to clone',
//       },
//       local_path: {
//         type: 'string',
//         description: 'The local path to clone the repository to',
//       },
//     },
//     required: ['repository_url', 'local_path'],
//   },
// });
