import { Box, Tabs, Tab } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAppStore } from "./store/app";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import Configurator from "./components/Configurator";
import Inspector from "./components/Inspector";
import Monitor from "./components/Monitor";

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
      
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Configurator" />
        <Tab label="Monitor" />
        <Tab label="Inspector" />
      </Tabs>
      
      {selectedTab === 0 && <Configurator />}
      {selectedTab === 1 && <Monitor />}
      {selectedTab === 2 && <Inspector />}
      
      <Box flexGrow={1}></Box>
      <Footer></Footer>
    </Box>
  );
}

export default App;