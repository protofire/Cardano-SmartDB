import { DummyTxApiHandlers } from '@/src/lib/DummyExample/BackEnd/Dummy.BackEnd.Api.Handlers.Tx';
import { initAllDecoratorsExample } from '@/src/lib/DummyExample/backEnd';
// necestary to init all decorators because all the rest of the Apis call the BackeEnd index and thet is where others do the init
initAllDecoratorsExample();
export default DummyTxApiHandlers.mainApiHandler.bind(DummyTxApiHandlers);
