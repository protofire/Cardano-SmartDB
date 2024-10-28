import Image from 'next/image';
import React from 'react';
import { DISCONNECT, IUseWalletStore } from 'smart-db';
import WalletApiKey from './WalletApiKey/WalletApiKey';
import styles from './WalletInfo.module.scss'; // Assuming you will create a SCSS module
import { ModalUTxOsAndBalance } from '../../ModalUTxOs/ModalUTxOs';

interface Props {
    walletStore: IUseWalletStore;
    walletDisconnect: (closeModal?: boolean) => Promise<void>;
}

const WalletInfo: React.FC<Props> = ({ walletStore, walletDisconnect }) => {
    //--------------------------------------
    return (
        <>
            <h2>
                YOUR WALLET [{walletStore.info!.isWalletFromKey === true ? 'Key' : walletStore.info!.isWalletFromSeed === true ? 'Seed' : walletStore.info!.walletNameOrSeedOrKey}]
            </h2>
            <div className={styles.walletInfo}>
                <ModalUTxOsAndBalance address={walletStore.info!.address} uTxOs={walletStore.uTxOsAtWallet}  showBalance={true}/>
                <WalletApiKey />
                <button key={walletStore.info!.pkh + ' disconnect'} className={styles.walletDetails} onClick={async () => await walletDisconnect(false)}>
                    <Image className={styles.walletImg} src={DISCONNECT.href} alt={'Disconnect'} width={30} height={30}></Image>
                    <p className={styles.text}>Disconnect Wallet</p>
                </button>
            </div>
        </>
    );
};

export default WalletInfo;
