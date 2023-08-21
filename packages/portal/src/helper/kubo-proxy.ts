import { Singleton } from '@orochi-network/framework';
import { KuboClient } from '@zkdb/kubo';

export class KuboProxy extends KuboClient {
  constructor() {
    super();
  }
}

export const KuboInstance = Singleton<KuboProxy>('kubo-proxy', KuboProxy);

export default KuboInstance;
