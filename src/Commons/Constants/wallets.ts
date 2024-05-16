
//----------------------------------------------------------------------

import { CardanoWallet } from "../types.js";
import { WALLET_ETERNL_ICON, WALLET_FLINT_ICON, WALLET_NAMI_ICON, WALLET_NUFI_ICON, WALLET_TYPHON_ICON, WALLET_YOROI_ICON } from "./images.js";

export const CARDANO_WALLETS: CardanoWallet[] = [
    {
        wallet: 'eternl',
        name: 'Eternl',
        icon: WALLET_ETERNL_ICON,
        link: 'https://chrome.google.com/webstore/detail/eternl/kmhcihpebfmpgmihbkipmjlmmioameka',
        isInstalled: false,
    },
    {
        wallet: 'nami',
        name: 'Nami',
        icon: WALLET_NAMI_ICON,
        link: 'https://chrome.google.com/webstore/detail/nami/lpfcbjknijpeeillifnkikgncikgfhdo',
        isInstalled: false,
    },
    {
        wallet: 'flint',
        name: 'Flint',
        icon: WALLET_FLINT_ICON,
        link: 'https://chrome.google.com/webstore/detail/flint-wallet/hnhobjmcibchnmglfbldbfabcgaknlkj',
        isInstalled: false,
    },
    {
        wallet: 'yoroi',
        name: 'Yoroi',
        icon: WALLET_YOROI_ICON,
        link: 'https://chrome.google.com/webstore/detail/yoroi/ffnbelfdoeiohenkjibnmadjiehjhajb',
        isInstalled: false,
    },
    {
        wallet: 'typhon',
        name: 'Typhon',
        icon: WALLET_TYPHON_ICON,
        link: 'https://chrome.google.com/webstore/detail/typhon-wallet/kfdniefadaanbjodldohaedphafoffoh',
        isInstalled: false,
    },
    {
        wallet: 'nufi',
        name: 'Nufi',
        icon: WALLET_NUFI_ICON,
        link: 'https://chrome.google.com/webstore/detail/nufi/gpnihlnnodeiiaakbikldcihojploeca',
        isInstalled: false,
    },
];