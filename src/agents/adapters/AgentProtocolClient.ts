import Agent from '../Agent';
import { Step } from './agentprotocol/agentprotocol';
import { AgentContext } from '../AgentContext';
import { createAgentTask, executeAgentTaskStep } from './agentprotocol/agentprotocol';
import { AgentResponse, AgentResponseStatus, AgentInputMessage } from '../types';

import { AgentConfig } from '../../types';
import { ToolManager } from '../../tools/ToolManager';
import { TOOL_EXECUTE_PYTHON_CODE, TOOL_WRITE_FILE } from '../../tools/impl';
import { TOOL_EXECUTE_SHELL } from '../../utils/dockerUtils';

export default class AgentProtocolClient extends Agent {
  private hostUrl: string;
  private taskId?: string;
  private tools = [TOOL_WRITE_FILE, TOOL_EXECUTE_PYTHON_CODE, TOOL_EXECUTE_SHELL];

  constructor(agentConfig: AgentConfig) {
    super(agentConfig);
    this.hostUrl = agentConfig.remote?.base_url || 'http://localhost:8000';
  }

  /** Receive a message from another local agent and send it to the remote AgentProtocolServer */
  override async receiveMessage(input: AgentInputMessage, context: AgentContext): Promise<AgentResponse> {
    const promisedStep = this.sendToRemoteAgent(input);

    context.onProgress({ type: 'content', content: `Sending to remote agent at ${this.hostUrl}...\n\n` });

    const [step, content] = await promisedStep;

    if (step.is_last) {
      this.taskId = undefined;
    }

    context.onProgress({ type: 'content', content: content + '\n\n' });

    const { command } = step.additional_output || {};
    if (command) {
      // TODO: ask_user(question: string)
      ToolManager.executeTool(command.name, context, command.args);
    }

    // status: 'completed'
    return { reply: { content }, status: step.is_last ? AgentResponseStatus.DONE : AgentResponseStatus.NEXT_STEP };
  }

  private async sendToRemoteAgent(input: AgentInputMessage): Promise<[Step, string]> {
    const apInput: string = typeof input.content === 'string' ? input.content : JSON.stringify(input.content);
    if (!this.taskId) {
      this.logger.info('Creating new agent task');
      const task = await createAgentTask({ input: apInput }, this.hostUrl);
      this.taskId = task.task_id;
    } else {
      this.logger.debug('Continuing existing agent task', this.taskId);
    }

    const step = await executeAgentTaskStep(this.taskId, { input: apInput }, this.hostUrl);
    const content =
      // AutoGPT
      step.additional_output?.thoughts?.speak ||
      // Standard Agent Protocol
      step.output ||
      '(no response from remote agent)';

    return [step, content];
  }
}
