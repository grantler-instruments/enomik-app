// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import InstagramEmbed, { instagramShortcode } from "./InstagramEmbed";

const URL = "https://www.instagram.com/p/DfNd3Z6uDaG/";

const renderEmbed = (url = URL) =>
	renderWithProviders(
		<InstagramEmbed url={url} author="lili.lihe" title="Workshop post" />,
	);

describe("instagramShortcode", () => {
	it("reads posts and reels, with or without query or trailing slash", () => {
		expect(instagramShortcode(URL)).toBe("DfNd3Z6uDaG");
		expect(
			instagramShortcode("https://instagram.com/p/DfNd3Z6uDaG?igsh=abc"),
		).toBe("DfNd3Z6uDaG");
		expect(instagramShortcode("https://www.instagram.com/reel/C-x_1/")).toBe(
			"C-x_1",
		);
		expect(instagramShortcode("https://example.com/p/abc/")).toBeNull();
	});
});

describe("InstagramEmbed", () => {
	it("contacts nothing until asked: no frame, a link and a load button", () => {
		const { container } = renderEmbed();
		expect(container.querySelector("iframe")).toBeNull();
		expect(screen.getByText("@lili.lihe")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Open on Instagram" }),
		).toHaveAttribute("href", URL);
	});

	it("loads the post's embed after the click", async () => {
		const user = userEvent.setup();
		renderEmbed();
		await user.click(screen.getByRole("button", { name: "Show post" }));
		expect(screen.getByTitle("Workshop post")).toHaveAttribute(
			"src",
			"https://www.instagram.com/p/DfNd3Z6uDaG/embed/captioned/",
		);
	});

	it("renders nothing for a URL that isn't a post", () => {
		const { container } = renderEmbed("https://example.com/");
		expect(container).toBeEmptyDOMElement();
	});
});
