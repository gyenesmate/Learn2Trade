import { test, expect } from '@playwright/test';

test('happy path: login -> register navigation works', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Welcome to Learn2Trade' })).toBeVisible();

  await page.getByRole('link', { name: 'Sign up' }).click();

  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole('heading', { name: 'Join Learn2Trade' })).toBeVisible();
});
