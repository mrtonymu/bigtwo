import { test, expect } from '@playwright/test';

test('can create a game and join as player', async ({ page }) => {
  await page.goto('/');
  
  // Handle password protection with more reliable selectors
  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('今天睡老板 明天睡地板');
    await page.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page.waitForLoadState('networkidle');
  }

  // Fill in the form fields first to enable the button
  await page.getByPlaceholder('观影者名称').fill('Test Player');
  await page.getByPlaceholder('观影房间名称').fill('Test Game');
  
  // Now the button should be enabled
  await page.getByRole('button', { name: '创建观影房间' }).click();
  
  // Expect to be on the game lobby page
  await expect(page).toHaveURL(/.*game/);
  
  // Expect to see the game name
  await expect(page.getByText('Test Game')).toBeVisible();
  
  // Player already joined during game creation, so we should see the player name
  await expect(page.getByText('Test Player')).toBeVisible();
});

test('can start game with multiple players', async ({ page }) => {
  // Create a game
  await page.goto('/');
  
  // Handle password protection with more reliable selectors
  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('今天睡老板 明天睡地板');
    await page.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page.waitForLoadState('networkidle');
  }
  
  // Fill in the form fields first to enable the button
  await page.getByPlaceholder('观影者名称').fill('Host');
  await page.getByPlaceholder('观影房间名称').fill('Test Game');
  
  // Now the button should be enabled
  await page.getByRole('button', { name: '创建观影房间' }).click();
  
  // Get the game ID from the URL
  const url = page.url();
  const gameId = url.split('/').pop();
  
  // Host has already joined, now let's add more players
  // Open new pages for other players
  const page2 = await page.context().newPage();
  await page2.goto(`/game/${gameId}`);
  
  // Handle password protection on second page with more reliable selectors
  const passwordInput2 = page2.locator('input[type="password"]');
  if (await passwordInput2.isVisible()) {
    await passwordInput2.fill('今天睡老板 明天睡地板');
    await page2.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page2.waitForLoadState('networkidle');
  }
  
  await page2.getByPlaceholder('观影者名称').fill('Player 2');
  await page2.getByRole('button', { name: '加入游戏' }).click();
  
  const page3 = await page.context().newPage();
  await page3.goto(`/game/${gameId}`);
  
  // Handle password protection on third page with more reliable selectors
  const passwordInput3 = page3.locator('input[type="password"]');
  if (await passwordInput3.isVisible()) {
    await passwordInput3.fill('今天睡老板 明天睡地板');
    await page3.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page3.waitForLoadState('networkidle');
  }
  
  await page3.getByPlaceholder('观影者名称').fill('Player 3');
  await page3.getByRole('button', { name: '加入游戏' }).click();
  
  const page4 = await page.context().newPage();
  await page4.goto(`/game/${gameId}`);
  
  // Handle password protection on fourth page with more reliable selectors
  const passwordInput4 = page4.locator('input[type="password"]');
  if (await passwordInput4.isVisible()) {
    await passwordInput4.fill('今天睡老板 明天睡地板');
    await page4.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page4.waitForLoadState('networkidle');
  }
  
  await page4.getByPlaceholder('观影者名称').fill('Player 4');
  await page4.getByRole('button', { name: '加入游戏' }).click();
  
  // Start the game from the first page (host)
  await page.getByRole('button', { name: '开始游戏' }).click();
  
  // Expect game to start on all pages
  // Wait a bit for game to start
  await page.waitForTimeout(3000);
  await expect(page.getByText('游戏进行中')).toBeVisible();
  await expect(page2.getByText('游戏进行中')).toBeVisible();
  await expect(page3.getByText('游戏进行中')).toBeVisible();
  await expect(page4.getByText('游戏进行中')).toBeVisible();
});