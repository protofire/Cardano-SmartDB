import './global.scss';

import { Session } from 'next-auth';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import 'react-notifications-component/dist/theme.css';
import {
  AddressToFollowEntity,
  AddressToFollowFrontEndApiCalls,
  EmulatorDBFrontEndApiCalls,
  EmulatorEntity,
  JobEntity,
  JobFrontEndApiCalls,
  SiteSettingsEntity,
  SiteSettingsFrontEndApiCalls,
} from 'smart-db';
import { metadata } from './_document';

export default function MyApp({ Component, pageProps }: AppProps<{ session?: Session }>) {
  useEffect(() => {
    const fetch = async () => {
      //----------------------------
      //----------------------------
      try {
        // const jobEntity = new JobEntity();
        // jobEntity.name = 'Example Job';
        // jobEntity.status = 'pending';
        // jobEntity.message = 'This is an example job';
        // jobEntity.result = false;
        // jobEntity.error = '';
        //
        // // Save the job entity to the database
        // await JobFrontEndApiCalls.createApi(jobEntity);
        //
        // // Retrieve all job entities
        // const jobList: JobEntity[] = await JobFrontEndApiCalls.getAllApi_();
        // console.log(jobList.length);
        //
        const emulatorEntity = new EmulatorEntity();
        emulatorEntity.name = 'Nombre de ejemplo';
        emulatorEntity.current = true;
        emulatorEntity.zeroTime = 112233;
        // emulatorEntity.privateKeys = "key example";

        await EmulatorDBFrontEndApiCalls.createApi(emulatorEntity);

        const list3: EmulatorEntity[] = await EmulatorDBFrontEndApiCalls.getAllApi_();
        console.log(list3.length);
        // Crear una instancia de prueba de SiteSettingsEntity
        const addressToFollow = new AddressToFollowEntity();
        addressToFollow.address = 'direccion de ejemplo';
        addressToFollow.currencySymbol = 'simbolo de ejemplo';
        addressToFollow.tokenName = 'Token Name ejemplo';
        addressToFollow.txCount = 991;
        addressToFollow.apiRouteToCall = 'Rutan de ejemplo';
        addressToFollow.datumType = 'Tipo de datum de ejemplo';

        await AddressToFollowFrontEndApiCalls.createApi(addressToFollow);

        const list1: AddressToFollowEntity[] = await AddressToFollowFrontEndApiCalls.getAllApi_();
        console.log(list1.length);

        // Crear una instancia de prueba de SiteSettingsEntity
        const siteSettings = new SiteSettingsEntity();
        siteSettings.name = 'Nombre de ejemplo';
        siteSettings.siteSecret = 'Secreto de ejemplo';
        siteSettings.corsAllowedOrigin = 'https://ejemplo.com';
        siteSettings.debug = true;
        siteSettings.welcomeMessage = 'Mensaje de bienvenida de ejemplo';
        siteSettings.welcomeMessageIndex = 'Mensaje de bienvenida en la página de inicio de ejemplo';
        siteSettings.blockfrost_url_api_mainnet = 'https://api-mainnet.example.com';
        siteSettings.blockfrost_url_explorer_mainnet = 'https://explorer-mainnet.example.com';
        siteSettings.blockfrost_url_api_preview = 'https://api-preview.example.com';
        siteSettings.blockfrost_url_explorer_preview = 'https://explorer-preview.example.com';
        siteSettings.blockfrost_url_api_preprod = 'https://api-preprod.example.com';
        siteSettings.blockfrost_url_explorer_preprod = 'https://explorer-preprod.example.com';
        siteSettings.oracle_wallet_publickey = 'Clave pública de la billetera del oráculo';
        siteSettings.oracle_internal_wallet_publickey_cborhex = 'Clave pública de la billetera interna del oráculo';

        await SiteSettingsFrontEndApiCalls.createApi(siteSettings);

        const list2: SiteSettingsEntity[] = await SiteSettingsFrontEndApiCalls.getAllApi_();
        console.log(list2.length);
      } catch (e) {
        console.error(e);
      }
      //----------------------------
      //----------------------------
    };
    //----------------------------
    fetch();
    //----------------------------
  }, []);

  return (
    <>
      {/* <StrictMode> */}
      <Head>
        <title>{metadata.title}</title>
      </Head>
      <>QQ</>
      {/* <SessionProvider session={pageProps.session} refetchInterval={0}>
                <StoreProvider store={globalStore}>
                    <AppGeneral />
                    <ReactNotifications />
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </StoreProvider>
            </SessionProvider> */}
      {/* </StrictMode> */}
    </>
  );
}
