import { test, expect } from '@playwright/test';

test('can play a game round', async ({ page }) => {
  await page.goto('/');
  
  // Handle password protection with more reliable selectors
  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('今天睡老板 明天睡地板');
    await page.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page.waitForLoadState('networkidle');
  }

  // Create a game
  await page.getByRole('button', { name: '创建观影房间' }).click();
  await page.getByPlaceholder('观影房间名称').fill('Test Game');
  await page.getByRole('button', { name: '创建观影房间' }).click();
  
  // Get the game ID from the URL
  const url = page.url();
  const gameId = url.split('/').pop();
  
  // Join as player
  await page.getByPlaceholder('观影者名称').fill('Player 1');
  await page.getByRole('button', { name: '加入游戏' }).click();
  
  // Expect to see game interface
  // Wait a bit for game to load
  await page.waitForTimeout(3000);
  await expect(page.getByText('我的手牌')).toBeVisible();
  await expect(page.getByText('游戏状态')).toBeVisible();
  
  // Test that we can see our cards
  await expect(page.getByTestId('player-hand')).toBeVisible();
});

test('can sort cards by rank and suit', async ({ page }) => {
  await page.goto('/');
  
  // Handle password protection with more reliable selectors
  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('今天睡老板 明天睡地板');
    await page.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page.waitForLoadState('networkidle');
  }

  // Create a game
  await page.getByRole('button', { name: '创建观影房间' }).click();
  await page.getByPlaceholder('观影房间名称').fill('Test Game');
  await page.getByRole('button', { name: '创建观影房间' }).click();
  
  // Get the game ID from the URL
  const url = page.url();
  const gameId = url.split('/').pop();
  
  // Join as player
  await page.getByPlaceholder('观影者名称').fill('Player 1');
  await page.getByRole('button', { name: '加入游戏' }).click();
  
  // Expect to see game interface
  // Wait a bit for game to load
  await page.waitForTimeout(3000);
  await expect(page.getByText('我的手牌')).toBeVisible();
  
  // Test sorting buttons
  await expect(page.getByRole('button', { name: '整理' })).toBeVisible();
  await expect(page.getByRole('button', { name: '点数' })).toBeVisible();
});