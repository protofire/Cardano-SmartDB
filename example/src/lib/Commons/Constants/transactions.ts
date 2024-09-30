import { Script } from 'lucid-cardano';
import { scriptSchema, yup } from 'smart-db/backEnd';

export const DUMMY_CREATE = 'Dummy - Create';
export const DUMMY_CLAIM = 'Dummy - Claim';
export const DUMMY_UPDATE = 'Dummy - Update';

export interface CreateDummyTxParams {
    datumID_CS: string;
    datumID_TN: string;
    validatorAddress: string;
    mintingIdDummy: Script;
    ddValue: number;
}

export interface ClaimDummyTxParams {
    datumID_CS: string;
    datumID_TN: string;
    mintingIdDummy: Script;
    validatorDummy: Script;
    dummy_id: string;
}

export interface UpdateDummyTxParams {
    datumID_CS: string;
    datumID_TN: string;
    validatorAddress: string;
    validatorDummy: Script;
    dummy_id: string;
    ddValue: number;
}

export const createDummyTxParamsSchema = yup.object().shape({
    datumID_CS: yup.string().required(),
    datumID_TN: yup.string().required(),
    validatorAddress: yup.string().required(),
    mintingIdDummy: scriptSchema.required(),
    ddValue: yup.number().required(),
});

export const claimDummyTxParamsSchema = yup.object().shape({
    datumID_CS: yup.string().required(),
    datumID_TN: yup.string().required(),
    mintingIdDummy: scriptSchema.required(),
    validatorDummy: scriptSchema.required(),
    dummy_id: yup.number().required(),
});

export const updateDummyTxParamsSchema = yup.object().shape({
    datumID_CS: yup.string().required(),
    datumID_TN: yup.string().required(),
    validatorAddress: yup.string().required(),
    validatorDummy: scriptSchema.required(),
    dummy_id: yup.string().required(),
    ddValue: yup.number().required(),
});

export const FREE_CREATE = 'Free - Create';
export const FREE_CLAIM = 'Free - Claim';
export const FREE_UPDATE = 'Free - Update';

export interface CreateFreeTxParams {}

export interface ClaimFreeTxParams {
    free_ids: string[];
}

export interface UpdateFreeTxParams {
    valueToAdd: number;
    useSmartSelection: boolean;
    useRead: boolean;
}

export const createFreeTxParamsSchema = yup.object().shape({});

export const claimFreeTxParamsSchema = yup.object().shape({
    free_id: yup.number().required(),
});

export const updateFreeTxParamsSchema = yup.object().shape({
    valueToAdd: yup.number().required(),
    useSmartSelection: yup.boolean().required(),
    useRead: yup.boolean().required(),
});
