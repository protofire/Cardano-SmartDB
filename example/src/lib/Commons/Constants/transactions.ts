import { Script } from 'lucid-cardano';
import { scriptSchema } from 'smart-db/backEnd';
import yup from 'smart-db/Commons/yupLocale';

export const DUMMY_CREATE = 'Dummy - Create';
export const DUMMY_CLAIM = 'Dummy - Claim';
export const DUMMY_UPDATE = 'Dummy - Update';

export interface CreateTxParams {
    datumID_CS: string;
    datumID_TN: string;
    validatorAddress: string;
    mintingIdDummy: Script;
    ddValue: number;
}

export interface ClaimTxParams {
    datumID_CS: string;
    datumID_TN: string;
    mintingIdDummy: Script;
    validatorDummy: Script;
    dummy_id: string;
}

export interface UpdateTxParams {
    datumID_CS: string;
    datumID_TN: string;
    validatorAddress: string;
    validatorDummy: Script;
    dummy_id: string;
    ddValue: number;
}

export const createTxParamsSchema = yup.object().shape({
    datumID_CS: yup.string().required(),
    datumID_TN: yup.string().required(),
    validatorAddress: yup.string().required(),
    mintingIdDummy: scriptSchema.required(),
    ddValue: yup.number().required(),
})

export const claimTxParamsSchema = yup.object().shape({
    datumID_CS: yup.string().required(),
    datumID_TN: yup.string().required(),
    mintingIdDummy: scriptSchema.required(),
    validatorDummy: scriptSchema.required(),
    dummy_id: yup.number().required(),
});

export const updateTxParamsSchema = yup.object().shape({
    datumID_CS: yup.string().required(),
    datumID_TN: yup.string().required(),
    validatorAddress: yup.string().required(),
    validatorDummy: scriptSchema.required(),
    dummy_id: yup.string().required(),
    ddValue: yup.number().required(),
});
