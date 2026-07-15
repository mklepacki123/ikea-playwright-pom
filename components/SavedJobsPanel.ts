import { expect, Locator, Page } from '@playwright/test';

export class SavedJobsPanel {
  readonly page: Page;
  readonly savedJobsButton: Locator;
  readonly savedJobsCounter: Locator;
  readonly savedJobsTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.savedJobsButton = page.locator('.saved-jobs-dropdown__button');
    this.savedJobsCounter = page.locator('.saved-jobs-dropdown__number');
    this.savedJobsTitle = page.locator('.saved-jobs-dropdown__jobtitle');
  }

  async expectSavedJobsCount(count: number): Promise<void> {
    await expect(this.savedJobsCounter).toContainText(count.toString());
  }

  async openSavedJobs(): Promise<void> {
    await this.savedJobsButton.click();
  }

  async expectSavedJobsPanelOpen(): Promise<void> {
    await expect(this.savedJobsButton).toHaveAttribute('aria-expanded', 'true');
  }

  async expectSavedJobTitleContains(keyword: string): Promise<void> {
    await expect(this.savedJobsTitle).toContainText(keyword);
  }
}
