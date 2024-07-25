import {
  LoginTicket,
  OAuth2Client,
  VerifyIdTokenOptions,
} from 'google-auth-library';

export class GoogleOAuth2 {
  private static _instance: OAuth2Client;

  private static getOAuth2Client(): OAuth2Client {
    if (!GoogleOAuth2._instance) {
      GoogleOAuth2._instance = new OAuth2Client();
    }
    return GoogleOAuth2._instance;
  }

  public static async verifyIdToken(
    verifyOptions: VerifyIdTokenOptions
  ): Promise<LoginTicket> {
    return GoogleOAuth2.getOAuth2Client().verifyIdToken(verifyOptions);
  }
}

export default GoogleOAuth2;
