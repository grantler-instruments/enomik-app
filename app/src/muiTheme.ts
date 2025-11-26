"use client";
import { createTheme } from "@mui/material/styles";
//https://coolors.co/palette/355070-6d597a-b56576-e56b6f-eaac8b

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#e56b6f",
    },
    secondary: {
      main: "#6D597A",
    },
    background: {
      default: "#efefef"
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
