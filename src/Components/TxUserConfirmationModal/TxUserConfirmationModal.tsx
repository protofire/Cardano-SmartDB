// import React, { useEffect, useState } from 'react';
// import styles from './TxUserConfirmationModal.module.scss';
// import { Token_With_Metadata_And_Amount } from '../../Commons/types.js';
// import { useTokensStore, useWalletStore } from '../../store/useGlobalStore.js';
// import { useTokensStoreGeneral } from '../../hooks/useTokensStoreGeneral.js';
// import { CLOSE } from '../../Commons/Constants/images.js';
// import { formatAmountWithUnit, formatTicker } from '../../Commons/formatters.js';

// interface TxUserConfirmationModalProps {
//     title?: string;
//     isValidTx: boolean;
//     btnTxInvalidName?: string;
//     tokensGive: Token_With_Metadata_And_Amount[];
//     tokensGet: Token_With_Metadata_And_Amount[];
//     showExtraInfo?: boolean;
//     extraInfo?: React.ReactNode;
//     onConfirm: () => Promise<void>;
//     onCancel: () => Promise<void>;
// }

// const TxUserConfirmationModal: React.FC<TxUserConfirmationModalProps> = (props) => {
//     //--------------------------------------
//     const { title, isValidTx, btnTxInvalidName, tokensGive, tokensGet, showExtraInfo, extraInfo, onConfirm, onCancel } = props;
//     //--------------------------------------
//     const tokensStore = useTokensStore();
//     const walletStore = useWalletStore();
//     //--------------------------------------
//     const [isConfirming, setIsConfirming] = useState(false);
//     //--------------------------------------
//     const [tokensGiveWithMetadata, setTokensGiveWithMetadata] = useState<Token_With_Metadata_And_Amount[]>([]);
//     const [tokensGetWithMetadata, setTokensGetWithMetadata] = useState<Token_With_Metadata_And_Amount[]>([]);
//     //--------------------------------------
//     const { isTokensStoreReady, isTokensStoreLoading, setTokensToGet, tokensFromStore } = useTokensStoreGeneral({
//         name: 'TxUserConfirmation',
//         tokensToGet: undefined,
//         conditionInit: () => {
//             return true;
//         },
//         dependenciesInit: [],
//         followUp: undefined,
//         keepAlive: undefined,
//         swAddPrice: true,
//         swAddMetadata: true,
//         initPriceUpdater: false,
//         swHandleCreateJob: true,
//     });
//     //--------------------------------------
//     useEffect(() => {
//         //--------------------------------------
//         const tokensAll = [...tokensGive, ...tokensGet];
//         //--------------------------------------
//         setTokensToGet(tokensAll);
//         //--------------------------------------
//     }, [tokensGive, tokensGet]);
//     //--------------------------------------
//     useEffect(() => {
//         if (isTokensStoreReady === true) {
//             const tokensGiveWithMetadata = tokensGive.map((token) => {
//                 const tokenWithMetadata = tokensStore.getTokenPriceAndMetadata(token.CS, token.TN_Hex);
//                 return { ...tokenWithMetadata, ...token };
//             });
//             setTokensGiveWithMetadata(tokensGiveWithMetadata);
//             //--------------------------------------
//             const tokensGetWithMetadata = tokensGet.map((token) => {
//                 const tokenWithMetadata = tokensStore.getTokenPriceAndMetadata(token.CS, token.TN_Hex);
//                 return { ...tokenWithMetadata, ...token };
//             });
//             setTokensGetWithMetadata(tokensGetWithMetadata);
//             //--------------------------------------
//         }
//     }, [isTokensStoreReady]);
//     //--------------------------------------
//     const onCancelHandle = async () => {
//         setIsConfirming(false);
//         await onCancel();
//     };
//     const onConfirmHandle = async () => {
//         setIsConfirming(true);
//         await onConfirm();
//     };

