import { ARROW_BUTTON } from '../../Commons/Constants/images.js';
// import styles from './OpenInNewTabButton.module.css';
// comment the import and set classname to avoid css module error

export default function OpenInNewTabButton({ url }: { url: string }) {
    function handleBtnOpen(url: string) {
        window.open(url, '_blank');
    }
    return (
        <img
            onClick={() => handleBtnOpen(url)}
            width="19"
            height="19"
            className="OpenInNewTabButton-icon" // Unique class name for this component
            src={ARROW_BUTTON.toString()}
            alt="Open in new tab"
        />
    );
}
