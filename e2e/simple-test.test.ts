import { test, expect } from '@playwright/test';

test('simple navigation test', async ({ page }) => {
  // Navigate to homepage
  await page.goto('/');
  
  // Check if we're on the right page
  await expect(page).toHaveTitle(/CNFLIX/);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/simple-homepage.png' });
  
  // Check for password protection
  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    console.log('Password protection detected');
    await passwordInput.fill('今天睡老板 明天睡地板');
    await page.getByRole('button', { name: '进入CNFLIX' }).click();
    // Wait for navigation and page load
    await page.waitForLoadState('networkidle');
  } else {
    console.log('No password protection detected');
  }
  
  // Wait a bit for page to load completely
  await page.waitForTimeout(5000);
  
  // Take another screenshot after password handling
  await page.screenshot({ path: 'test-results/simple-homepage-after-password.png' });
  
  // Check if we can find the create game button
  const createGameButton = page.getByRole('button', { name: '创建观影房间' });
  const isButtonVisible = await createGameButton.isVisible();
  console.log('Create game button visible:', isButtonVisible);
  
  if (isButtonVisible) {
    console.log('Test passed: Found create game button');
  } else {
    console.log('Test failed: Could not find create game button');
    // Let's try to find any buttons
    const buttons = await page.locator('button').all();
    console.log('Number of buttons found:', buttons.length);
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const buttonText = await buttons[i].textContent();
      console.log(`Button ${i}: ${buttonText}`);
    }
  }
});