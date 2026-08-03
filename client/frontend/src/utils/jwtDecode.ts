import { jwtDecode as libJwtDecode } from "jwt-decode";

interface BaseDecodedToken {
  exp: number;
  iat: number;
}

interface BaseReturnType<T> {
  decodedToken: T | null;
  isExpired: boolean;
}

const jwtDecode = <T extends BaseDecodedToken>(
  token: string,
): BaseReturnType<T> => {
  try {
    const decodedToken = libJwtDecode<T>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decodedToken.exp < currentTime;

    return { decodedToken, isExpired };
  } catch {
    return { decodedToken: null, isExpired: true };
  }
};

export default jwtDecode;
