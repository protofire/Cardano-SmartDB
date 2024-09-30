import { FreeEntity } from '@example/src/lib/SmartDB/Entities';
import { FreeApi } from '@example/src/lib/SmartDB/FrontEnd';
import { Address, Lucid, MintingPolicy, SpendingValidator } from 'lucid-cardano';
import { dirname } from 'path';
import { CS, delay, LucidToolsFrontEnd } from 'smart-db';
import { fileURLToPath } from 'url';
import { createContractUTXOs, createWallets, deleteContractUTXOs, prepareWallets, runTestCase, TestCase } from './helpers';
import { saveExcel, TestResult } from './results';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fileNameResults = 'test_results';

export const CONFIG = {
    MASTER_WALLET_PRIVATE_KEY: 'ed25519_sk18d89yc42qvu2tmpfjsjjgf8r9rhas0kku3f32maae73x2va5thfsvlntdt',
    USERS_WALLETS_PRIVATE_KEYS: [
        'ed25519_sk1dp6ympdrep6za5meluh56c8zv480ju5ckw4rd8ymlnf8ev4jmthq45gkh8',
        'ed25519_sk1anyf3vdxqd3tnm7te98c4fzwwj8kgwfj5k49ldrle67us5r8gzjs8mfevv',
        'ed25519_sk1fayfvp8ps08kmqjhaau9e4p4dnntfpmn53z7zp7y5u35x7tk5ssshpsm68',
        'ed25519_sk1thtkqhsel5nqus03v8ggene88a2ylgc3399y80zp5702y8kyjzzqpkmh5s',
        'ed25519_sk1c2n7vzta5h95q8t6zp6x2m2vptks4ft462lhu0m66l60xwews58sfj74kq',
        'ed25519_sk1zxkqza4wjsumld8lavthg63eqrv9tgfzgphsz7spvxm0u4d0fnfsh3yj8t',
        'ed25519_sk1v872944kaxd47wsdu04pgyrlwge438rgwpze0jnfrucj63qqxv5q4eqwj3',
        'ed25519_sk15qj4ta6ek3m3zam0cmhu97akjl0t4h03y2xst4za223g84f5ansqtxyes2',
        'ed25519_sk1zxrnszguufrpanqawg3ha83squxmrgj94gue7dnzmnpdezlkvpkqyqgwsp',
        'ed25519_sk1nfllk9ma6xtncmkvxhywelceaf7yt9xv5e7ye7h029qcgyx36hkqra50s9',
        'ed25519_sk1ejalsqm84tz2t29ys6arwy37lrse8h8f8yjq5l6245mvvgcs396qsl5cs2',
        'ed25519_sk17rsqnx25p2f2llu4fvepalhpuv7rgfmxh7fd3eced729zg0fvhcqz8tctn',
        'ed25519_sk18tswl8lwfqz0pxtayrxtmxsslhwyh5ayatrj78fn85qgfh250hjshmgusa',
        'ed25519_sk1dgx89zqrw0cuxj92sfl42pw9uphtgx5q774gpshzjeuk2flevahqj0ayuz',
        'ed25519_sk1fmr486xk4v9yaxcvhmwdq5urqhj8yapu6qmcpppmcm8trpta847qt67cn5',
        'ed25519_sk1fca3t67edrqsug58mg2ggw9ced6rd5wzvhz5q5rv4uv053f2hexq79u9u4',
        'ed25519_sk1mknpjcdews5jz32qpqcgsmt0p6qjnlve2nxvyxkj7ud7s4uwy8fq59hcfm',
        'ed25519_sk1qqwfl66tv9pmne7xd4ugmvayv48jatvjsj9xn3kdtjznyldsutps8wwq4d',
        'ed25519_sk1charkqzttyflgj8srztgftrxpk28nptt8efyg099ne7zgd40z3nq0gwq8x',
        'ed25519_sk1c0ysva087d02skmq46r2yqc3ugskryxycz0mzxpjdc6qwxmpl0ms9mp8wy',
    ],
    TX_FEE: 1000000, // 1 ADA en lovelace, ajusta según sea necesario
    SAFETY_MARGIN: 1.5, // Ajusta según sea necesario
    TEST_CASES: [
        { utxos: 2, users: [1, 2, 4], transactionsPerUser: [1, 2] },
        { utxos: 5, users: [2, 5, 10], transactionsPerUser: [1, 2, 4] },
        { utxos: 10, users: [5, 10, 20], transactionsPerUser: [1, 2, 4, 8] },
    ] as TestCase[],
    INITIAL_DELAY_BETWEEN_USERS: 500, // Separación inicial entre usuarios
    DELAY_BETWEEN_TXS: 3000, // Separación entre transacciones
    MAX_RETRIES_TX: 3, // Número máximo de reintentos
    RETRY_DELAY_TX: 3000, // Retardo entre reintentos
    REQUIRED_UTXOS: 5, // Número de UTXOs requeridos para cada billetera
    COLLATERAL_UTXO_VALUE: 5000000n, // 5 ADA en lovelace
    MAX_RETRIES_SETUP: 3, // Número máximo de reintentos en la configuración
    RETRY_DELAY_SETUP: 3000, // Retardo entre reintentos en la configuración
};

