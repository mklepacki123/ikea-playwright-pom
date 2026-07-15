import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { JobsLandingPage } from '../pages/JobsLandingPage';
import { JobsSearchPage } from '../pages/JobsSearchPage';
import { JobDetailsPage } from '../pages/JobDetailsPage';
import { SavedJobsPanel } from '../components/SavedJobsPanel';

const PRIMARY_SEARCH_TERM = 'Manager';
const FALLBACK_SEARCH_TERM = 'Designer';

test.describe('IKEA Jobs Search', () => {
  let homePage: HomePage;
  let jobsLandingPage: JobsLandingPage;
  let jobsSearchPage: JobsSearchPage;
  let jobDetailsPage: JobDetailsPage;
  let savedJobsPanel: SavedJobsPanel;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    jobsLandingPage = new JobsLandingPage(page);
    jobsSearchPage = new JobsSearchPage(page);
    jobDetailsPage = new JobDetailsPage(page);
    savedJobsPanel = new SavedJobsPanel(page);
  });

  test('should search for Manager jobs and fallback to Designer if no results', async ({
    page,
  }) => {
    let activeSearchTerm = PRIMARY_SEARCH_TERM;

    // Step 1: Open the IKEA website
    await homePage.goto();
    await expect(page).toHaveURL(/.*ikea\.com/);

    // Step 2: Click on 'Jobs' tab
    await homePage.openJobs();

    // Step 3: Click on 'Explore available jobs'
    await jobsLandingPage.exploreAvailableJobs();

    // Checkpoint: verify navigation to jobs.ikea.com domain
    await expect(page).toHaveURL(/jobs\.ikea\.com/);

    // Force early consent: any action triggers the banner handler now,
    // long before Save — prevents the consent/save race
    await expect(jobsSearchPage.keywordInput).toBeVisible();

    // Step 4-5: Search for PRIMARY_SEARCH_TERM
    await jobsSearchPage.searchForJob(activeSearchTerm);

    // Step 6: Fallback logic - if 0 results, search for FALLBACK_SEARCH_TERM
    let resultsCount = await jobsSearchPage.getResultsCount();
    if (resultsCount === 0) {
      activeSearchTerm = FALLBACK_SEARCH_TERM;
      await page.goBack();
      await jobsSearchPage.searchForJob(activeSearchTerm);
      resultsCount = await jobsSearchPage.getResultsCount();
    }

    // INVARIANT: regardless of which search term, results MUST be > 0 before clicking
    expect(resultsCount).toBeGreaterThan(0);

    // Step 7: Click on the first job in the list
    await jobsSearchPage.openFirstJob();

    // Checkpoint: verify navigation to job detail page (not just any jobs.* URL)
    await expect(page).toHaveURL(/\/job\//);

    // Step 8: Check that partial job title is activeSearchTerm
    await jobDetailsPage.expectJobTitleContains(activeSearchTerm);

    // Step 9: Click on 'Save' button
    await jobDetailsPage.saveJob();

    // Checkpoint: verify job was saved
    await jobDetailsPage.expectJobIsSaved();

    // Step 10: Check that "Saved jobs" element has '1' in it
    await savedJobsPanel.expectSavedJobsCount(1);

    // Step 11: Click on "Saved jobs" element
    await savedJobsPanel.openSavedJobs();

    // Checkpoint: verify "Saved jobs" panel is open
    await savedJobsPanel.expectSavedJobsPanelOpen();

    // Step 12: Check that the job title in "Saved jobs" is activeSearchTerm
    await savedJobsPanel.expectSavedJobTitleContains(activeSearchTerm);
  });
});
