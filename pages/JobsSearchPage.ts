import { expect, Locator, Page } from '@playwright/test';

export class JobsSearchPage {
  readonly page: Page;
  readonly searchForm: Locator;
  readonly keywordInput: Locator;
  readonly searchJobsButton: Locator;
  readonly searchResults: Locator;
  readonly jobTitles: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchForm = page.locator('form.search-form--home');
    this.keywordInput = this.searchForm.getByRole('searchbox', { name: 'Keyword Search' });
    this.searchJobsButton = this.searchForm.getByRole('button', { name: 'Search jobs' });
    this.searchResults = page.locator('#search-results');
    this.jobTitles = page.locator('.job-list__title');
    this.noResultsMessage = page.locator('#no-results');
  }

  async expectSearchFormReady(): Promise<void> {
    await expect(this.keywordInput).toBeVisible();
  }

  async searchForJob(jobTitle: string): Promise<void> {
    await this.keywordInput.fill(jobTitle);
    await this.searchJobsButton.click();
  }

  async getResultsCount(): Promise<number> {
    await Promise.race([
      this.jobTitles.first().waitFor({ state: 'visible' }),
      this.noResultsMessage.waitFor({ state: 'visible' }),
    ]);

    return Number(await this.searchResults.getAttribute('data-total-results'));
  }

  async openFirstJob(): Promise<void> {
    await this.jobTitles.first().click();
  }
}
