import { Head, Html, Main, NextScript } from 'next/document';

export const metadata = {
    title: 'SmartDB - Example',
    description: '',
    applicationName: 'SmartDB - Example',
    themeColor: '#ffffff',
};

export default function Document() {

	return (
		<Html lang="en">
			<Head>
					{/* <title>{metadata.title}</title> */}
                    <meta name="description" content={metadata.description} />
                    <meta name="application-name" content={metadata.applicationName} />
                    <meta name="theme-color" content={metadata.themeColor} />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}