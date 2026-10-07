import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// After a rebuild, an open tab can ask for code files that no longer exist. Reload once to
// pick up the new build (the session flag prevents a reload loop if the file is truly missing).
window.addEventListener("vite:preloadError", (event) => {
  if (sessionStorage.getItem("reloadedForNewBuild")) return;
  event.preventDefault();
  sessionStorage.setItem("reloadedForNewBuild", "1");
  window.location.reload();
});
window.addEventListener("load", () => setTimeout(() => sessionStorage.removeItem("reloadedForNewBuild"), 5000));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
