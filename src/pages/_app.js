import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import ChatBubble from "../components/ChatBubble";
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        reverseOrder={false}
      />
      <ChatBubble />
    </AuthProvider>
  );
}
