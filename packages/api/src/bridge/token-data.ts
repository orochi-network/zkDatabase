import { JwtPayload } from "../authentication/types/jwt-payload";

let getOutsideJwtPayload: (() => JwtPayload | null) | null = null;

export function setJwtPayloadFunction(fn: () => JwtPayload | null): void {
  getOutsideJwtPayload = fn;
}

export function getJwtPayload(): JwtPayload | null {
  if (getOutsideJwtPayload) {
    const data = getOutsideJwtPayload();
    return data;
  } else {
    return null;
  }
}
