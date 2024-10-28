import { UTxO } from 'lucid-cardano';
import { useModalUTxOsAndBalance } from './useModalUTxOs';
import styles from './ModalUTxOs.module.scss';
import { CLOSE, formatAddress, CopyButton, OpenInNewTabButton } from 'smart-db';
import LoaderButton from '../LoaderButton/LoaderButton';
import { DetailsBalance } from './DetailsBalance/DetailsBalance';
import { DetailsUTxOs } from './DetailsUTxO/DetailsUTxO';
import Image from 'next/image';

export const ModalUTxOsAndBalance = ({ address, uTxOs, showBalance = false }: { address: string; uTxOs?: UTxO[]; showBalance?: boolean }) => {
    //--------------------------------------
    const { appStore, isRefreshing, isLoadingList, list, showBalance_, isOpen, handleOpen, handleClose, setShowBalance } = useModalUTxOsAndBalance({
        address,
        uTxOs,
        showBalance,
    });
    //--------------------------------------
    return (
        <>
            <button onClick={handleOpen}>View {showBalance ? 'Balance' : list.length <= 1 ? 'UTxO' : 'UTxOs'}</button>
            {isOpen ? (
                <div className={styles.modal}>
                    <div className={`${styles.main}`}>
                        <div className={styles.popUp}>
                            <header className={styles.headerModal}>
                                <h2 className={styles.titleModal}>{showBalance_ ? 'Balance' : list.length <= 1 ? 'UTxO' : 'UTxOs'}</h2>
                                <div className={styles.buttonsModal}>
                                    <button
                                        onClick={() => {
                                            setShowBalance(showBalance_ ? false : true);
                                        }}
                                    >
                                        {showBalance_ ? (list.length <= 1 ? 'Show UTxO' : 'Show UTxOs') : 'Show Balance'}
                                    </button>
                                </div>
                                <button className={styles.closeButton} onClick={handleClose}>
                                    <Image width={24} height={24} src={CLOSE.toString()} alt="Close icon" />
                                </button>
                            </header>
                            <div className={styles.rowSettings}>
                                <div className={styles.itemWidthIcons}>
                                    <p className={styles.title}>Address:</p>
                                    <p className={styles.value}>{formatAddress(address)}</p>
                                    <CopyButton content={address} />
                                    <OpenInNewTabButton url={appStore.siteSettings !== undefined ? `${appStore.siteSettings.getblockfrost_url_explorer_address(address)}` : ``} />
                                </div>
                            </div>
                            {showBalance_ ? (
                                <>{isRefreshing || isLoadingList ? <div className={styles.loadingDiv}>{<LoaderButton />}</div> : <DetailsBalance uTxOs={list} />}</>
                            ) : (
                                <>{isRefreshing || isLoadingList ? <div className={styles.loadingDiv}>{<LoaderButton />}</div> : <DetailsUTxOs uTxOs={list} />}</>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
    //--------------------------------------
};
