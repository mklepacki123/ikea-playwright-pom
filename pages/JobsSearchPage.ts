import { Locator, Page } from '@playwright/test';
import { CookieBanner } from '../components/CookieBanner';

export class JobsSearchPage {
  readonly page: Page;
  readonly cookieBanner: CookieBanner;
  readonly keywordInput: Locator;
  readonly searchJobsButton: Locator;
  readonly searchResults: Locator;
  readonly jobCards: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.keywordInput = page.getByLabel('Keyword Search');
    this.searchJobsButton = page.getByRole('button', { name: 'Search jobs' });
    this.searchResults = page.locator('#search-results');
    this.jobCards = page.locator('.job-list__title');
    this.noResultsMessage = page.locator('#no-results');
    this.cookieBanner = new CookieBanner(page);
  }

  async searchForJob(jobTitle: string): Promise<void> {
    await this.cookieBanner.acceptIfVisible();
    await this.keywordInput.fill(jobTitle);
    await this.searchJobsButton.click();
  }

  async getResultsCount(): Promise<number> {
    await Promise.race([
      this.jobCards.first().waitFor({ state: 'visible' }),
      this.noResultsMessage.waitFor({ state: 'visible' }),
    ]);

    return Number(await this.searchResults.getAttribute('data-total-results'));
  }

  async openFirstJob(): Promise<void> {
    await this.jobCards.first().click();
  }
}
