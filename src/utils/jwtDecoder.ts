// utils/jwtDecoder.ts
import { Buffer } from 'buffer';

export interface InviteTokenData {  
  approvalId: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  designation: string;
  department: string;
  iat: number;
  exp: number;
}

export const decodeInviteToken = (token: string): InviteTokenData | null => {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const parsedData = JSON.parse(decoded);
    
    return parsedData as InviteTokenData;
  } catch (error) {
    console.error('Failed to decode invite token:', error);
    return null;
  }
};

export const isTokenExpired = (exp: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return exp < now;
};