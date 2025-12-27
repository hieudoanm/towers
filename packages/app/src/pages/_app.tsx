import '@towers/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { FC } from 'react';

const App: FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>Towers of Hanoi</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default App;
