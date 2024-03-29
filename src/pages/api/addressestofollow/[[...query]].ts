import { initAllDecoratorsExample } from '@/src/lib/Example-AlwaysSucess/backEnd';
import { AddressToFollowBackEndApiHandlers } from '@/src/lib/SmartDB/backEnd'
initAllDecoratorsExample()
export default AddressToFollowBackEndApiHandlers.mainApiHandler.bind(AddressToFollowBackEndApiHandlers);
