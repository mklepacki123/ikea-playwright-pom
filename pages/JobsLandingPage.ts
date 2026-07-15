import { Locator, Page } from '@playwright/test';

export class JobsLandingPage {
  readonly page: Page;
  readonly exploreJobsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.exploreJobsLink = page.getByRole('link', { name: 'Explore available jobs' });
  }

  async exploreAvailableJobs() {
    await this.exploreJobsLink.click();
  }
}
