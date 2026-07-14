import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { JobsLandingPage } from '../pages/JobsLandingPage';
import { JobsSearchPage } from '../pages/JobsSearchPage';

const PRIMARY_SEARCH_TERM = 'Manager';
const FALLBACK_SEARCH_TERM = 'Designer';

test.describe('IKEA Jobs Search', () => {
  let homePage: HomePage;
  let jobsLandingPage: JobsLandingPage;
  let jobsSearchPage: JobsSearchPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    jobsLandingPage = new JobsLandingPage(page);
    jobsSearchPage = new JobsSearchPage(page);
  });

  test('should search for Manager jobs and fallback to Designer if no results', async ({
    page,
  }) => {
    // Step 1: Open the IKEA website
    await homePage.goto();
    await expect(page).toHaveURL(/.*ikea\.com/);

    // Step 2: Click on 'Jobs' tab
    await homePage.openJobs();

    // Step 3: Click on 'Explore available jobs'
    await jobsLandingPage.exploreAvailableJobs();

    // Checkpoint: verify navigation to jobs.ikea.com domain
    await expect(page).toHaveURL(/jobs\.ikea\.com/);

    // Step 4-5: Search for PRIMARY_SEARCH_TERM
    await jobsSearchPage.searchForJob(PRIMARY_SEARCH_TERM);

    // Step 6: Fallback logic - if 0 results, search for FALLBACK_SEARCH_TERM
    let resultsCount = await jobsSearchPage.getResultsCount();

    if (resultsCount === 0) {
      await page.goBack();
      await jobsSearchPage.searchForJob(FALLBACK_SEARCH_TERM);
      resultsCount = await jobsSearchPage.getResultsCount();
    }

    // INVARIANT: regardless of which search term, results MUST be > 0 before clicking
    expect(resultsCount).toBeGreaterThan(0);

    // Step 7: Click on the first job in the list
    await jobsSearchPage.openFirstJob();

    // Checkpoint: verify navigation to job detail page (not just any jobs.* URL)
    await expect(page).toHaveURL(/\/job\//);
  });
});
