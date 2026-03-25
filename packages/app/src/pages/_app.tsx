import '@towers/styles/globals.css';
import { HeadTemplate } from '../templates/HeadTemplate';
import type { AppProps } from 'next/app';
import { FC } from 'react';

const App: FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <HeadTemplate basic={{ title: 'Towers of Hanoi' }} />
      <Component {...pageProps} />
    </>
  );
};

export default App;
