import { IUser } from '../model/user';
import { ModelProfile } from '../model/profile';
import JWTAuthenInstance from '../helper/jwt';
import { saveCacheToken } from './redis';

export interface IFacebookData {
  id: string;
  name: string;
  email?: string;
}

export class UserService {
  public static async genUserJwt(user: IUser, email: string = '') {
    const imProfile = new ModelProfile();
    const userProfile = await imProfile.getProfile(user.id);
    const token = await JWTAuthenInstance.sign({
      uuid: user.uuid,
      email,
      name: user.name,
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
    });

    return token;
  }

  public static async genUserJwtAndSaveCache(user: IUser, email?: string) {
    const token = await UserService.genUserJwt(user, email);
    await saveCacheToken(user.id, token);
    return token;
  }
}

export default UserService;
