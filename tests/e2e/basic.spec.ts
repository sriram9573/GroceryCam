import { test, expect } from '@playwright/test';

test('landing page has title and login button', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/GroceryCam/);

    // Expect login button
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
});
