import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SuperAdminProvider } from "./contexts/SuperAdminContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./app/store.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <SuperAdminProvider>
            <App />
          </SuperAdminProvider>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
