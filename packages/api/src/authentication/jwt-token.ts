import * as jose from "jose";
import { Context } from "./context.js";

export class JWTAuthentication<T extends jose.JWTPayload> {
  private static instances: Map<string, JWTAuthentication<jose.JWTPayload>> =
    new Map();

  public readonly expiredTime: number | string;

  private secret: Uint8Array;

  private algorithm: string;

  #context = new Context<T>();

  private constructor(
    secret: string,
    algorithm: string = "HS256",
    expiredTime: number | string = "30 days"
  ) {
    this.secret = jose.base64url.decode(secret);
    this.algorithm = algorithm;
    this.expiredTime = expiredTime;
  }

  public setContextCallback(fn: () => T | null): void {
    this.#context.setContextCallback(fn);
  }

  public getToken() {
    return this.#context.getContext();
  }

  public static getInstance<T extends jose.JWTPayload>(
    secret: string,
    algorithm: string = "HS256",
    expiredTime: number | string = "30 days"
  ): JWTAuthentication<T> {
    const key = `${algorithm}-${secret}`;
    if (!JWTAuthentication.instances.has(key)) {
      JWTAuthentication.instances.set(
        key,
        new JWTAuthentication(secret, algorithm, expiredTime)
      );
    }
    return JWTAuthentication.instances.get(key) as JWTAuthentication<T>;
  }

  public async sign(payload: T): Promise<string> {
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: this.algorithm })
      .setIssuedAt()
      .setExpirationTime(this.expiredTime)
      .sign(this.secret);
  }

  public async verify(
    token: string
  ): Promise<{ payload: T } & Pick<jose.JWTVerifyResult, "protectedHeader">> {
    const { payload, protectedHeader } = await jose.jwtVerify(
      token,
      this.secret
    );
    return { payload: payload as T, protectedHeader };
  }

  public async verifyHeader(
    header: string
  ): Promise<{ payload: T } & Pick<jose.JWTVerifyResult, "protectedHeader">> {
    // 7 is length of `Bearer + space`
    return this.verify(header.substring(7));
  }
}

export default JWTAuthentication;
