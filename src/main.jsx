import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./utilities.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker so iOS treats this as an installable web app
// and it works offline after the first load.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
