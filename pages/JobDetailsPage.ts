import { expect, Locator, Page } from '@playwright/test';

export class JobDetailsPage {
  readonly page: Page;
  readonly jobTitle: Locator;
  readonly jobDetailsSection: Locator;
  readonly saveJobButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.jobTitle = page.getByRole('heading', { level: 1 });
    this.jobDetailsSection = page.locator('[data-selector-name="jobdetails"]');
    this.saveJobButton = this.jobDetailsSection
      .getByRole('button', { name: 'Save Job' })
      .filter({ visible: true })
      .first();
  }

  async expectJobTitleContains(keyword: string): Promise<void> {
    await expect(this.jobTitle).toContainText(keyword, { ignoreCase: true });
  }

  async saveJob(): Promise<void> {
    await this.saveJobButton.click();
    try {
      await expect(this.saveJobButton).toHaveAttribute('data-job-saved', 'true', { timeout: 5000 });
    } catch {
      // Rare race: the first click can be swallowed while consent scripts settle.
      // One deliberate retry — if this fails too, the test should fail loudly.
      await this.saveJobButton.click();
    }
  }

  async expectJobIsSaved(): Promise<void> {
    await expect(this.saveJobButton).toHaveAttribute('data-job-saved', 'true');
  }
}
