import { ModelConfig } from '../types';

export default class ModelManager {
  private static models?: ModelConfig[];

  static setModelConfigList(models: ModelConfig[] | undefined) {
    if (!models) {
      throw new Error(
        'At least one model must be configured through agents.yml or the OAI_CONFIG_LIST environment variable/json file',
      );
    }
    ModelManager.models = models;
  }

  static getModelConfig(name?: string, configList?: ModelConfig[]): ModelConfig {
    if (!configList) {
      configList = ModelManager.models;
    }

    if (!configList) {
      throw new Error(
        'Model config must be provided to setModelConfigList() at initialisation, or this call to getModelConfig()',
      );
    }

    if (!name) {
      // no name, return the first model
      return configList[0];
    }
    // find the model with the given name
    let model = configList.find((config) => config.model === name);

    if (!model) {
      console.warn(`Model ${name} not found, using first model instead`);
      model = configList[0];
    }

    if (!model) {
      throw new Error('No model found');
    }

    return model;
  }
}
