import { Box, Typography, Button, Container, Link } from "@mui/material";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

const Home = () => {
  const {t} = useTranslation();
  return (
    <Container maxWidth="lg" sx={{ my: 8 }}>
      {/* Hero Section */}
      <Typography variant="h2" fontWeight={700} gutterBottom>
        {t("home_create_midi_devices_easily")}
        <br />
        <Box sx={{ color: "secondary.main" }}>{t("home_no_coding_required")}</Box>
      </Typography>

      <Typography variant="h6" sx={{ opacity: 0.9 }} gutterBottom>
        {t("home_caption")}
      </Typography>

      <Box mt={4} display={"flex"} gap={2} alignContent={"center"} alignItems={"center"}>
        <Button
          variant="contained"
          size="large"
          component={NavLink}
          to={"/configurator"}
        >
          {t("launch_configurator")}
        </Button>
          {/* {t("home_or_getting_started_guide")} */}
        <Button
          variant="contained"
          size="large"
          component={NavLink}
          to={"/getting-started"}
        >
          {t("getting_started")}
        </Button>
      </Box>

      {/* Feature Section */}
      <Box mt={8}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t("home_reliable_wireless_midi")} -{" "}
          <Box component={"span"} sx={{ color: "secondary.main" }}>
            {t("home_without_bluetooth")}
          </Box>
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          {t("home_dont_trust_bluetooth_midi")}{" "}
          <Link
            href="https://github.com/thomasgeissl/esp-now-midi"
            target="_blank"
            rel="noopener"
          >
            ESP-NOW MIDI
          </Link>{" "}
          {t("home_esp_now_midi")}
        </Typography>
      </Box>

      <Box mt={8}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t("home_fully_bidirectional")} -{" "}
          <Box component={"span"} sx={{ color: "secondary.main" }}>
            {t("home_midi_controller_or_instrument")}
          </Box>
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          {t("home_fully_bidirectional_description")}
        </Typography>
      </Box>

      <Box mt={8}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t("home_kit")} -{" "}
          <Box component={"span"} sx={{ color: "secondary.main" }}>
            {t("home_dongles_and_client_boards")}
          </Box>
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          {t("home_kit_description")}
        </Typography>
      </Box>

      <Box mt={8}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t("home_utilities")} -{" "}
          <Box component={"span"} sx={{ color: "secondary.main" }}>
            {t("home_utilities_description")}
          </Box>
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          {t("home_utilities_description_includes")} <Button
            variant="outlined"
            size="large"
            component={NavLink}
            to={"/debugger"}
          >
            {t("midi_monitor")}
          </Button>{" "}
          {t("home_utilities_description_includes_continues")}
          <Button
            variant="outlined"
            size="large"
            component={NavLink}
            to={"/uploader"}
          >
            {t("firmware_uploader")}
          </Button>{" "}
          {t("home_utilities_description_includes_end")}
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
