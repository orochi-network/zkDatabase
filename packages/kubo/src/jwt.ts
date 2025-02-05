import pkg from "crypto-js";

const {
  HmacSHA256,
  enc,
  lib: { WordArray: _WordArray },
} = pkg;

export type TWordArray = typeof _WordArray;

export class JWT {
  private userName: string;
  private secretKey: any;

  // Init a instance of OrandHmac
  // Key need to be a hex string or based64
  constructor(userName: string, secretKey: string) {
    if (/^(0x|)[0-9a-f]+$/gi.test(secretKey)) {
      this.secretKey = enc.Hex.parse(secretKey.replace(/^0x/gi, ""));
    } else {
      this.secretKey = enc.Base64.parse(secretKey);
    }
    this.userName = userName;
  }

  // Sign message with a secret key
  private sign(message: string): any {
    return HmacSHA256(message, this.secretKey);
  }

  public authentication(): string {
    /* const header = enc.Utf8.parse(
          JSON.stringify({
            alg: 'HS256',
            typ: 'JWT',
          }),
        ); */
    const payload = enc.Utf8.parse(
      JSON.stringify({
        userName: this.userName,
        // eslint-disable-next-line no-bitwise
        nonce: (Math.random() * 0xffffffff) >>> 0,
        timestamp: Date.now(),
      })
    );
    const signature = HmacSHA256(payload, this.secretKey);
    return `bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${enc.Base64url.stringify(
      payload
    )}.${enc.Base64url.stringify(signature)}`;
  }
}
