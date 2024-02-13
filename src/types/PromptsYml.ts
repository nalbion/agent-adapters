export interface PromptsYml {
  prompts: PromptConfig[];
}

export interface PromptConfig {
  name: string;
  /** @example Write me a {{sql_language}} query to get this final output:
   * {{output_data}}. Use the tables relationships defined here:
   * {{tables_relationships}}.
   */
  input: string;
  // metadata: {
  //   model: {
  //     name: string;
  //     settings: { model, top_p, max_tokens, temperature };
  //   }
  // }
}
