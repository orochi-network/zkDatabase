import { isBrowser } from '@utils';
import { PrivateKey } from 'o1js';

export interface AuthenticationTransaction {
  signAndSend(privateKey?: PrivateKey): Promise<void>;
}
