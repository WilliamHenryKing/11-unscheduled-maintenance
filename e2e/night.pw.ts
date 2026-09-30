import { expect, test } from "@playwright/test";

const routes = [
  ["Mirror B counter-clockwise 45 degrees"],
  [
    "Mirror A counter-clockwise 45 degrees",
    "Mirror B counter-clockwise 45 degrees",
    "Mirror B counter-clockwise 45 degrees",
    "Mirror C counter-clockwise 45 degrees",
  ],
  [
    "Aperture A counter-clockwise 90 degrees",
    "Aperture B counter-clockwise 90 degrees",
    "Mirror B clockwise 45 degrees",
  ],
  [
    "Mirror A counter-clockwise 45 degrees",
    "Mirror B counter-clockwise 45 degrees",
    "Mirror C counter-clockwise 45 degrees",
    "Mirror C counter-clockwise 45 degrees",
  ],
  [
    "Splitter A counter-clockwise 90 degrees",
    "Mirror A clockwise 45 degrees",
    "Aperture A counter-clockwise 90 degrees",
  ],
  [
    "Aperture A counter-clockwise 90 degrees",
    "Mirror A counter-clockwise 45 degrees",
    "Mirror A counter-clockwise 45 degrees",
    "Mirror B counter-clockwise 45 degrees",
    "Mirror B counter-clockwise 45 degrees",
  ],
];

test("repair all six optical chains, discover the answering star and replay", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?e2e");
  await page.waitForFunction(() => !document.getElementById("arrival"), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Skip the guide", exact: true }).click();
  for (const [index, route] of routes.entries()) {
    if (index === 1) {
      await page.getByRole("button", { name: route[0], exact: true }).focus();
      await page.keyboard.press("2");
      await expect(
        page.getByRole("button", { name: "Select Mirror B", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(
        page.getByRole("button", { name: "Select Mirror C", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await page.getByRole("button", { name: route[0], exact: true }).click();
      await page.getByRole("button", { name: /Reset drift/ }).click();
    }
    if (index === routes.length - 1) {
      await page.getByRole("button", { name: "Replay the guide", exact: true }).click();
    }
    for (const name of route) await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByText("Alignment nominal · all receivers lit", { exact: true }),
    ).toBeVisible();
    const next = page.getByRole("button", {
      name: index === routes.length - 1 ? "Close the log" : "Next repair",
      exact: true,
    });
    await next.waitFor({ timeout: 45000 });
    if (index === routes.length - 1) {
      await expect(page.getByLabel("Maintenance guide", { exact: true })).toContainText(
        "Choose Close the log",
      );
    }
    await next.click();
  }
  await expect(
    page.getByRole("heading", { name: "Maintenance complete", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("6 repairs · 21 turns · 1 new entry", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Begin a new night", exact: true }).click();
  await expect(page.getByRole("heading", { name: /First Light/ })).toBeVisible();
  await expect(page.getByRole("button", { name: routes[0]?.[0], exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test.describe("small touch screens", () => {
  test.use({ hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 568, height: 320 },
  ]) {
    test(`${viewport.width}x${viewport.height}: start, repair and continue`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/?e2e&intro");
      await page.waitForFunction(() => !document.getElementById("arrival"), null, {
        timeout: 90_000,
      });
      const begin = page.getByRole("button", { name: "Begin maintenance", exact: true });
      await begin.scrollIntoViewIfNeeded();
      await begin.tap();
      await expect(page.getByLabel("Maintenance guide", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: routes[0]?.[0], exact: true }).tap();
      await page
        .getByRole("button", { name: "Next repair", exact: true })
        .waitFor({ timeout: 15000 });
      if (viewport.height < 550) {
        await expect(page.getByLabel("Maintenance guide", { exact: true })).toBeHidden();
      } else {
        const guide = await page.getByLabel("Maintenance guide", { exact: true }).boundingBox();
        const card = await page
          .getByRole("dialog", { name: "The Tern", exact: true })
          .boundingBox();
        expect(guide && card && guide.y + guide.height <= card.y).toBe(true);
      }
      await page.screenshot({ path: `test-results/touch-${viewport.width}.png` });
      await page.getByRole("button", { name: "Next repair", exact: true }).tap({ timeout: 15000 });
      await expect(page.getByRole("heading", { name: /Two Drifts/ })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
    });
  }
});
