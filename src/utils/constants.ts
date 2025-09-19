import jwt from "jsonwebtoken";

export const enum SERVER_RESPONSE_CODES {
    ACCEPTED = 200,
    CREATED = 201,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    BAD_PAYLOAD = 400,
    SERVER_ERROR = 500,
    UNAVAILABLE = 503,
}

export interface DecodedToken {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export function decodeSessionToken(token: string): DecodedToken | null {
  try {
    // Note: In a real application, you would verify the token with a secret
    // For now, we'll just decode it without verification
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error("Error decoding session token: ", error);
    return null;
  }
} 