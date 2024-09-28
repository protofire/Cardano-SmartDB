import React from 'react';
import Modal from 'react-modal';
import LoaderButton from '../../../LoaderButton/LoaderButton';
import { useWalletApiKey } from './useWalletApiKey';
import styles from './WalletApiKey.module.scss'; // Assuming you will create a SCSS module

interface Props {}

const WalletApiKey: React.FC<Props> = ({}) => {
    //--------------------------------------
    const { walletStore, isLoadedDetails, isLoadingDetails, isReady, apiToken, isOpen, handleOpen, handleClose, handleCopy } = useWalletApiKey();
    //--------------------------------------
    return (
        <>
            {isReady ? (
                <button
                    onClick={() => {
                        if (walletStore.isGettingWalletsDone === true) handleOpen();
                    }}
                    className={styles.buttonCenterWithLoading}
                >
                    Api Key
                </button>
            ) : null}
            <Modal isOpen={isOpen} onRequestClose={() => handleClose()} contentLabel="Wallet Api Key" className={styles.modal} overlayClassName={styles.overlay}>
                <div className={styles.walletApiKeyContainer}>
                    <h2>Wallet Api Key</h2>
                    {!isLoadedDetails || isLoadingDetails ? (
                        <div className={styles.loadingDiv}>{<LoaderButton />}</div>
                    ) : (
                        <textarea rows={12} cols={60} value={apiToken} readOnly={true} style={{ fontSize: '8px' }}></textarea>
                    )}
                    <button onClick={() => handleCopy()}>Copy</button>
                    <button onClick={() => handleClose()}>Close</button>
                </div>
            </Modal>
        </>
    );
};
Modal.setAppElement('#__next');

export default WalletApiKey;
