import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// 👇 import your AuthProvider
import { AuthProvider } from "./components/auth/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>          {/* <-- provide auth context here */}
      <BrowserRouter>       {/* <-- wrap router too */}
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);