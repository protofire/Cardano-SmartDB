import { Lucid } from 'lucid-cardano';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useWalletActions } from 'smart-db';
import LoaderButton from '../LoaderButton/LoaderButton';
import styles from './WalletConnector.module.scss'; // Assuming you will create a SCSS module
import WalletInfo from './WalletInfo/WalletInfo';
import WalletList from './WalletList/WalletList';

interface Props {
    lucid: Lucid;
}

const WalletConnector: React.FC<Props> = ({ lucid }) => {
    //--------------------------------------
    const [privateKey, setPrivateKey] = useState<string>();
    //--------------------------------------
    const [isWalletConnectorModalOpen, setIsWalletConnectorModalOpen] = useState(false);
    //--------------------------------------
    const {
        isRefreshing: isRefreshingWallet,
        session,
        status,
        walletStore,
        createSignedSession,
        setCreateSignedSession,
        walletConnect,
        walletFromSeedConnect,
        walletFromKeyConnect,
        walletInstall,
        walletSelected,
        setWalletSelected,
        walletDisconnect,
    } = useWalletActions();
    //--------------------------------------
    useEffect(() => {
        const fetch = async () => {
            try {
                const privateKey = lucid.utils.generatePrivateKey(); // Bech32 encoded private key
                setPrivateKey(privateKey);
                console.log(`privateKey: ${privateKey}`);
            } catch (e) {
                console.error(e);
            }
        };
        fetch();
    }, []);
    //--------------------------------------
    const handleBtnConnectWallet = async () => {
        setIsWalletConnectorModalOpen(true);
    };
    //--------------------------------------
    return (
        <>
            <button
                onClick={() => {
                    if (walletStore.isGettingWalletsDone === true) handleBtnConnectWallet();
                }}
                className={styles.buttonCenterWithLoading}
            >
                {walletStore.isConnected === false ? <>Connect Wallet</> : <>Wallet Info</>}
                {status === 'loading' || walletStore.isGettingWalletsDone === false || walletStore.isConnecting || walletStore.isLoadingAnyData ? <LoaderButton /> : null}
            </button>
            <Modal
                isOpen={isWalletConnectorModalOpen}
                onRequestClose={() => setIsWalletConnectorModalOpen(false)}
                contentLabel="Connect Wallet"
                className={styles.modal}
                overlayClassName={styles.overlay}
            >
                <div className={styles.walletConnectorContainer}>
                    {walletStore.isConnected === false ? (
                        <>
                            <h2>Connect Wallet</h2>
                            <div className={styles.walletKey}>
                                <div className={styles.subTitle}>Wallet Private Key:</div>
                                <div>
                                    <input name="privateKey" value={privateKey ?? ''} onChange={(e) => setPrivateKey(e.target.value)} />
                                </div>
                                <button
                                    className={styles.buttonCenterWithLoading}
                                    onClick={async () => {
                                        if (privateKey !== undefined) {
                                            await walletFromKeyConnect(privateKey, createSignedSession, true, false);
                                        }
                                    }}
                                >
                                    Connect With Key
                                </button>
                            </div>
                            <WalletList
                                walletStore={walletStore}
                                walletSelected={walletSelected}
                                walletConnect={walletConnect}
                                walletInstall={walletInstall}
                                walletFromSeedConnect={walletFromSeedConnect}
                                walletFromKeyConnect={walletFromKeyConnect}
                                createSignedSession={createSignedSession}
                            />
                        </>
                    ) : (
                        <>
                            <WalletInfo walletStore={walletStore} walletDisconnect={walletDisconnect} />
                        </>
                    )}
                    <button onClick={() => setIsWalletConnectorModalOpen(false)}>Close</button>
                </div>
            </Modal>
        </>
    );
};
Modal.setAppElement('#__next');

export default WalletConnector;
