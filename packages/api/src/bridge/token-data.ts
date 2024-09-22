import { JwtPayload } from "../authentication/types/jwt-payload.js";

let getOutsideJwtToken: (() => JwtPayload | null) | null = null;

export function setJwtTokenFunction(fn: () => JwtPayload | null): void {
  getOutsideJwtToken = fn;
}

export function getJwtToken(): JwtPayload | null {
  if (getOutsideJwtToken) {
    const data = getOutsideJwtToken();
    return data;
  } else {
    return null;
  }
}
