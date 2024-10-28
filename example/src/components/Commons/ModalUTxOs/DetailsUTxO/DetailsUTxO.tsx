import { UTxO } from 'lucid-cardano';
import { useDetailsUTxOs } from './useDetailsUTxO';
import styles from './DetailsUTxO.module.scss';
import LoaderButton from '../../LoaderButton/LoaderButton';
import {
    CopyButton,
    formatTokenAmount,
    formatTokenNameHexToStr,
    formatUTxO,
    getUrlForImage,
    hexToStr,
    isValidUrl,
    OpenInNewTabButton,
    TOKEN_ICON_GENERIC,
    Token_With_Metadata_And_Amount,
} from 'smart-db';
import { ModalDatum } from '../../ModalDatum/ModalDatum';
import Image from 'next/image';

export const DetailsUTxOs = ({ uTxOs }: { uTxOs: UTxO[] }) => {
    //--------------------------------------
    const { appStore, isRefreshing, isLoadingList, isLoadedList, uTxOsWithDetails, refreshList } = useDetailsUTxOs({ uTxOs });
    //--------------------------------------
    return isLoadingList ? (
        <div className={styles.loadingDiv}>{<LoaderButton />}</div>
    ) : (
        <>
            <table className={styles.tableModal}>
                <thead className={styles.tableHeader}>
                    <tr>
                        <th>Tx Hash # Output Index</th>
                        <th>Datum</th>
                        <th>Assets</th>
                        <th>Script Ref</th>
                    </tr>
                </thead>
                <div className={styles.scrollableTable}>
                    <tbody>
                        {uTxOsWithDetails.map((utxo, index) => (
                            <tr key={index}>
                                <td>
                                    <div className={styles.itemWidthIcons}>
                                        {formatUTxO(utxo.txHash, utxo.outputIndex)}
                                        <CopyButton content={utxo.txHash + '#' + utxo.outputIndex} />
                                        <OpenInNewTabButton
                                            url={
                                                appStore.siteSettings !== undefined
                                                    ? `${appStore.siteSettings.getblockfrost_url_explorer_utxo(utxo.txHash + '#' + utxo.outputIndex)}`
                                                    : ``
                                            }
                                        />
                                    </div>
                                </td>
                                <td>
                                    <ModalDatum uTxO={utxo} />
                                </td>
                                <td>
                                    <table className="ResetTable">
                                        <tbody>
                                            {utxo.assetWithDetails.map((asset: Token_With_Metadata_And_Amount, index: number) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className={styles.logo}>
                                                            <div className={styles.image}>
                                                                {isValidUrl(asset.image) ? (
                                                                    <Image
                                                                        src={getUrlForImage(asset.image!)}
                                                                        width="100%"
                                                                        height="100%"
                                                                        layout="responsive"
                                                                        objectFit="contain"
                                                                        alt={`logo-${hexToStr(asset.TN_Hex)}`}
                                                                        style={{ borderRadius: '50%' }}
                                                                    />
                                                                ) : (
                                                                    <Image
                                                                        src={TOKEN_ICON_GENERIC.toString()}
                                                                        width="100%"
                                                                        height="100%"
                                                                        layout="responsive"
                                                                        objectFit="contain"
                                                                        alt={formatTokenNameHexToStr(asset.TN_Hex)}
                                                                        title={formatTokenNameHexToStr(asset.TN_Hex)}
                                                                        className={styles.tokenImage}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {formatTokenAmount(asset.amount, asset.CS, asset.TN_Hex, asset.decimals, true, 2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </td>
                                <td>{utxo.hasScriptRef}</td>
                            </tr>
                        ))}
                    </tbody>
                </div>
            </table>
        </>
    );
    //--------------------------------------
};
