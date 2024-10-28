import { UTxO } from 'lucid-cardano';
import { useModalDatum } from './useModalDatum';
import styles from './ModalDatum.module.scss';
import { CLOSE, CopyButton, formatUTxO, OpenInNewTabButton, toJson } from 'smart-db';
import Image from 'next/image';

export const ModalDatum = ({ uTxO }: { uTxO: UTxO }) => {
    //--------------------------------------
    const { appStore, isRefreshing, datumType, datumObject, isOpen, handleOpen, handleClose } = useModalDatum({ uTxO });
    //--------------------------------------
    return (
        <>
            {uTxO.datum !== undefined ? datumType !== undefined ? <button onClick={handleOpen}>{datumType} Datum</button> : <p>Unknown Datum</p> : <p>No Datum</p>}
            {datumObject !== undefined && isOpen === true ? (
                <div className={styles.modal}>
                    <div className={`${styles.main}`}>
                        <div className={styles.popUp}>
                            <>
                                <header className={styles.headerModal}>
                                    <h2 className={styles.titleModal}>Datum</h2>
                                    <Image width={24} height={24} className={styles.icon} src={CLOSE.toString()} onClick={handleClose} alt="Close icon" />
                                </header>
                                <div className={styles.rowSettings}>
                                    UTxO:
                                    {formatUTxO(uTxO.txHash, uTxO.outputIndex)}
                                    <CopyButton content={uTxO.txHash + '#' + uTxO.outputIndex} />
                                    <OpenInNewTabButton
                                        url={
                                            appStore.siteSettings !== undefined
                                                ? `${appStore.siteSettings.getblockfrost_url_explorer_utxo(uTxO.txHash + '#' + uTxO.outputIndex)}`
                                                : ``
                                        }
                                    />
                                </div>
                                <br />
                                <div className={styles.verticalScroll}>
                                    <table className={styles.tableModal}>
                                        <thead>
                                            <tr>
                                                <th>Field</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(datumObject).map((key: any, index: number) => (
                                                <tr key={index}>
                                                    <td>{key}</td>
                                                    <td>{toJson(datumObject[key], 4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
    //--------------------------------------
};
