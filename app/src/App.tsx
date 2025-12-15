import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAppStore } from "./store/app";
import Sidebar from "./components/Sidebar";
import Configurator from "./components/Configurator";
import Inspector from "./components/Inspector";
import Debugger from "./components/Debugger";
import { Routes, Route } from "react-router-dom";
import NotFound from "./components/NotFound";
import FirmwareUploader from "./components/FirmwareUploader";
import GettingStarted from "./components/GettingStarted";
import Modals from "./components/Modals";
import Home from "./components/Home";
import WIPBanner from "./components/WorkInProgress";
import { darkTheme } from "./muiTheme.ts";

function App() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        width={"100vw"}
        height={"100vh"}
        display={"flex"}
        flexDirection={"column"}
      >
        <Header></Header>
        {isSidebarOpen && <Sidebar />}
        <Box
          paddingLeft={1}
          paddingRight={1}
          flex={1}
          overflow="auto"
          minHeight={0}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/configurator" element={<Configurator />} />
            <Route path="/debugger" element={<Debugger />} />
            <Route path="/inspector" element={<Inspector />} />
            <Route path="/uploader" element={<FirmwareUploader />} />
            <Route path="/getting-started" element={<GettingStarted />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
        <Footer></Footer>
        <Modals></Modals>
        <WIPBanner />
      </Box>
    </ThemeProvider>
  );
}

export default App;
