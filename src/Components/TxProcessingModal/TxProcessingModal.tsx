// import CopyButton from '@/src/components/AppComponents/CopyButton/CopyButton';
// import OpenInNewTabButton from '@/src/components/AppComponents/OpenInNewTabButton/OpenInNewTabButton';
// import { Button } from '@/src/components/Commons/Button';
// import FailedIcon from '@/src/components/Commons/FailedIcon/FailedIcon';
// import LoaderButton from '@/src/components/Commons/LoaderButton/LoaderButton';
// import SuccessIcon from '@/src/components/Commons/SuccessIcon/SuccessIcon';
// import { formatHash } from '@/src/lib/SmartDB';
// import { useAppStore } from '@/src/store/global';
// import { TASK } from '@/src/utils/specific/constants';
// import { CLOSE } from '@/src/utils/specific/images';
// import { ROUTES } from '@/src/utils/specific/routes';
// import { useRouter } from '@/src/store/router/RouterProvider';
// import React, { Dispatch, SetStateAction } from 'react';
// import styles from './TxProcessingModal.module.scss';

// interface TxProcessingModalProps {
//     showProcessingTx: boolean;
//     setShowProcessingTx: Dispatch<SetStateAction<boolean>>;
//     isProcessingTx: boolean;
//     processingTxMessage: string;
//     processingTxHash: string;
//     isFaildedTx: boolean;
//     isConfirmedTx: boolean;
//     onNewTx?: () => Promise<void>;
//     onFinishTx?: () => Promise<void>;
//     onTryAgainTx?: () => Promise<void>;
//     showNewTransactionButton?: boolean;
//     showViewTransactionsButton?: boolean;
//     showTryAgainTransactionButton?: boolean;
//     nameForNewTransactionButton?: string;
//     nameForTryAgainButton?: string;
//     nameForFinishButton?: string;
//     othersButtonsWhenConfirmed?: React.ReactNode;
//     othersButtonsWhenFailed?: React.ReactNode;
// }

