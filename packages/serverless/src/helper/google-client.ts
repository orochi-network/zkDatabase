import { Singleton } from '@orochi-network/framework';
import {
  LoginTicket,
  OAuth2Client,
  VerifyIdTokenOptions,
} from 'google-auth-library';

export class GoogleOAuth2 {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client();
  }

  public async verifyIdToken(
    verifyOptions: VerifyIdTokenOptions
  ): Promise<LoginTicket> {
    return this.googleClient.verifyIdToken(verifyOptions);
  }
}

const GoogleOAuth2Instance = Singleton<GoogleOAuth2>(
  'google-oauth2',
  GoogleOAuth2
);

export default GoogleOAuth2Instance;
