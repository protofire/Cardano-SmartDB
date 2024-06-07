import { Script } from 'lucid-cardano';

export const DUMMY_CREATE = 'Dummy - Create';
export const DUMMY_CLAIM = 'Dummy - Claim';
export const DUMMY_UPDATE = 'Dummy - Update';

export interface CreateTxParams {
    ddValue: bigint;
    datumID_CS: string;
    datumID_TN: string;
    validatorAddress: string;
    mintingIdDummy: Script;
}

export interface ClaimTxParams {
    datumID_CS: string;
    datumID_TN: string;
    dummy_id: string;
    mintingIdDummy: Script;
    validatorDummy: Script;
}

export interface UpdateTxParams {
    ddValue: bigint;
    datumID_CS: string;
    datumID_TN: string;
    dummy_id: string;
    validatorAddress: string;
    validatorDummy: Script;
}
