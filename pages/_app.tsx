import { AppProps } from 'next/dist/shared/lib/router/router';
import 'tailwindcss/tailwind.css';
import { SlicingPieProvider } from '../components/SlicingPieContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SlicingPieProvider>
      <Component {...pageProps} />
    </SlicingPieProvider>
  );
}
export default MyApp;
