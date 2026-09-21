import jwt from 'jsonwebtoken';
import { serverConfig } from '../../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, serverConfig.jwtSecret, {
    expiresIn: serverConfig.jwtExpiresIn as string,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, serverConfig.jwtSecret) as TokenPayload;
};
