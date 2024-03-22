import { Blockfrost, Lucid } from 'lucid-cardano';
import styles from './Home.module.scss';
import { useState, useEffect } from 'react';
import { LucidToolsFrontEnd } from '@/src/lib/SmartDB';
import { GetServerSideProps } from 'next';
import { MongoClient } from 'mongodb';
import React from 'react';

export default function Home() {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const [lucid, setLucid] = useState<Lucid>();
    const [privateKey, setPrivateKey] = useState<string>();
    //--------------------------------------
    useEffect(() => {
        const fetch = async () => {
            const lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrost();
            const privateKey = lucid.utils.generatePrivateKey(); // Bech32 encoded private key
            console.log(privateKey);
            setLucid(lucid);
            setPrivateKey(privateKey);
        };
        fetch();
    }, []);

    const handleBtnCreateTx = async () => {
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        //----------------------------
        const seed = process.env.NEXT_PUBLIC_walletMasterSeed1!
        lucid.selectWalletFromSeed(seed);
        //----------------------------
        const tx = await lucid
            .newTx()
            .payToAddress('addr_test1qz4ll7yrah8h5t3cv2qptn4mw22judsm9j9zychhmtuuzmszd3hm6w02uxx6h0s3qgd4hxgpvd0qzklnmahcx7v0mcysptyj8l', { lovelace: 5000000n })
            .complete();
        //----------------------------
        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        //----------------------------
        console.log(txHash);
    };
    //-------------------------------------
    return (
        <div>
            <div>Home</div>

            <div>
                <button onClick={handleBtnCreateTx}>Create Dummy Datum Transaction</button>
            </div>
            <div>
                <button>Sync</button>
            </div>
            <div>
                <div>List</div>
            </div>
        </div>
    );
}
