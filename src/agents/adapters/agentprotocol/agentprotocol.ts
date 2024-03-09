import { type Request, type Response } from 'express';
import Agent, {
  type StepHandler,
  type StepInput,
  type StepResult,
  type TaskInput,
  type Artifact,
} from 'agent-protocol';
import AgentProtocolServer from '../AgentProtocolServer';
import { logger } from '../../../utils/Logger';
import { AgentResponseStatus } from '../../types/AgentResponse';
import { type FileStorage } from 'any-cloud-storage';

/**
 * Handles incoming requests: POST /ap/v1/agent/task
 * @param taskId - a UUID
 * @param taskInput - the user input for the task
 */
async function taskHandler(taskId: string, taskInput: TaskInput | null, additionalInput?: any): Promise<StepHandler> {
  logger.info(`New task: ${taskInput}`);
  await AgentProtocolServer.newTask(taskId, taskInput, additionalInput);

  async function stepHandler(stepInput: StepInput | null, additionalInput?: any): Promise<StepResult> {
    logger.info(`Execute step: ${stepInput}`);

    const response = await AgentProtocolServer.executeStep(taskId, stepInput, additionalInput);

    return {
      output: response.reply.content,
      is_last: response.status === AgentResponseStatus.DONE,
    };
  }

  return stepHandler;
}

export let apAgent: Agent;

/**
 * @param config.port - The port to listen on, defaults to 8000
 * @param config.workspace - The workspace directory, defaults to '/tmp'
 */
export const startServer = (config: { port?: number; workspace?: string }) => {
  apAgent = Agent.handleTask(taskHandler, config);
  apAgent.start();
};

type ServerRequestHandler<R extends Request = Request, S extends Response = Response> = (
  request: R,
  response: S,
) => void | Promise<void>;
type BuildServerConfig = {
  workspace?: string;
  // Waiting on https://github.com/AI-Engineer-Foundation/agent-protocol/pull/100
  // artifactStorage: ArtifactStorage;
};

const buildServer = (config: BuildServerConfig) => {
  apAgent = Agent.handleTask(taskHandler, config);
  // Waiting on https://github.com/AI-Engineer-Foundation/agent-protocol/pull/99
  const apHandler = (apAgent as any).build() as ServerRequestHandler; // the Express app
  apAgent.start();
  return apHandler;
};

export const createServerless = <R extends Request = Request, S extends Response = Response>(
  config: BuildServerConfig,
  promisedStorage?: Promise<FileStorage>,
) => {
  if (promisedStorage) {
    const promisedHandler = promisedStorage.then((_storage) => {
      // config.artifactStorage = ArtifactStorageFactory.create(config.artifactStorage);
      // config.artifactStorage = new AnyCloudArtifactStorage(storage);
      return buildServer(config);
    });

    return (request: R, response: S) => promisedHandler.then((handler) => handler(request, response));
  }

  return buildServer(config);
};

// type Artifact = {

// type Step = {
//   task_id:	string;
//   step_id:	string;
//   input:	string;   //	Input prompt for the step.
//   additional_input?:	object;
//   name:	string;
//   status:	'created' | 'completed';
//   output:	string;
//   additional_output:	object;
//   artifacts: Artifact[]; //	A list of artifacts that the step has produced.
//   is_last:boolean;       //	Whether this is the last step in the task.
// }

// type Task = {
//   task_id: string;
//   input: string;
//   additional_input: Record<string, any>;
//   steps?: Step[];
//   artifacts?: Artifact[];
// };

type TaskRequestBody = {
  input: string;
  additional_input?: Record<string, any>;
};

type StepRequestBody = {
  input: string;
  additional_input?: Record<string, any>;
};

type Task = {
  input?: TaskInput;
  task_id: string;
  artifacts?: Artifact[];
};

export type Step = {
  step_id: string;
  task_id: string;
  name?: string;
  output?: string;
  status: 'created' | 'running' | 'completed';
  is_last: boolean;
  artifacts: Artifact[];
  additional_output?: Record<string, any>;
};

/** Called from AgentProtocolClient to initiate a new Task on the remote Agent */
export const createAgentTask = async (input: TaskRequestBody, host: string = 'http://localhost:8000') => {
  const body = JSON.stringify(input);

  // Create task
  try {
    let response = await fetch(`${host}/ap/v1/agent/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const task = (await response.json()) as Task;
    return task;
  } catch (err) {
    logger.error('Failed to send request to remote agent:', err);
    throw err;
  }
};

/** Called from AgentProtocolClient to execute the next step of the remote Task */
export const executeAgentTaskStep = async (
  taskId: string,
  data: StepRequestBody,
  host: string = 'http://localhost:8000',
) => {
  const response = await fetch(`${host}/ap/v1/agent/tasks/${taskId}/steps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return (await response.json()) as Step;
};
