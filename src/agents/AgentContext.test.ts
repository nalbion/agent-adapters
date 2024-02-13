import { AgentContext } from './AgentContext';

describe('AgentContext', () => {
  describe('mergeRoutingContext', () => {
    it('should merge the routing context correctly', () => {
      // Given
      const existingContext = {
        languages: ['javascript', 'python'],
        project: ['name'],
      };

      const newResponse = {
        languages: ['rust', 'javascript'],
        technologies: ['react'],
        platforms: ['web', 'mobile'],
      };

      const agentContext = new AgentContext();

      // When
      agentContext.mergeRoutingContext(existingContext);
      agentContext.mergeRoutingContext(newResponse);

      // Then
      expect(agentContext.routing).toEqual({
        languages: ['javascript', 'python', 'rust'],
        project: ['name'],
        technologies: ['react'],
        platforms: ['web', 'mobile'],
      });
    });
  });
});
