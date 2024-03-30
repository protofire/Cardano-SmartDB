import { initAllDecoratorsExample } from '@/src/lib/DummyExample/backEnd';
import { AddressToFollowBackEndApiHandlers } from '@/src/lib/SmartDB/backEnd'
initAllDecoratorsExample()
export default AddressToFollowBackEndApiHandlers.mainApiHandler.bind(AddressToFollowBackEndApiHandlers);
