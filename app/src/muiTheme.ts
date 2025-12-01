"use client";
import { createTheme } from "@mui/material/styles";
//https://coolors.co/palette/355070-6d597a-b56576-e56b6f-eaac8b

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#ff7d00",
    },
    secondary: {
      main: "#ffecd1",
    },
    background: {
      default: "#efefef"
    }
  },
    typography: {
    h1: {
    },
    h2: {
      fontSize: "1.5rem",
      marginBottom: "1rem"
    },
    h3: {
      fontSize: "1.2rem",
      marginBottom: "1rem"
    },
  },
});

export default theme;
