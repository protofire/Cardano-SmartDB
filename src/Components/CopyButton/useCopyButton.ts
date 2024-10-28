import { PROYECT_NAME } from "../../Commons/Constants/constants.js";
import { pushSucessNotification } from "../../Commons/pushNotification.js";

export const useCopyButton = () => {
    //--------------------------------------
    const handleBtnCopy = async (content: string) => {
        navigator.clipboard.writeText(content)
        pushSucessNotification(PROYECT_NAME, `Copied to clipboard!`, false);
    };
    //--------------------------------------
    return {
        handleBtnCopy,
    };
    //--------------------------------------
};
