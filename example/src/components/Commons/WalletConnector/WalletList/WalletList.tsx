import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './WalletList.module.scss'; // Assuming you will create a SCSS module
import LoaderButton from '../../LoaderButton/LoaderButton';
import { CardanoWallet, IUseWalletStore, LucidToolsFrontEnd, WALLET_ETERNL_ICON } from 'smart-db';
import { Lucid } from 'lucid-cardano';

interface Props {
    walletStore: IUseWalletStore;
    walletSelected: string | undefined;
    walletConnect: (wallet: CardanoWallet, createSignedSession: boolean, forceConnect?: boolean, closeModal?: boolean, tryAgain?: boolean) => Promise<void>;
    walletFromSeedConnect: (walletSeed: string, createSignedSession: boolean, forceConnect?: boolean, closeModal?: boolean) => Promise<void>;
    walletFromKeyConnect: (walletKey: string, createSignedSession: boolean, forceConnect?: boolean, closeModal?: boolean) => Promise<void>;
    walletInstall: (wallet: CardanoWallet) => Promise<void>;
    createSignedSession: boolean;
}

const WalletList: React.FC<Props> = ({ walletStore, walletSelected, walletConnect, walletFromSeedConnect, walletFromKeyConnect, walletInstall, createSignedSession }) => {
    //--------------------------------------
    return (
        <>
            <div className={styles.walletList}>
                {walletStore.cardanoWallets.map((wallet, index) => (
                    <div key={index}>
                        <button
                            key={wallet.wallet}
                            className={styles.walletDetails}
                            onClick={async () => {
                                if (wallet.isInstalled) {
                                    await walletConnect(wallet, createSignedSession, true, false, true);
                                }
                            }}
                        >
                            <div className={styles.walletLeft}>
                                <Image className={styles.walletImg} src={wallet.icon.href} alt={wallet.name} width={30} height={30} />
                                <p className={styles.text}>{wallet.name}</p>
                                {walletSelected === wallet.wallet && <LoaderButton />}
                            </div>
                            {!wallet.isInstalled && (
                                <div className={styles.walletInstall} onClick={async () => await walletInstall(wallet)}>
                                    Not Installed
                                </div>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
};

export default WalletList;
