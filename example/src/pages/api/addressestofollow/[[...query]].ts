import { initAllDecoratorsExample } from '@example/src/lib/DummyExample/backEnd';
import { AddressToFollowBackEndApiHandlers } from 'smart-db/backEnd'
initAllDecoratorsExample()
export default AddressToFollowBackEndApiHandlers.mainApiHandler.bind(AddressToFollowBackEndApiHandlers);