// const TxProcessingModal: React.FC<TxProcessingModalProps> = (props) => {
//     const {
//         showProcessingTx,
//         setShowProcessingTx,
//         isProcessingTx,
//         isFaildedTx,
//         isConfirmedTx,
//         processingTxMessage,
//         processingTxHash,
//         othersButtonsWhenConfirmed,
//         othersButtonsWhenFailed,
//     } = props;
//     //--------------------------------------
//     const nameForNewTransactionButton = props.nameForNewTransactionButton !== undefined ? props.nameForNewTransactionButton : 'New Transaction';
//     const nameForTryAgainButton = props.nameForTryAgainButton !== undefined ? props.nameForTryAgainButton : 'Try Again';
//     const nameForFinishButton = props.nameForFinishButton !== undefined ? props.nameForFinishButton : 'Close';
//     //--------------------------------------
//     const showNewTransactionButton = props.showNewTransactionButton !== undefined ? props.showNewTransactionButton : false;
//     const showViewTransactionsButton = props.showViewTransactionsButton !== undefined ? props.showViewTransactionsButton : false;
//     const showTryAgainTransactionButton = props.showTryAgainTransactionButton !== undefined ? props.showTryAgainTransactionButton : false;
//     //--------------------------------------
//     const appStore = useAppStore();
//     //--------------------------------------
//     const router = useRouter();
//     //--------------------------------------
//     return (
//         showProcessingTx === true &&
//         (isProcessingTx === true || isConfirmedTx === true || isFaildedTx === true) && (
//             <div className={styles.modal}>
//                 <div className={`${styles.main} ${styles.txModal}`}>
//                     <div className={styles.popUp}>
//                         {isProcessingTx ? (
//                             <>
//                                 <header className={styles.headerModal}>
//                                     <LoaderButton />
//                                     <h2 className={styles.titleModal}>PROCESSING YOUR TRANSACTION</h2>
//                                     <svg width="45" height="45" className={styles.icon} onClick={() => setShowProcessingTx(false)}>
//                                         <use href={CLOSE}></use>
//                                     </svg>
//                                 </header>
//                                 <div className={styles.txContainer}>
//                                     <div className={styles.textPart}>
//                                         <p className={styles.text}>{processingTxMessage}</p>
//                                         {processingTxHash !== undefined && processingTxHash !== '' ? (
//                                             <div className={styles.txHash}>
//                                                 <p className={styles.hash}>Tx Hash: {formatHash(props.processingTxHash)}</p>
//                                                 <CopyButton content={props.processingTxHash} />
//                                                 <OpenInNewTabButton
//                                                     url={
//                                                         appStore.siteSettings !== undefined ? `${appStore.siteSettings.getblockfrost_url_explorer_tx(props.processingTxHash)}` : ``
//                                                     }
//                                                 />
//                                             </div>
//                                         ) : null}
//                                     </div>
//                                 </div>
//                             </>
//                         ) : isConfirmedTx ? (
//                             <>
//                                 <header className={styles.headerModal}>
//                                     <SuccessIcon />
//                                     <h2 className={styles.titleModal}>CONGRATULATIONS</h2>
//                                     <svg width="45" height="45" className={styles.icon} onClick={() => setShowProcessingTx(false)}>
//                                         <use href={CLOSE}></use>
//                                     </svg>
//                                 </header>
//                                 <div className={styles.txContainer}>
//                                     <div className={styles.textPart}>
//                                         <p className={styles.text}>We are thrilled to inform you that your recent transaction on our crypto app has been completed successfully!</p>
//                                         {processingTxHash !== undefined && processingTxHash !== '' ? (
//                                             <div className={styles.txHash}>
//                                                 <p className={styles.hash}>Tx Hash: {formatHash(props.processingTxHash)}</p>
//                                                 <CopyButton content={props.processingTxHash} />
//                                                 <OpenInNewTabButton
//                                                     url={
//                                                         appStore.siteSettings !== undefined ? `${appStore.siteSettings.getblockfrost_url_explorer_tx(props.processingTxHash)}` : ``
//                                                     }
//                                                 />
//                                             </div>
//                                         ) : null}
//                                         <p className={styles.text}>What do you want to do next?</p>
//                                     </div>
//                                     <div className={styles.btnGroup}>
//                                         {showNewTransactionButton ? (
//                                             <Button
//                                                 mode="outline-no-arrow"
//                                                 width={'100%'}
//                                                 onClick={() => {
//                                                     props.onNewTx?.();
//                                                 }}
//                                             >
//                                                 {nameForNewTransactionButton}
//                                             </Button>
//                                         ) : null}
//                                         {othersButtonsWhenConfirmed}
//                                         {showViewTransactionsButton === true && (
//                                             <Button
//                                                 mode="outline"
//                                                 width={'100%'}
//                                                 onClick={async () => {
//                                                     setShowProcessingTx(false);
//                                                     await router.push({
//                                                         pathname: ROUTES.PORTFOLIO,
//                                                         query: { Task: TASK.TRANSACTIONS },
//                                                     });
//                                                 }}
//                                             >
//                                                 View Transactions
//                                             </Button>
//                                         )}
//                                         <Button mode="link" size='small'  onClick={() => props.onFinishTx?.()}>
//                                             {nameForFinishButton}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </>
//                         ) : isFaildedTx ? (
//                             <>
//                                 <header className={styles.headerModal}>
//                                     <FailedIcon />
//                                     <h2 className={styles.titleModal}>SOMETHING WENT WRONG</h2>
//                                     <svg width="45" height="45" className={styles.icon} onClick={() => setShowProcessingTx(false)}>
//                                         <use href={CLOSE}></use>
//                                     </svg>
//                                 </header>
//                                 <div className={styles.txContainer}>
//                                     <div className={styles.textPart}>
//                                         <p className={styles.text}>We are very sorry to inform you that your recent transaction has failed! You can try again!</p>
//                                         <p className={styles.text}>{processingTxMessage}</p>
//                                     </div>
//                                     <div className={styles.btnGroup}>
//                                         {showTryAgainTransactionButton && (
//                                             <Button mode="outline-no-arrow" width={'100%'} onClick={() => props.onTryAgainTx?.()}>
//                                                 {nameForTryAgainButton}
//                                             </Button>
//                                         )}
//                                         {othersButtonsWhenFailed}
//                                         <Button mode="link" size='small'  onClick={() => props.onFinishTx?.()}>
//                                             {nameForFinishButton}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </>
//                         ) : null}
//                     </div>
//                 </div>
//             </div>
//         )
//     );
// };

// export default TxProcessingModal;