//     //--------------------------------------
//     return (
//         <div className={styles.modal}>
//             <div className={styles.main}>
//                 <div className={styles.popUp}>
//                     <header className={styles.headerModal}>
//                         <h2 className={styles.titleModal}>{title !== undefined ? title : 'YOUR TRANSACTION'}</h2>
//                         <svg width="45" height="45" className={styles.icon} onClick={() => onCancelHandle()}>
//                             <use href={CLOSE}></use>
//                         </svg>
//                     </header>
//                     <div className={styles.txContainer}>
//                         {/* {fund !== undefined && (
//                             <div className={styles.fundContainer}>
//                                 <div className={styles.tokensGroup}>
//                                     <InvestUnitSmall investUnitWithDetails={fund.investUnit} />
//                                 </div>
//                                 <h3 className={styles.fundName}>
//                                     {fund.name} [{hexToStr(fund.fdFundFT_TN_Hex)}]
//                                 </h3>
//                             </div>
//                         )} */}
//                         {((tokensGiveWithMetadata !== undefined && tokensGiveWithMetadata.length > 0) ||
//                             (tokensGetWithMetadata !== undefined && tokensGetWithMetadata.length > 0)) && (
//                             <div className={styles.txContainerTokenAndInfoPart}>
//                                 {isTokensStoreLoading === false && tokensGiveWithMetadata !== undefined && tokensGiveWithMetadata.length > 0 ? (
//                                     <div className={styles.tokensSection}>
//                                         <div className={styles.valueGroup}>
//                                             <h3 className={styles.valueTitle}>Tokens you give:</h3>
//                                             <div className={`${styles.tokensContainer} ${tokensGiveWithMetadata.length > 2 && styles.needScroll}`}>
//                                                 {tokensGiveWithMetadata.map((token, index) => (
//                                                     <div className={styles.inputGroup} key={index}>
//                                                         <div className={styles.token}>
//                                                             {isTokensStoreReady === false ? (
//                                                                 <div className={styles.tokenLogo}>
//                                                                     <LoaderButton />
//                                                                 </div>
//                                                             ) : (
//                                                                 <TokenLogo token={token} showBorder={false} />
//                                                             )}
//                                                             <h3 className={styles.tokenName}>{formatTicker(token.ticker)}</h3>
//                                                         </div>
//                                                         <div className={styles.input}>{formatAmountWithUnit(token.amount, '', token.decimals, false, token.decimals)}</div>
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ) : isTokensStoreLoading === true && tokensGive.length > 0 ? (
//                                     <div className={styles.tokensSection}>
//                                         <div className={styles.valueGroup}>
//                                             <h3 className={styles.valueTitle}>Tokens you give:</h3>
//                                             <LoaderButton />
//                                         </div>
//                                     </div>
//                                 ) : null}
//                                 {isTokensStoreLoading === false && tokensGetWithMetadata !== undefined && tokensGetWithMetadata.length > 0 ? (
//                                     <div className={styles.tokensSection}>
//                                         <div className={styles.valueGroup}>
//                                             <h3 className={styles.valueTitle}>Tokens you get:</h3>
//                                             <div className={`${styles.tokensContainer} ${tokensGetWithMetadata.length > 2 && styles.needScroll}`}>
//                                                 {tokensGetWithMetadata.map((token, index) => (
//                                                     <div className={styles.inputGroup} key={index}>
//                                                         <div className={styles.token}>
//                                                             {isTokensStoreReady === false ? (
//                                                                 <div className={styles.tokenLogo}>
//                                                                     <LoaderButton />
//                                                                 </div>
//                                                             ) : (
//                                                                 <TokenLogo token={token} showBorder={false} />
//                                                             )}
//                                                             <h3 className={styles.tokenName}>{formatTicker(token.ticker)}</h3>
//                                                         </div>
//                                                         <div className={styles.input}>{formatAmountWithUnit(token.amount, '', token.decimals, false, token.decimals)}</div>
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ) : isTokensStoreLoading === true && tokensGet.length > 0 ? (
//                                     <div className={styles.tokensSection}>
//                                         <div className={styles.valueGroup}>
//                                             <h3 className={styles.valueTitle}>Tokens you get:</h3>
//                                             <LoaderButton />
//                                         </div>
//                                     </div>
//                                 ) : null}
//                             </div>
//                         )}
//                         {showExtraInfo === true && <div className={styles.extraInfo}>{extraInfo}</div>}
//                         {isTokensStoreLoading === false &&
//                             tokensGiveWithMetadata !== undefined &&
//                             tokensGiveWithMetadata.length === 0 &&
//                             tokensGetWithMetadata !== undefined &&
//                             tokensGetWithMetadata.length === 0 && (
//                                 <>
//                                     <div className={styles.infoText}>
//                                         This transaction does not involve token transfers. It is solely responsible for updating, consuming, or deleting a datum.
//                                     </div>
//                                 </>
//                             )}
//                         {/* <div className={styles.infoText}>
//                         <p className={styles.textSmall}>
//                                 Please note, extra {ADA_UI_LETTERS} will be added to cover transaction fees and to secure the UTxO. Final amounts of tokens will be visible on your
//                                 wallet&lsquo;s transaction confirmation poput.
//                             </p> */}
//                         {/* <p className={styles.textSmall}>When you consume those UTxOs, you will receive the extra {ADA_UI_LETTERS} previously secured within those UTxOs.</p> 
//                             </div> */}
//                         {/* <div className={styles.textQuestion}>Do you want to confirm this Transaction?</div> */}
//                     </div>
//                     <div className={styles.btnGroup}>
//                         {isConfirming === true ? (
//                             <Button mode="filled-no-arrow" disabled={true} width={'100%'}>
//                                 <LoaderButton classNameStyle={'black'} />
//                                 PREPARING...
//                             </Button>
//                         ) : isValidTx === true || isTokensStoreLoading === true ? (
//                             <>
//                                 <Button
//                                     mode="outline-no-arrow"
//                                     width={'100%'}
//                                     onClick={() => {
//                                         onConfirmHandle();
//                                     }}
//                                     disabled={isTokensStoreReady === false}
//                                 >
//                                     Confirm Transaction
//                                 </Button>
//                                 <Button mode="link" width={55} onClick={() => onCancelHandle()}>
//                                     Cancel
//                                 </Button>
//                             </>
//                         ) : (
//                             <Button mode="outline-no-arrow" width={'100%'} onClick={() => onCancelHandle()}>
//                                 {btnTxInvalidName !== undefined ? btnTxInvalidName : 'Close'}
//                             </Button>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default TxUserConfirmationModal;
