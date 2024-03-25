import { AuthBackEnd } from '@/src/lib/SmartDB/lib/Auth/backEnd';
import { initAllDecoratorsExample } from '@/src/lib/Example-AlwaysSucess/backEnd';
initAllDecoratorsExample();
export default AuthBackEnd.getChallengueTokenApiHandler.bind(AuthBackEnd)