describe('Concurrency Tests', () => {
    //--------------------
    let masterWallet: Lucid;
    let walletLucids: Lucid[];
    let allResults: TestResult[] = [];
    let setupInitFailed = true; // New flag to track setup failure
    let policyID_CS: CS;
    let validatorAddress: Address;
    //--------------------
    beforeAll(async () => {
        //--------------------
        try {
            masterWallet = await LucidToolsFrontEnd.initializeLucidWithBlockfrostAndWalletFromPrivateKey(CONFIG.MASTER_WALLET_PRIVATE_KEY);
            walletLucids = await createWallets(masterWallet, CONFIG.TEST_CASES, CONFIG.USERS_WALLETS_PRIVATE_KEYS);
            //--------------------
            await prepareWallets(masterWallet, walletLucids, CONFIG.TEST_CASES, CONFIG.TX_FEE, CONFIG.SAFETY_MARGIN, CONFIG.REQUIRED_UTXOS, CONFIG.COLLATERAL_UTXO_VALUE);
            //--------------------
            //----------------------------
            const cborHexMintingID =
                '590b63590b600100003232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232223232323253353355333573460720022642446004006a666ae68c0dcd55ce9baa357426aae780080440d454ccd5cd181c0008990911800801a999ab9a303735573a6ea8d5d09aab9e0020110350352325335533500102c2213335530260383303022333013037002001301102f23500122333573466e20005200003701500302b1335738921236e6f742069734275726e696e67416c6c546f6b656e4f776e4353416e79416d6f756e7400010350042235002222222222222323304b2253350011302102022135002225333573466e3c00801c4c094c0d80044c01800c024c07c04894cd4cc094d401088d4008888888888888c8c8cc130894cd40044c00c084884d4008894ccd5cd19b8f0020081300730370011300600300a233335530330453303d22333501f0440010023501d03c223355303404723500122330420023355303704a2350012233045002333500137009000380233700002900000099aa981a02391a8009119821001199a800919aa981c02591a800911982300118120008009119981000f801000919aa981c02591a8009119823001181280080099980d80d00080119aa981902291a80091198231982000299823198200010008220221810000998219981ea4500330433303d48810048000104104c07c048cc0cccc0b4c044010cc0cccc0b52210646726565494400480080c40c40a84cd5ce24811d6e6f74206973436f72726563744d696e745f416e645f4f7574707574730000f0111635573a0026ea80114ccd5cd181a1aab9d0011323232321233001003002301a357426ae8800d4ccd5cd181b1aab9d00113232323232323232323232323232323232323232323232321233333333333300101801601401201000e00c0090070050030023035357426ae88008ccc0b5d710009aba10013574400466605605a40026ae84004d5d1001198153ae357420026ae8800d4ccd5cd18231aab9d0011323232323212330010040025333573460946aae740044c8c8c848cc00400c008c09cd5d09aba20023302775a6ae84004d55cf0008241baa357426ae8800d4ccd5cd18241aab9d001132323212330010030023025357426ae88008cc095d69aba100135573c00208c6ea8d5d08009aab9e00104437546ae84004d5d10011998120143ad357420026ae88008cc08c094d5d08009aba200233302075c03e6ae84004d5d100119980f3ae01d357420026ae88008cc074064d5d08009aba20023301b016357420026ae88008cc064050d5d08009aab9e00103437546ae84004d55cf0008191baa00122333573466e3c0080040ac024888ccd54c0b80bc0b4cd54c0700bc8d400488cc0a8008c020004ccd54c0b80bc88d4008894cd4ccd54c0840cccc0ac88ccc0280c8008004c0200a88d400488cc028008014018400c4cc0c401000c0ac004cd54c0700bc8d400488cc0a8008cc0e4894cd40044c02c00c884d4008894cd4cc03000802044888cc0080280104c01800c0100088cc004894cd400808c400401884888c00c01084888c004010cc080888c00cc00800480048cc004894cd40084004080090407494cd40048400454cd5ce24810866726f6d4a75737400162350012233335001029200102902910232325333573460500020322a666ae68c09c004068094d55ce9baa001223232533357346054002224440022a666ae68c0a40044c84888c00c010c010d5d09aab9e00215333573460500022244400404c6aae74004dd50009192999ab9a302535573a00226464642466002006004600a6ae84d5d100118069aba100135573c0020466ea80048c94ccd5cd18121aab9d0011323232323232323232321233330010090070030023300c75c6ae84d5d10022999ab9a302e00113212223002004357426aae7800854ccd5cd1816800899091118008021bae357426aae7800854ccd5cd1816000889110018151aab9d00137546ae84004d5d1001199804bae008357420026ae8800d4ccd5cd18131aab9d001132323212330010030023300700d357426ae88008c034d5d08009aab9e00102437546ae84004d55cf0008111baa00122323253335734604a0022601c60086ae84d55cf0010a999ab9a302600101802335573a0026ea8004cc005d73ad222330262233335573e002403c4646604266036600e6aae74004c018d55cf00098021aba2003357420040426eac00488cc09088cccd55cf800900e11980f18029aba100230033574400403e6eb00048c8c94ccd5cd181180089909111180200298021aba135573c0042a666ae68c0880044c848888c008014c014d5d09aab9e002153335734604200226424444600200a600e6ae84d55cf0010a999ab9a3020001132122223003005375c6ae84d55cf00100f1aab9d00137540024646464a666ae68cdc3a40180042244444440062a666ae68cdc3a40140042244444440082a666ae68cdc3a40100042646424444444660020120106eb4d5d09aba25002375c6ae85400454ccd5cd18118010991909111111198010048041bae357426ae894008dd71aba15001153335734604400426464244444446600c0120106eb8d5d09aba25002300535742a0022a666ae68c0840084c848888888c01c020c014d5d09aab9e003153335734604000426424444444600a010600a6ae84d55cf00180f09aab9e00235573a0026ea80048c8c94ccd5cd180f800899191919190911998008030020019bad357426ae88008dd69aba1001357440046eb4d5d08009aab9e002153335734603c002264244600400660086ae84d55cf00100e1aab9d001375400246464a666ae68c0780044c8488c00400cdd71aba135573c0042a666ae68c0740044c8488c00800cdd71aba135573c0040366aae74004dd50009192999ab9a301b35573a002264646424660020060046eb4d5d09aba20023004357420026aae78004064dd50009192999ab9a301a35573a00226eb8d5d09aab9e0010183754002424460040066034442244a66a0020184426602e600800466aa600c03200800260324422444a66a00226a00601c442666a00a02c6008004666aa600e03200a0080026a0040106a00201a601024446600644a66a0042a66a0020124426a00444a66a6601602800226601002800601c4426a00444a66a00a2a66a6601600202826601000602801c4426a00444a666ae68cdc78030010a99a99807802800899806003801809099998059980a003002803980b891198011980b00200180080191111a80211299a8018a99a9980580080a0998040028020071109a801112999ab9a3371e00c0042a66a6601e00a002266018012666aa6036038034006010024266660166602800c00a01266034660280040020100066a00400a6a002014600a24446600644a66a0042a66a00200c4426a00444a666ae68c0600044cc02004400c02c884d4008894cd401454ccd5cd180c0008998040018088059109a80111192999ab9a301d00613300d0083301833012003002004153335734603a00426601a660306602400e00c0100082a666ae68cdc78038018a999ab9a3370e00c00426601a010008002002266660166602200c00a00e6028244660046602600800600200644446a00844a66a0060164426a00444a666ae68c0700044cccc02ccc04401801402402000c54ccd5cd19b8f00600215333573466e1c0140044cc030024ccd54c06006405c00c0204cccc02ccc044018014024cc05ccc04400800402000c4cccc02ccc044018014024cc05ccc04400800402000c401c44004880048848cc00400c0088cc00800800488c8c848cc0048c00c88c00800c8c00c88c00400c8d4c00800cd400c004c0080088cd400401000840048800888488cc00401000cc02088448894cd40044008884cc014008ccd54c01c0200140100044800454cd5ce2481035054310016253357389201024c680016370e90001b8748008dc3a40086e1d200623230010012233003300200200101';
            //----------------------------
            const cborHexValidator =
                '5906235906200100003232323232323232323232323232323232323232323232323222232323232533553355333573466e3d22011c6d37327af01be275ba3b9819dbf526ed7ca770ad7c58659ff40bc90a0048810001a0180181335738920100122001112001165333573460366aae740044c94ccd5cd180e1aab9d0011375a6ae84d55cf00080d9baa357426aae78004068dd50029aa999ab9a301935573a002264646464246600200600460246ae84d5d1001a999ab9a301b35573a00226464646464646464646464646464646464646464646464642466666666666600203002c02802402001c01801200e00a006004605a6ae84d5d1001199811bae2001357420026ae88008ccc0840948004d5d08009aba20023302075c6ae84004d5d1001a999ab9a302b35573a002264646464642466002008004a666ae68c0bcd55ce80089919190919800801801180e9aba1357440046603aeb4d5d08009aab9e00102e37546ae84d5d1001a999ab9a302d35573a0022646464246600200600460366ae84d5d10011980dbad357420026aae780040b0dd51aba100135573c0020546ea8d5d08009aba200233301a02075a6ae84004d5d10011980c80e9aba10013574400466602ceb8054d5d08009aba200233301475c0266ae84004d5d1001198098079aba100135744004660220186ae84004d5d1001198078051aba100135573c0020346ea8d5d08009aab9e001018220023754002464a666ae68c05c00404854ccd5cd180b00080a00a9aab9d3754002446464a666ae68c0640044488800454ccd5cd180c0008990911180180218021aba135573c0042a666ae68c05c00444888008058d55ce8009baa0012325333573460286aae740044c8c8c848cc00400c008c014d5d09aba2002300f357420026aae7800404cdd50009192999ab9a301335573a00226464646464646464646424666600201200e00600466018eb8d5d09aba200453335734603a002264244460040086ae84d55cf0010a999ab9a301c00113212223001004375c6ae84d55cf0010a999ab9a301b0011122200301a35573a0026ea8d5d08009aba200233300975c0106ae84004d5d1001a999ab9a301535573a002264646424660020060046600e01e6ae84d5d100118079aba100135573c0020286ea8d5d08009aab9e0010123754002446464a666ae68c0500044c8488c00800cc010d5d09aab9e002153335734602a0020240266aae74004dd500099800bae75a4446602a446666aae7c00480448c8c8c8cc03048cc00400c008c018d5d100298039aab9e002300735573a0026ae8400801cdd58009119809911999aab9f001200f23300730053574200460066ae88008014dd6000890009109119800802001919192999ab9a30100011321222230040053004357426aae7800854ccd5cd180780089909111180100298029aba135573c0042a666ae68c0380044c848888c004014c01cd5d09aab9e002153335734601a00226424444600600a6eb8d5d09aab9e00200c35573a0026ea80048c8c8c94ccd5cd19b874803000844888888800c54ccd5cd19b874802800844888888801054ccd5cd19b87480200084c8c848888888cc004024020dd69aba135744a0046eb8d5d0a8008a999ab9a3010002132321222222233002009008375c6ae84d5d128011bae35742a0022a666ae68c03c0084c8c848888888cc018024020dd71aba135744a004600a6ae85400454ccd5cd180700109909111111180380418029aba135573c0062a666ae68c0340084c848888888c014020c014d5d09aab9e00300c135573c0046aae74004dd5000919192999ab9a300c00113232323232122333001006004003375a6ae84d5d10011bad357420026ae88008dd69aba100135573c0042a666ae68c02c0044c8488c00800cc010d5d09aab9e00200a35573a0026ea80048c8c94ccd5cd180580089909118008019bae357426aae7800854ccd5cd180500089909118010019bae357426aae78008024d55ce8009baa0012325333573460106aae740044c8c8c848cc00400c008dd69aba13574400460086ae84004d55cf0008039baa00123253335734600e6aae740044dd71aba135573c00200c6ea80044004488008448800454cd5ce249035054310016370e90001b8748008dc3a40086e1d200623230010012233003300200200101';
            //----------------------------
            const mintingIdFree: MintingPolicy = {
                type: 'PlutusV2',
                script: cborHexMintingID,
            };
            const validatorFree: SpendingValidator = {
                type: 'PlutusV2',
                script: cborHexValidator,
            };
            //----------------------------
            policyID_CS = masterWallet.utils.mintingPolicyToId(mintingIdFree);
            // const tokenName = 'FreeID';
            // console.log(`policyID_CS: ${policyID_CS}`);
            //----------------------------
            validatorAddress = masterWallet.utils.validatorToAddress(validatorFree);
            console.log(`validatorAddress: ${validatorAddress}`);
            //--------------------
            setupInitFailed = false; // Set the flag to false if setup is successful
            //--------------------
        } catch (error) {
            console.error('Setup Wallets failed:', error);
        }
    }, 1000 * 60 * 60);
    //--------------------
    afterAll(() => {
        saveExcel(allResults, __dirname, fileNameResults);
    });
    //--------------------
    for (const testCase of CONFIG.TEST_CASES) {
        describe(`Test case with ${testCase.utxos} UTXOs`, () => {
            //--------------------
            let setupUTxOsFailed = true; // New flag to track setup failure
            //--------------------
            beforeEach(async () => {
                //---------------------
                for (let retry = 0; retry < CONFIG.MAX_RETRIES_TX; retry++) {
                    try {
                        //---------------------
                        setupUTxOsFailed = true; // Set the flag to true before each attempt
                        //--------------------
                        if (setupInitFailed) {
                            console.log('[TEST] - Skipping beforeEach as setup init failed');
                            return; // Skip this beforeEach if setup failed
                        }
                        //---------------------
                        console.log(`[TEST] - Syncing with address API (Attempt ${retry + 1})`);
                        await FreeApi.syncWithAddressApi(FreeEntity, validatorAddress, true);
                        //---------------------
                        // Ensure we have the right number of UTXOs
                        const currentUTXOs = await FreeApi.getAllApi_({ fieldsForSelect: {}, loadRelations: { smartUTxO_id: true } });
                        console.log(`[TEST] - Found ${currentUTXOs.length} contract UTXOs - We want ${testCase.utxos}.`);
                        //---------------------
                        const utxosToCreate = testCase.utxos - currentUTXOs.length;
                        if (utxosToCreate > 0) {
                            await createContractUTXOs(masterWallet, utxosToCreate);
                        } else if (utxosToCreate < 0) {
                            const utxosToDelete = Math.abs(utxosToCreate);
                            await deleteContractUTXOs(masterWallet, utxosToDelete);
                        }
                        //---------------------
                        setupUTxOsFailed = false; // Set the flag to false if setup is successful
                        console.log('[TEST] - UTxO setup completed successfully');
                        //---------------------
                        break; // Exit the retry loop if successful
                    } catch (error) {
                        console.error(`[TEST] - Setup UTxOs failed (Attempt ${retry + 1}):`, error);
                        if (retry === CONFIG.MAX_RETRIES_SETUP - 1) {
                            console.error('[TEST] - All retry attempts exhausted. Setup UTxOs failed.');
                            throw error; // Rethrow the error after all retries have failed
                        } else {
                            console.log(`[TEST] - Retrying in ${CONFIG.MAX_RETRIES_SETUP / 1000} seconds...`);
                            await delay(CONFIG.RETRY_DELAY_SETUP);
                        }
                    }
                }
            }, 1000 * 60 * 10); // 10 minutes timeout for UTXO setup
            //--------------------
            testCase.users.forEach((users) => {
                testCase.transactionsPerUser.forEach((transactionsPerUser) => {
                    test(
                        `Users: ${users}, Transactions per User: ${transactionsPerUser}, Smart Selection: On, With Reference Read: Off`,
                        async () => {
                            //---------------------
                            // console.log(
                            //     `[TEST] - Running Test Case - utxos: ${testCase.utxos}, users: ${users}, transactionsPerUser: ${transactionsPerUser}, smartSelection: ${true} - ...`
                            // );
                            //---------------------
                            if (setupUTxOsFailed) {
                                throw new Error('Setup failed, skipping test');
                            }
                            //---------------------
                            const result = await runTestCase(
                                masterWallet,
                                walletLucids,
                                testCase.utxos,
                                users,
                                transactionsPerUser,
                                true,
                                false,
                                CONFIG.INITIAL_DELAY_BETWEEN_USERS,
                                CONFIG.DELAY_BETWEEN_TXS,
                                CONFIG.MAX_RETRIES_TX,
                                CONFIG.RETRY_DELAY_TX
                            );
                            allResults.push(result);
                            saveExcel(allResults, __dirname, fileNameResults);
                            expect(result.pass).toBe(true);
                            //---------------------
                        },
                        1000 * 60 * 60 * 2
                    );
                    test(
                        `Users: ${users}, Transactions per User: ${transactionsPerUser}, Smart Selection: Off, With Reference Read: Off`,
                        async () => {
                            //---------------------
                            // console.log(
                            //     `[TEST] - Running Test Case - utxos: ${
                            //         testCase.utxos
                            //     }, users: ${users}, transactionsPerUser: ${transactionsPerUser}, smartSelection: ${false} - ...`
                            // );
                            //---------------------
                            if (setupUTxOsFailed) {
                                throw new Error('Setup failed, skipping test');
                            }
                            //---------------------
                            const result = await runTestCase(
                                masterWallet,
                                walletLucids,
                                testCase.utxos,
                                users,
                                transactionsPerUser,
                                false,
                                false,
                                CONFIG.INITIAL_DELAY_BETWEEN_USERS,
                                CONFIG.DELAY_BETWEEN_TXS,
                                CONFIG.MAX_RETRIES_TX,
                                CONFIG.RETRY_DELAY_TX
                            );
                            allResults.push(result);
                            saveExcel(allResults, __dirname, fileNameResults);
                            expect(result.pass).toBe(true);
                            //---------------------
                        },
                        1000 * 60 * 60 * 2
                    );
                    test(
                        `Users: ${users}, Transactions per User: ${transactionsPerUser}, Smart Selection: On, With Reference Read: On`,
                        async () => {
                            //---------------------
                            // console.log(
                            //     `[TEST] - Running Test Case - utxos: ${testCase.utxos}, users: ${users}, transactionsPerUser: ${transactionsPerUser}, smartSelection: ${true} - ...`
                            // );
                            //---------------------
                            if (setupUTxOsFailed) {
                                throw new Error('Setup failed, skipping test');
                            }
                            //---------------------
                            const result = await runTestCase(
                                masterWallet,
                                walletLucids,
                                testCase.utxos,
                                users,
                                transactionsPerUser,
                                true,
                                true,
                                CONFIG.INITIAL_DELAY_BETWEEN_USERS,
                                CONFIG.DELAY_BETWEEN_TXS,
                                CONFIG.MAX_RETRIES_TX,
                                CONFIG.RETRY_DELAY_TX
                            );
                            allResults.push(result);
                            saveExcel(allResults, __dirname, fileNameResults);
                            expect(result.pass).toBe(true);
                            //---------------------
                        },
                        1000 * 60 * 60 * 2
                    );
                    //--------------------
                    test(
                        `Users: ${users}, Transactions per User: ${transactionsPerUser}, Smart Selection: Off, With Reference Read: On`,
                        async () => {
                            //---------------------
                            // console.log(
                            //     `[TEST] - Running Test Case - utxos: ${
                            //         testCase.utxos
                            //     }, users: ${users}, transactionsPerUser: ${transactionsPerUser}, smartSelection: ${false} - ...`
                            // );
                            //---------------------
                            if (setupUTxOsFailed) {
                                throw new Error('Setup failed, skipping test');
                            }
                            //---------------------
                            const result = await runTestCase(
                                masterWallet,
                                walletLucids,
                                testCase.utxos,
                                users,
                                transactionsPerUser,
                                false,
                                true,
                                CONFIG.INITIAL_DELAY_BETWEEN_USERS,
                                CONFIG.DELAY_BETWEEN_TXS,
                                CONFIG.MAX_RETRIES_TX,
                                CONFIG.RETRY_DELAY_TX
                            );
                            allResults.push(result);
                            saveExcel(allResults, __dirname, fileNameResults);
                            expect(result.pass).toBe(true);
                            //---------------------
                        },
                        1000 * 60 * 60 * 2
                    );
                    //--------------------
                    
                });
            });
        });
    }
    //--------------------
    test('Compare smart selection performance', () => {
        const smartSelectionResults = allResults.filter((r) => r.smartSelection);
        const nonSmartSelectionResults = allResults.filter((r) => !r.smartSelection);
        //--------------------
        const smartSelectionSuccessRate = smartSelectionResults.reduce((acc, r) => acc + r.successful / (r.users * r.transactionsPerUser), 0) / smartSelectionResults.length;
        const nonSmartSelectionSuccessRate =
            nonSmartSelectionResults.reduce((acc, r) => acc + r.successful / (r.users * r.transactionsPerUser), 0) / nonSmartSelectionResults.length;
        //--------------------
        expect(smartSelectionSuccessRate).toBeGreaterThanOrEqual(nonSmartSelectionSuccessRate);
        //--------------------
        const smartSelectionAvgAttempts = smartSelectionResults.reduce((acc, r) => acc + r.totalAttempts / r.successful, 0) / smartSelectionResults.length;
        const nonSmartSelectionAvgAttempts = nonSmartSelectionResults.reduce((acc, r) => acc + r.totalAttempts / r.successful, 0) / nonSmartSelectionResults.length;
        //--------------------
        expect(smartSelectionAvgAttempts).toBeLessThanOrEqual(nonSmartSelectionAvgAttempts);
    });
    //--------------------
});
