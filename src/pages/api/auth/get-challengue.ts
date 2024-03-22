import { initAllDecorators } from '@/src/lib/SmartDB/backEnd';
import { AuthBackEnd } from '@/src/lib/SmartDB/lib/Auth/backEnd';
initAllDecorators();
export default AuthBackEnd.getChallengueTokenApiHandler.bind(AuthBackEnd)