import { Locator, Page } from '@playwright/test';
import { CookieBanner } from '../components/CookieBanner';


export class JobsLandingPage {
  readonly page: Page;
  readonly exploreJobsLink: Locator;
  readonly cookieBanner: CookieBanner;

  constructor(page: Page) {
    this.page = page;
    this.exploreJobsLink = page.getByRole('link', { name: 'Explore available jobs' });
    this.cookieBanner = new CookieBanner(page);
  }

  async exploreAvailableJobs() {
    await this.cookieBanner.acceptIfVisible();
    await this.exploreJobsLink.click();
  }
}

