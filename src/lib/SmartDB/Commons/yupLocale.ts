import * as yup from 'yup';

yup.setLocale({
    mixed: {
        notType: '${label} is not a valid ${type}',
        // Add more custom messages for other validation types if needed
    },
});

export default yup;
