import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const googleReady = Boolean(googleClientId && !String(googleClientId).startsWith("mock"));

const appTree = (
  <AuthProvider>
    <App />
  </AuthProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {googleReady ? (
      <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
    ) : (
      appTree
    )}
  </StrictMode>,
);
