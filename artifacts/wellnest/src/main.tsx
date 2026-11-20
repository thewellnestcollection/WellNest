import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setDefaultCredentials } from "@workspace/api-client-react";

setBaseUrl(import.meta.env.VITE_API_URL ?? null);
// All API calls must send the session cookie cross-origin to Railway
setDefaultCredentials("include");

createRoot(document.getElementById("root")!).render(<App />);
