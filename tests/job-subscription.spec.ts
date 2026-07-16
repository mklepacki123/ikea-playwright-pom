import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { JobsLandingPage } from '../pages/JobsLandingPage';
import { CookieBanner } from '../components/CookieBanner';
import { JobAlertsSubscriptionPanel } from '../components/JobAlertsSubscriptionPanel';

const SUBSCRIPTION_CATEGORY = 'eCommerce';
const SUBSCRIPTION_LOCATION = 'Warsaw, Mazovia';
const LOCATION_SEARCH_TERM = 'War';

test.describe('Job subscription', () => {
  let homePage: HomePage;
  let jobsLandingPage: JobsLandingPage;
  let cookieBanner: CookieBanner;
  let subscriptionPanel: JobAlertsSubscriptionPanel;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    jobsLandingPage = new JobsLandingPage(page);
    cookieBanner = new CookieBanner(page);

    subscriptionPanel = new JobAlertsSubscriptionPanel(page);
  });

  test('User can subscribe for job alerts', async ({ page }) => {
    const email = `autotest-${Date.now()}@example.com`;

    // Step 1: Open IKEA website
    await homePage.goto();

    // Step 2: Open Jobs section
    await homePage.openJobs();

    // Step 3: Click Explore Available Jobs
    await jobsLandingPage.exploreAvailableJobs();

    await expect(page).toHaveURL(/jobs\.ikea\.com/);

    /**
     * In a fresh browser context the consent dialog
     * always appears. If it lands during form interaction,
     * accepting it re-initializes the job alert modules
     * and resets user input.
     *
     * Settle it before touching the form.
     */
    await cookieBanner.waitForJobsConsentSettled();

    await subscriptionPanel.expectSubscriptionFormReady();

    // Steps 5-6: Select category, location and add the interest.
    // These act as ONE atomic unit: the chip is baked from the current
    // form state at Add-click time, and the form scripts can silently
    // wipe the category while the location is typed (trace evidence).
    await subscriptionPanel.addInterest(
      SUBSCRIPTION_CATEGORY,
      LOCATION_SEARCH_TERM,
      SUBSCRIPTION_LOCATION,
    );

    await subscriptionPanel.expectKeywordAdded(SUBSCRIPTION_CATEGORY, SUBSCRIPTION_LOCATION);

    // Step 4 (moved last): the form module can wipe inputs while it settles /
    // re-initializes — the email was cleared the same way the category was.
    // Filling it right before submit keeps it out of the danger window.
    await subscriptionPanel.fillEmail(email);

    // Step 7: Sign up
    await subscriptionPanel.signUp();

    await subscriptionPanel.expectSubscriptionSuccess();
  });
});
