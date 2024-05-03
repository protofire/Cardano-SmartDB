import { JwtPayload } from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import { User } from 'next-auth';

export interface Credentials {
    address: string;
    walletName: string;
    useBlockfrostToSubmit: string;
    isWalletFromSeedOrKey: string;
}

export interface CredentialsAuthenticated extends Credentials {
    challengue: string;
    signedChallengue?: string | undefined;
}

// Extend NextApiRequest to include the user property
export interface NextApiRequestAuthenticated extends NextApiRequest {
    user: User;
}

export interface TokenJWTPayload extends JwtPayload {
    siteSecret: string;
    timestamp: number;
    credentials: CredentialsAuthenticated;
}

export interface ChallengueJWTPayload extends JwtPayload {
    siteSecret: string;
    timestamp: number;
}
