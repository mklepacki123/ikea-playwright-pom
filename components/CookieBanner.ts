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

  async registerAutoAccept(): Promise<void> {
    await this.page.addLocatorHandler(
      this.onetrustAcceptButton,
      async () => {
        await this.onetrustAcceptButton.click();
      },
      { times: 1 },
    );
    await this.page.addLocatorHandler(
      this.jobsAcceptButton,
      async () => {
        await this.jobsAcceptButton.click();
      },
      { times: 1 },
    );
  }
}
