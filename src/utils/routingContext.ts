import { AgentRoutingContext } from '../types/AgentsYml';

export const normaliseRoutingContext = (context: AgentRoutingContext) => {
  Object.keys(context).forEach((key) => {
    context[key] = context[key].map((value) => value.toLowerCase().replace(/^a-z/g, ''));
  });
};
