import { Box, TextField } from "@mui/material";
import { useRef } from "react";

const MacAddressInput = ({
  macAddress,
  onMacAddressChange,
  disabled = false,
}: {
  macAddress: string;
  onMacAddressChange: (newMac: string) => void;
  disabled?: boolean;
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split MAC address into pairs (e.g., "AB:CD:EF:12:34:56" -> ["AB", "CD", "EF", "12", "34", "56"])
  const macParts = macAddress.split(":").slice(0, 6);
  while (macParts.length < 6) {
    macParts.push("");
  }

  const handleChange = (index: number, value: string) => {
    // Only allow hex characters and limit to 2 characters
    const hexValue = value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 2).toUpperCase();

    console.log("Hex Value:", hexValue);
    
    const newMacParts = [...macParts];
    newMacParts[index] = hexValue;
    
    // Update the full MAC address
    onMacAddressChange(newMacParts.join(":"));

    // Auto-focus next field when 2 characters are entered
    if (hexValue.length === 2 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: any) => {
    // Move to previous field on backspace if current field is empty
    if (e.key === "Backspace" && macParts[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Move to next field on colon or dash
    if ((e.key === ":" || e.key === "-") && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    // Remove common separators and extract hex characters
    const cleanText = pastedText.replace(/[^0-9A-Fa-f]/g, "");
    
    const newMacParts = [...macParts];
    let currentIndex = index;
    
    for (let i = 0; i < cleanText.length && currentIndex < 6; i += 2) {
      newMacParts[currentIndex] = cleanText.substr(i, 2).toUpperCase();
      currentIndex++;
    }
    
    onMacAddressChange(newMacParts.join(":"));
  };

  return (
    <Box display="flex" flexDirection="row" padding={1} gap={1} alignItems="center">
      {Array.from({ length: 6 }, (_, index) => (
        <Box key={index} display="flex" alignItems="center" gap={0.5}>
          <TextField
            inputRef={(el) => (inputRefs.current[index] = el)}
            value={macParts[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            disabled={disabled}
            inputProps={{
              maxLength: 2,
              style: { 
                textAlign: "center", 
                textTransform: "uppercase",
                fontFamily: "monospace",
                fontSize: "1.1rem"
              },
            }}
            sx={{
              width: "60px",
              "& input": {
                padding: "10px",
              },
            }}
            size="small"
            placeholder="00"
          />
          {index < 5 && (
            <Box sx={{ color: "text.secondary", fontWeight: "bold" }}>:</Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MacAddressInput;