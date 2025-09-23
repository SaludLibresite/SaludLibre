import "@/styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import ChatBubble from "../components/ChatBubble";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        reverseOrder={false}
      />
      <ChatBubble />
    </AuthProvider>
  );
}
