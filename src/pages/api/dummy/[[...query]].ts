import { DummyTxApiHandlers } from '@/src/lib/Example-AlwaysSucess/BackEnd/Dummy.BackEnd.Api.Handlers.Tx';
import { initAllDecoratorsExample } from '@/src/lib/Example-AlwaysSucess/backEnd';
// necestary to init all decorators because all the rest of the Apis call the BackeEnd index and thet is where others do the init
initAllDecoratorsExample();
export default DummyTxApiHandlers.mainApiHandler.bind(DummyTxApiHandlers);
