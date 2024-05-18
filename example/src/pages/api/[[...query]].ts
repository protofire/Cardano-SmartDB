import { initBackEnd } from '@example/src/lib/DummyExample/backEnd';
import { smartDBMainApiHandler } from 'smart-db/backEnd';
initBackEnd();

export const config = {
    api: {
        bodyParser: false,
    },
};

export default smartDBMainApiHandler.bind(smartDBMainApiHandler);
