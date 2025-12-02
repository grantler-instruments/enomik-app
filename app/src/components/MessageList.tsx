import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { useMIDIStore } from "../store/midi";
import { typeToLabel } from "../utils/midi";
import { useState } from "react";
import Filter from "./Filter";

// function Filter() {
//   const [error, _] = useState<string | null>(null);

//   const inputs = useMIDIStore((state) => state.inputs);
//   const outputs = useMIDIStore((state) => state.outputs);
//   const activeInputs = useMIDIStore((state) => state.activeInputs);
//   const toggleInput = useMIDIStore((state) => state.toggleInput);

//   return (
//     <Box>
//       {/* Inputs section with checkboxes */}
//       {/* <Box marginTop={2}> */}
//       <Box>
//         {/* <Typography variant="h3">Filter</Typography> */}
//         <Grid container spacing={2} marginTop={1} marginBottom={2}>
//           <Grid size={{ xs: 12, sm: 6 }}>
//             <Typography variant="h4">Input</Typography>
//             {inputs.map((input: any) => (
//               <Box key={input.id}>
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       checked={activeInputs.includes(input.id)}
//                       onChange={() => toggleInput(input.id)}
//                     />
//                   }
//                   label={input.name}
//                 ></FormControlLabel>
//               </Box>
//             ))}
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }}>
//             <Typography variant="h4">Output</Typography>
//             {outputs.map((output: any) => (
//               <Box key={output.id}>
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       checked={activeInputs.includes(output.id)}
//                       onChange={() => toggleInput(output.id)}
//                     />
//                   }
//                   label={output.name}
//                 ></FormControlLabel>
//               </Box>
//             ))}
//           </Grid>
//         </Grid>
//       </Box>

//       {error && <Typography color="error">{error}</Typography>}
//     </Box>
//   );
// }

function MessageList() {
  const messages = useMIDIStore((state) => state.messages);
  const clear = useMIDIStore((state) => state.clear);
  return (
    <Box mt={4}>
      <Box display="flex" flexDirection={"column"} mb={2}>
        <Typography variant="h2">MIDI Monitor</Typography>
        <Accordion>
          <AccordionSummary
            expandIcon={<ArrowDropDownIcon />}
            aria-controls="inputs-content"
          >
            <Typography variant="h3">Filter</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Filter />
          </AccordionDetails>
        </Accordion>
        <Button variant="outlined" onClick={clear}>
          Clear
        </Button>
      </Box>
      <Box
        sx={{
          maxHeight: "400px",
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={msg.id}
            sx={{
              py: 0.5,
              px: 1,
              backgroundColor: index % 2 === 0 ? "transparent" : "action.hover",
            }}
            display={"flex"}
            gap={1}
          >
            <Typography variant="body2">
              [{new Date(msg.timestamp).toLocaleTimeString()}]
            </Typography>
            <Typography variant="body2">{typeToLabel(msg.type)}</Typography>
            {msg.channel !== undefined && (
              <Typography variant="body2">Ch: {msg.channel}</Typography>
            )}
            {msg.note && (
              <Typography variant="body2">Note: {msg.note}</Typography>
            )}
            {msg.velocity && (
              <Typography variant="body2">Vel: {msg.velocity}</Typography>
            )}
            {msg.controller && (
              <Typography variant="body2">
                controller: {msg.controller}
              </Typography>
            )}
            {msg.value && (
              <Typography variant="body2">Value: {msg.value}</Typography>
            )}
            {msg.data && (
              <Typography variant="body2">
                Data: {msg.data.join(", ")}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default MessageList;
