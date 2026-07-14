import { Locator, Page } from '@playwright/test';
import { CookieBanner } from '../components/CookieBanner';

export class HomePage {
  readonly page: Page;
  readonly jobsLink: Locator;
  readonly cookieBanner: CookieBanner;

  constructor(page: Page) {
    this.page = page;
    this.jobsLink = page.getByRole('navigation').getByRole('link', { name: /jobs/i });
    this.cookieBanner = new CookieBanner(page);
  }

  async goto() {
    await this.cookieBanner.registerAutoAccept();
    await this.page.goto('/');
  }

  async openJobs() {
    await this.jobsLink.click();
  }
}
