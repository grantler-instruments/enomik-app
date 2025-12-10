import { Box, Typography, Button, Container, Link } from "@mui/material";
import { NavLink } from "react-router-dom";

const Home = () => {
  return (
    <Container maxWidth="lg" sx={{ my: 8 }}>
      {/* Hero Section */}
      <Typography variant="h2" fontWeight={700} gutterBottom>
        Create MIDI Devices Easily
        <br />
        <Box sx={{ color: "secondary.main" }}>No Coding Required.</Box>
      </Typography>

      <Typography variant="h6" sx={{ opacity: 0.9 }} gutterBottom>
        Tired of reconfiguring your MIDI setup over and over? Use our intuitive
        <strong> no-code configurator</strong> to assign MIDI messages to pins
        and vice versa, and set up wireless MIDI connections effortlessly.
      </Typography>

      <Box mt={4}>
        <Button
          variant="contained"
          size="large"
          component={NavLink}
          to={"/configurator"}
        >
          Launch Configurator
        </Button>
      </Box>

      {/* Feature Section */}
      <Box mt={8}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Reliable Wireless MIDI  - <Box component={"span"} sx={{colo: "secondary.main" }}>Without Bluetooth.</Box>
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Dont trust Bluetooth MIDI? <Link
            href="https://github.com/thomasgeissl/esp-now-midi"
            target="_blank"
            rel="noopener"
          >
            ESP-NOW MIDI
          </Link>{" "}
          to the rescue! It delivers fast, stable, low-latency wireless MIDI, ideal for live
          performances, instruments, and embedded systems.
        </Typography>
      </Box>

      <Box mt={8}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Fully Bidirectional - <Box component={"span"} sx={{ color: "secondary.main" }}>
            MIDI Controller or Instrument
          </Box>
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Works as both a MIDI IN and MIDI OUT device. Configure your ESP32 as a
          standalone MIDI controller or as a MIDI-controllable instrument or
          sound installation.
        </Typography>
      </Box>

      <Box mt={8}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Available as a Kit - <Box component={"span"} sx={{ color: "secondary.main" }}>Dongles & Client Boards</Box>
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Get started quickly with our custom hardware kits, including a compact
          wireless MIDI dongle and versatile client boards—everything you need
          to build your own MIDI devices with ease.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
