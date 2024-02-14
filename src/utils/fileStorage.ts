import createStorage, { FileStorage, FileStorageConfig, LocalFileStorage } from 'any-cloud-storage';

export let fileStorage: FileStorage = new LocalFileStorage({ type: 'file', basePath: '' });

export const useAnyCloudStorage = async (config: FileStorageConfig) => {
  fileStorage = await createStorage(config);
  return fileStorage;
};
