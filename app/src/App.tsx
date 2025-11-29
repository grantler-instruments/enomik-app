import { Box } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Inputs from "./components/Inputs";
import Outputs from "./components/Outputs";
import { useAppStore } from "./store/app";
import Sidebar from "./components/Sidebar";

function App() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  return (
    <Box
      width={"100vw"}
      height={"100vh"}
      display={"flex"}
      flexDirection={"column"}
    >
      <Header></Header>
      {isSidebarOpen && <Sidebar />}
      <Inputs></Inputs>
      <Outputs></Outputs>
      <Box flexGrow={1}></Box>
      <Footer></Footer>
    </Box>
  );
}

export default App;
