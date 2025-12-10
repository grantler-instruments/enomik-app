import { Alert, Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useIOStore } from "../store/io";
import MacAddressInput from "./MacAddressInput";
import { useAppStore } from "../store/app";
import { useState } from "react";
import AddRowButton from "./AddRowButton";

const Peers = () => {
  const peers = useIOStore((state) => state.peers);
  const addPeer = useIOStore((state) => state.addPeer);
  const updatePeer = useIOStore((state) => state.updatePeer);
  const removePeer = useIOStore((state) => state.removePeer);
  const showHints = useAppStore((state) => state.showHints);
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showHints && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Peer connections can be established with other devices via ESP-NOW.
          Configure the peer settings here.
        </Alert>
      )}
      {peers.map((peer, index) => (
        <Box
          key={index}
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            "&:hover .delete-button": {
              opacity: 1,
            },
            "& .delete-button": {
              opacity: { xs: 1, sm: 0 },
            },
          }}
        >
          <Box flex={1}>
            <MacAddressInput
              macAddress={peer.macAddress}
              onMacAddressChange={(newMac) => {
                updatePeer(peer.uuid, { macAddress: newMac });
              }}
            />
          </Box>
          <IconButton
            className="delete-button"
            onClick={() => removePeer(peer.uuid)}
            size="small"
            sx={{
              transition: "opacity 0.2s",
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <AddRowButton
          onClick={() => {
            addPeer({
              macAddress: "FF:FF:FF:FF:FF:FF",
            });
          }}
          visible={peers.length === 0 || hovered}
        >
        </AddRowButton>
      </Box>
    </Box>
  );
};

export default Peers;
