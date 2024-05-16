import { initAllDecoratorsExample } from '@example/src/lib/DummyExample/backEnd';
import { smartDBMainApiHandler } from 'smart-db/backEnd';
initAllDecoratorsExample();

export const config = {
    api: {
        bodyParser: false,
        // externalResolver: true,
    },
};

export default smartDBMainApiHandler.bind(smartDBMainApiHandler);
