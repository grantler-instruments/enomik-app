"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#222222",
    },
    secondary: {
      main: "#93cc30",
    },
    background: {
    }
  },
    typography: {
    h1: {
      fontSize: "3em"
    },
    h2: {
      letterSpacing: '0.15em', // 👈 this adds spacing between letters
      marginBottom: "24px",
      fontSize: "2.5em"
    },
    h3: {
      fontSize: "2em"
    },
  },
});

export default theme;
