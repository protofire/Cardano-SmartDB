import { AuthBackEnd } from '@/src/lib/SmartDB/lib/Auth/backEnd';
import { initAllDecoratorsExample } from '@/src/lib/DummyExample/backEnd';
initAllDecoratorsExample();
export default AuthBackEnd.getJWTTokenApiHandler.bind(AuthBackEnd)