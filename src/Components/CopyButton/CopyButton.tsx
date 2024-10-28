// import styles from './CopyButton.module.css';
import { useCopyButton } from './useCopyButton.js';
import { COPY } from '../../Commons/Constants/images.js';
import { isNullOrBlank } from '../../Commons/utils.js';

export default function CopyButton({ content }: { content: string }) {
    //--------------------------------------
    const { handleBtnCopy } = useCopyButton();
    //--------------------------------------
    return (
        <>
            {isNullOrBlank(content) === false && (
                <img
                    width="12"
                    height="12"
                    className="CopyButton-icon" // Unique class name for this component
                    src={COPY.toString()}
                    onClick={() => handleBtnCopy(content)}
                    alt="Copy Icon"
                />
            )}
        </>
    );
}
