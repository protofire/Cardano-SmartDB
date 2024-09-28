import * as yup from 'yup';
import { BSON } from 'bson';
import { StringSchema, MixedSchema } from 'yup';

declare module 'yup' {
    interface StringSchema {
        isValidID(message?: string): this;
    }
    interface MixedSchema {
        bigint(message?: string): this;
    }
}

yup.setLocale({
    mixed: {
        notType: '${label} is not a valid ${type}',
        // Add more custom messages for other validation types if needed
    },
});

// Add custom validation method to yup
yup.addMethod(yup.string, 'isValidID', function (message) {
    return this.test('is-valid-id', message, function (value: any) {
        const { path, createError } = this;

        // Check if the value is a valid 24-character hex string
        const isHexString = value !== undefined && /^[a-f0-9]{24}$/i.test(value);

        // Check if the value is a 12-byte Uint8Array
        const isUint8Array = value !== undefined && value instanceof Uint8Array && value.length === 12;

        // Check if the value is an integer
        const isInteger = value !== undefined && Number.isInteger(Number(value));

        if (isHexString || isUint8Array || isInteger) {
            return true;
        }

        // Return a custom error message
        return createError({ path, message: message || 'ID must be a 24-character hex string, a 12-byte Uint8Array, or an integer' });
    });
});

// Define a custom validation for bigint
yup.addMethod(yup.mixed, 'bigint', function (message) {
    return this.transform(function (value, originalValue) {
        if (typeof originalValue === 'string' || typeof originalValue === 'number') {
            return BigInt(Number(originalValue)); // Cast to bigint directly here
        }
        return value;
    }).test('bigint', message, function (value) {
        const { path, createError } = this;
        return typeof value === 'bigint' || createError({ path, message: message ?? 'Value must be a bigint' });
    });
});

export { yup };
