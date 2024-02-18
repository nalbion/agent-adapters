import { RoutingContext } from '..';
import { StepRequirement } from './WorkflowSchema';

export const areRequirementsMet = (context: RoutingContext, requirements?: StepRequirement[]) => {
  if (!requirements) {
    return true;
  }

  return requirements.every((requirement) => {
    // is the required key even in the context?
    if (!(requirement.name in context)) {
      if (requirement.condition === 'undefined') {
        return true;
      }
      return false;
    }

    const contextValue = context[requirement.name];

    if (requirement.condition) {
      if (requirement.condition === 'undefined') {
        return contextValue === undefined;
      }
      if (typeof requirement.condition === 'number') {
        return Array.isArray(contextValue) || typeof contextValue === 'string'
          ? contextValue.length >= requirement.condition
          : false;
      }
      if (Array.isArray(contextValue)) {
        return contextValue.includes(requirement.condition);
      }
      if (
        typeof contextValue === 'string' &&
        requirement.condition.startsWith('/') &&
        requirement.condition.endsWith('/')
      ) {
        return new RegExp(requirement.condition).test(contextValue);
      }
    }

    return !!contextValue;
  });
};
