import { Locator, Page } from '@playwright/test';

export class CookieBanner {
  readonly page: Page;
  readonly onetrustAcceptButton: Locator;
  readonly jobsAcceptButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.onetrustAcceptButton = page.locator('#onetrust-accept-btn-handler');
    this.jobsAcceptButton = page.locator('#system-ialert-button');
  }
 async acceptIfVisible() {
    if (await this.onetrustAcceptButton.isVisible().catch(() => false)) {
      await this.onetrustAcceptButton.click();
    }
    if (await this.jobsAcceptButton.isVisible().catch(() => false)) {
      await this.jobsAcceptButton.click();
    }
  }
}