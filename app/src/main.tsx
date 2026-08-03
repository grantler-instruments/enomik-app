// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import "./i18n.ts";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
	});
}

createRoot(document.getElementById("root")!).render(
	// <StrictMode>
	<HashRouter>
		<App />
	</HashRouter>,
	// </StrictMode>
);
