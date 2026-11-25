import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider, FirebaseErrorBoundary } from "./studio/firebase/AuthContext";
import "./index.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <FirebaseErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FirebaseErrorBoundary>
    </StrictMode>,
  );
}
