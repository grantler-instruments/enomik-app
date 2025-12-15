import {
  Box,
  Button,
  Container,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

const GettingStarted = () => {
  const { t } = useTranslation();
  const steps = [
    {
      title: t("getting_started_upload_dongle_title"),
      description: t("getting_started_upload_dongle_description"),
      descriptionExtra: t("getting_started_upload_dongle_description_extra"),
      actions: [
        { label: t("firmware_uploader"), link: "/uploader" },
        { label: t("getting_started_github_link_example"), link: "https://github.com/thomasgeissl/ESP-NOW-MIDI/tree/main/examples/dongle" }
      ],
    },
    {
      title: t("getting_started_upload_client_title"),
      description: t("getting_started_upload_client_description"),
      actions: [
        { label: t("getting_started_github_link_example"), link: "https://github.com/thomasgeissl/ESP-NOW-MIDI/tree/main/examples/client" }
      ],
    },
    {
      title: t("getting_started_configuration_title"),
      description: t("getting_started_configuration_description"),
      actions: [{ label: t("configurator"), link: "/configurator" }],
    },
    {
      title: t("getting_started_debugging_title"),
      description: t("getting_started_debugging_description"),
      actions: [{ label: t("midi_monitor"), link: "/debugger" }],
    },
  ];
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h1">Getting Started</Typography>
      <Typography>TODO: illustrations and action buttons</Typography>
      <List component={"ol"}>
        {steps.map((step, index) => {
          return (
            <ListItem key={`step-${index}`} sx={{ marginTop: 4 }}>
              <Box display={"flex"} flexDirection="column" gap={1}>
                <Typography variant="h4">{step.title}</Typography>
                <Typography variant="body2">{step.description}</Typography>
                {step.descriptionExtra && (
                  <Typography variant="body2" fontStyle={"italic"}>
                    {step.descriptionExtra}
                  </Typography>
                )}
                <Box display={"flex"} gap={2} marginTop={1} marginLeft={2}>
                  {step.actions.map((action, actionIndex) => (
                    <Button
                      variant="outlined"
                      key={`step-${index}-action-${actionIndex}`}
                      component={NavLink}
                      to={action.link}
                      target={action.link.startsWith("http") ? "_blank" : undefined}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
};
export default GettingStarted;
