import { expect, Locator, Page } from '@playwright/test';

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

  async waitForJobsConsentSettled(): Promise<void> {
    // In a fresh browser context the consent dialog always appears shortly
    // after load; accepting it mid-form resets form modules (category select,
    // location autocomplete). This retrying assertion gives the auto-accept
    // handler repeated chances to fire and then verifies the banner is gone —
    // by the time it passes, consent is settled and the form is safe to use.
    await expect(this.jobsAcceptButton).toBeHidden({ timeout: 15000 });
  }
}
