import './global.scss';

import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ReactNotifications } from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css';
import { metadata } from './_document';
import Layout from '../components/UI/Layout/Layout';
import { AppGeneral, globalStore } from 'smart-db';
import { StoreProvider } from 'easy-peasy';

export default function MyApp({ Component, pageProps }: AppProps<{ session?: Session }>) {
    return (
        <>
            {/* <StrictMode> */}
            <Head>
                <title>{metadata.title}</title>
            </Head>
            <SessionProvider session={pageProps.session} refetchInterval={0}>
                <StoreProvider store={globalStore}>
                    <AppGeneral />
                    <ReactNotifications />
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </StoreProvider>
            </SessionProvider>
            {/* </StrictMode> */}
        </>
    );
}
