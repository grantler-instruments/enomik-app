import { Box, Tabs, Tab } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAppStore } from "./store/app";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import Configurator from "./components/Configurator";
import Inspector from "./components/Inspector";
import Debugger from "./components/Debugger";
import { Routes, Route } from "react-router-dom";
import NotFound from "./components/NotFound";

function App() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event: any, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Box
      width={"100vw"}
      height={"100vh"}
      display={"flex"}
      flexDirection={"column"}
    >
      <Header></Header>
      {isSidebarOpen && <Sidebar />}
      <Box marginLeft={1} marginRight={1}>
        {/* <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Configurator" />
          <Tab label="Debugger/Monitor" />
          <Tab label="Inspector" />
        </Tabs> */}
        <Routes>
          <Route path="/" element={<Configurator />} />
          <Route path="/debugger" element={<Debugger />} />
          {/* 404 Not Found route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
      <Footer></Footer>
    </Box>
  );
}

export default App;
