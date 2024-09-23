import { ApiClient, IApiClient } from '@zkdb/api';
import storage from './storage/storage.js';

export class AppContainer {
  private static INSTANCE: AppContainer;

  private apiClient: IApiClient<any>;

  public static getInstance() {
    if (!this.INSTANCE) {
      this.INSTANCE = new AppContainer();
    }

    return this.INSTANCE;
  }

  initializeApiClient(url: string) {
    this.apiClient = ApiClient.newInstance(url);
    this.apiClient.api.setContext(() => {
      return storage.getAccessToken();
    });
  }

  getApiClient() {
    if (this.apiClient) {
      return this.apiClient;
    }

    throw Error('API is not initialized');
  }
}
