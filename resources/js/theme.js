import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#2f80ed" },   // أزرق مثل الطابع في الصورة
    secondary: { main: "#56ccf2" },
    background: {
      default: "#f5f8ff",
      paper: "#ffffff",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
  },
});
