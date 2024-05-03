import { AuthBackEnd } from 'smart-db/backEnd';
import { initAllDecoratorsExample } from '@example/src/lib/DummyExample/backEnd';
initAllDecoratorsExample();
export default AuthBackEnd.getChallengueTokenApiHandler.bind(AuthBackEnd)