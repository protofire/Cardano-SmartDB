import { randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import { globalSettings } from '../../Commons/BackEnd/globalSettings.js';
import { VALID_SESSION_DURATION_MS, VALID_SESSION_DURATION_STR } from '../../Commons/Constants/constants.js';
import { ChallengueJWTPayload, TokenJWTPayload } from './types.js';

export async function generateChallengueToken() {
    //-------------------------
    const secret = process.env.LOGIN_JWT_SECRET_KEY!;
    //-------------------------
    const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
    //-------------------------
    const serverTime = await TimeBackEnd.getServerTime(false);
    //------------------------------------
    // Create JWT token
    //--------------------------------------
    const jwtPayload: ChallengueJWTPayload = {
        siteSecret: globalSettings.siteSettings!.siteSecret,
        timestamp: serverTime,
    };
    const token = sign(jwtPayload, secret, { expiresIn: VALID_SESSION_DURATION_STR });
    //--------------------------------------
    return token;
}

export async function validateChallengueToken(token: string) {
    //-------------------------
    const secret = process.env.LOGIN_JWT_SECRET_KEY!;
    //-------------------------
    let jwtPayload: TokenJWTPayload;
    try {
        jwtPayload = verify(token, secret) as TokenJWTPayload;
    } catch (error) {
        throw `JWT Token verification failed`;
    }
    //-------------------------
    const siteSecret = jwtPayload.siteSecret;
    const timestamp = jwtPayload.timestamp;
    const exp = jwtPayload.exp;
    //-------------------------
    if (siteSecret === undefined || siteSecret !== globalSettings.siteSettings!.siteSecret || timestamp === undefined || exp === undefined) {
        throw `JWT Token Invalid`;
    }
    //-------------------------
    const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
    //-------------------------
    const serverTime = await TimeBackEnd.getServerTime(false);
    //------------------------------------
    if (serverTime > timestamp + VALID_SESSION_DURATION_MS || serverTime > exp * 1000) {
        throw `JWT Token Expired`;
    }
    //------------------------------------
    return jwtPayload;
}

export async function isValidChallengueToken(token: string) {
    //-------------------------
    try {
        await validateChallengueToken(token);
        return true;
    } catch (error) {
        return false;
    }
}

export const generateCsrfToken = () => {
    return randomBytes(32).toString('hex');
};

export const isValidCsrfToken = (req: NextApiRequest): boolean => {
    const csrfTokenCookie = req.cookies['x-csrf-token'];
    // console.log('csrfTokenCookie', csrfTokenCookie)
    const csrfTokenHeader = req.headers['x-csrf-token'];
    // console.log('csrfTokenHeader', csrfTokenHeader)
    return csrfTokenCookie !== undefined && csrfTokenCookie === csrfTokenHeader;
};
