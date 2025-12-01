import { Alert, Box, Button } from "@mui/material";
import { useIOStore } from "../store/io";
import MacAddressInput from "./MacAddressInput";

const Peers = () => {
  const peers = useIOStore((state) => state.peers);
  const addPeer = useIOStore((state) => state.addPeer);
  const updatePeer = useIOStore((state) => state.updatePeer);
  return (
    <Box display={"flex"} flexDirection={"column"} padding={2}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Peer connections can be established with other devices via ESP-NOW.
        Configure the peer settings here.
      </Alert>
      {peers.map((peer, index) => (
        <MacAddressInput
          key={index}
          macAddress={peer.macAddress}
          onMacAddressChange={(newMac) => {
            updatePeer(peer.uuid, { macAddress: newMac });
          }}
        ></MacAddressInput>
      ))}
      <Box display={"flex"} justifyContent={"flex-start"} marginTop={2}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            addPeer({
              macAddress: "FF:FF:FF:FF:FF:FF",
            });
          }}
          fullWidth
        >
          Add Peer
        </Button>
      </Box>
    </Box>
  );
};

export default Peers;
