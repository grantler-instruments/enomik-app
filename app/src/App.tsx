import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import BrowserWarning from "./components/BrowserWarning";
import Configurator from "./components/Configurator";
import Debugger from "./components/Debugger";
import FirmwareUploader from "./components/FirmwareUploader";
import Footer from "./components/Footer";
import GettingStarted from "./components/GettingStarted";
import Header from "./components/Header";
import Home from "./components/Home";
import Inspector from "./components/Inspector";
import Kits from "./components/Kits";
import Modals from "./components/Modals";
import NotFound from "./components/NotFound";
import Sidebar from "./components/Sidebar";
import Tester from "./components/Tester";
import Tutorial from "./components/Tutorial";
import UpdatePrompt from "./components/UpdatePrompt";
import { darkTheme, lightTheme } from "./muiTheme.ts";
import { useAppStore } from "./store/app";

// Elementary's inlined wasm is big: only load it on this page.
const Grantulator = lazy(() => import("./components/Grantulator"));

function App() {
	const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
	const darkMode = useAppStore((state) => state.darkMode);
	return (
		<ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
			<CssBaseline />
			<Box
				width={"100vw"}
				height={"100vh"}
				display={"flex"}
				flexDirection={"column"}
			>
				<Header></Header>
				<BrowserWarning />
				{isSidebarOpen && <Sidebar />}
				{/* Footer scrolls with the page so it doesn't take screen space */}
				<Box
					paddingLeft={1}
					paddingRight={1}
					flex={1}
					overflow="auto"
					minHeight={0}
					display="flex"
					flexDirection="column"
				>
					{/* Pages keep their height; the footer goes below */}
					<Box flex="1 0 auto">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/configurator" element={<Configurator />} />
							<Route path="/debugger" element={<Debugger />} />
							<Route path="/inspector" element={<Inspector />} />
							<Route path="/uploader" element={<FirmwareUploader />} />
							<Route path="/getting-started" element={<GettingStarted />} />
							<Route path="/tutorial" element={<Tutorial />} />
							<Route path="/tutorial/:chapterId" element={<Tutorial />} />
							<Route path="/tester" element={<Tester />} />
							<Route path="/kits" element={<Kits />} />
							<Route
								path="/grantulator"
								element={
									<Suspense>
										<Grantulator />
									</Suspense>
								}
							/>
							<Route path="*" element={<NotFound />} />
						</Routes>
					</Box>
					<Footer></Footer>
				</Box>
				<Modals></Modals>
				<UpdatePrompt />
			</Box>
		</ThemeProvider>
	);
}

export default App;
