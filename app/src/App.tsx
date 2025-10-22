import { Box } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <Box width={"100vw"} height={"100vh"} display={"flex"} flexDirection={"column"}>
      <Header></Header>
      <Box flexGrow={1}></Box>
      <Footer></Footer>
    </Box>
  );
}

export default App;
