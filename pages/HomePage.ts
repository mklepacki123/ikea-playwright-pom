/* pages/
├── HomePage.ts          # ikea.com → Jobs tab
├── JobsLandingPage.ts   # Explore available jobs
├── JobsSearchPage.ts    # search + 0-results fallback
└── JobDetailsPage.ts    # title, Save
components/
├── CookieBanner.ts      # oba banery (OneTrust + Radancy)
└── SavedJobsPanel.ts    # licznik, otwarcie panelu, tytuł zapisanej oferty
*/

import { Locator, Page } from '@playwright/test';
import { CookieBanner } from '../components/CookieBanner';


export class HomePage {
  readonly page: Page;
  readonly jobsLink: Locator;
  readonly cookieBanner: CookieBanner;

  constructor(page: Page) {
    this.page = page;
    this.jobsLink = page
      .getByRole("navigation")
      .getByRole("link", { name: /jobs/i });
    this.cookieBanner = new CookieBanner(page);
  }

  async goto() {
    await this.page.goto("/");
    await this.cookieBanner.acceptIfVisible();
  }
  async openJobs() {
    await this.jobsLink.click();
  }
}
