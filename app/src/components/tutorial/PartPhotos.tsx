import { Box, ButtonBase, Link, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Lightbox from "./Lightbox";

/** Photos from Wikimedia Commons, stored in public/tutorial. Keep the credits accurate. */
type Photo = {
	id: string;
	author: string;
	license: string;
	licenseUrl: string;
	source: string;
};

const PHOTOS: Record<string, Photo> = {
	button: {
		id: "button",
		author: "Scwerllguy",
		license: "CC BY-SA 3.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
		source: "https://commons.wikimedia.org/wiki/File:Tactile_switches.jpg",
	},
	potentiometer: {
		id: "potentiometer",
		author: "Iainf",
		license: "CC BY 2.5",
		licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
		source: "https://commons.wikimedia.org/wiki/File:Potentiometer.jpg",
	},
	photoresistor: {
		id: "photoresistor",
		author: "Retired electrician",
		license: "CC0",
		licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
		source:
			"https://commons.wikimedia.org/wiki/File:GL5528_photoresistors_01.jpg",
	},
	motion: {
		id: "motion",
		author: "Nevit Dilmen",
		license: "CC BY-SA 3.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
		source:
			"https://commons.wikimedia.org/wiki/File:GY-521_MPU-6050_Module_3_Axis_Gyroscope_%2B_Accelerometer_0487.jpg",
	},
	leds: {
		id: "leds",
		author: "SparkFun Electronics",
		license: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
		source:
			"https://commons.wikimedia.org/wiki/File:LED_Rainbow_Pack_-_5mm_PTH_12903-01.jpg",
	},
	neopixels: {
		id: "neopixels",
		author: "SparkFun Electronics",
		license: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
		source:
			"https://commons.wikimedia.org/wiki/File:16346-SMD_LED_-_RGB_WS2812B_Strip_of_50_-01.jpg",
	},
	servo: {
		id: "servo",
		author: "Suyash Dwivedi",
		license: "CC BY-SA 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
		source:
			"https://commons.wikimedia.org/wiki/File:Tower_Pro_SG90_micro_servo_motor.jpg",
	},
	relay: {
		id: "relay",
		author: "Suyash Dwivedi",
		license: "CC BY-SA 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
		source:
			"https://commons.wikimedia.org/wiki/File:SRD-05VDC-SL-C_5V_one-channel_relay_module.jpg",
	},
	nfc: {
		id: "nfc",
		author: "oomlout",
		license: "CC BY-SA 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
		source:
			"https://commons.wikimedia.org/wiki/File:ARSH-19-RF_02_(14152092267).jpg",
	},
	nfc_card: {
		id: "nfc_card",
		author: "Gleam",
		license: "CC BY-SA 3.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
		source: "https://commons.wikimedia.org/wiki/File:RFID_card.jpg",
	},
	nfc_sticker: {
		id: "nfc_sticker",
		author: "HenryWortel",
		license: "CC BY-SA 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
		source: "https://commons.wikimedia.org/wiki/File:NFC_Tag_Chip.jpg",
	},
	nfc_keyring: {
		id: "nfc_keyring",
		author: "Andreas",
		license: "CC BY-SA 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
		source: "https://commons.wikimedia.org/wiki/File:NFC_tag.jpg",
	},
};

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Grid of part photos with name and credit line. */
const PartPhotos = ({ ids }: { ids: (keyof typeof PHOTOS)[] }) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState<number | null>(null);
	const images = ids.map((key) => {
		const photo = PHOTOS[key];
		const name = t(`tutorial_photo_${photo.id}`);
		return {
			src: `${import.meta.env.BASE_URL}/tutorial/${photo.id}.jpg`,
			alt: name,
			caption: `${name} · ${t("tutorial_photo_credit")}: ${photo.author}, ${photo.license}`,
		};
	});
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
				gap: 2,
				my: 3,
			}}
		>
			<Lightbox
				images={images}
				index={open}
				onChange={setOpen}
				onClose={() => setOpen(null)}
			/>
			{ids.map((key, index) => {
				const photo = PHOTOS[key];
				const { src, alt: name } = images[index];
				return (
					<Box component="figure" key={photo.id} sx={{ m: 0 }}>
						<ButtonBase
							onClick={() => setOpen(index)}
							aria-label={name}
							sx={{
								display: "block",
								width: "100%",
								cursor: "zoom-in",
								borderRadius: 2,
							}}
						>
							<Box
								component="img"
								src={src}
								alt={name}
								loading="lazy"
								sx={{
									display: "block",
									width: "100%",
									aspectRatio: "4 / 3",
									objectFit: "cover",
									borderRadius: 2,
									border: 1,
									borderColor: "divider",
									bgcolor: "common.white",
								}}
							/>
						</ButtonBase>
						<Box component="figcaption" sx={{ mt: 0.75 }}>
							<Typography variant="body2" fontWeight={600}>
								{name}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", lineHeight: 1.3 }}
							>
								{t("tutorial_photo_credit")}:{" "}
								<Link href={photo.source} color="inherit" {...external}>
									{photo.author}
								</Link>
								,{" "}
								<Link href={photo.licenseUrl} color="inherit" {...external}>
									{photo.license}
								</Link>
							</Typography>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};

export default PartPhotos;
