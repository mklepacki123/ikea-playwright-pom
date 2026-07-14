# ikea-playwright-pom

Automation training - example on IKEA site

Scenario 1: Search for a job

1. Open the IKEA website https://www.ikea.com/
2. Click on 'Jobs' tab
3. Click on 'Explore available jobs'
4. Input 'Manager' in Search field (leave postcode empty)
5. Click on 'Search jobs' button
6. Implement the following logic: If search returns 0 jobs, go back and search for 'Designer' (or any other job title)
7. Click on the first job in the list
8. Check that partial job title is 'Manager'
9. Click on 'Save' button
10. Check that 'Saved jobs' element has '1' in it
11. Click on 'Saved jobs' element
12. Check that the job title in 'Saved jobs' is 'Manager'

Scenario 2: Subscribe for a job

1. Open the IKEA website
2. Click on 'Jobs' tab
3. Click on 'Explore available jobs'
4. Input Email in Subscription block (it should be generated every time)
5. Select a 'Category' and Add it
6. Input Location and choose it in dropdown
7. Click on 'Sign up' and check confirmation message

Scenario 3:

1. Create any test case for the IKEA website https://www.ikea.com/
2. Ask AI to generate the test
3. After implementing the test, perform a code review considering the following points:

· Correct usage of Page Object Model (POM) structure
· Separation of test logic and page object logic
· Readability and clarity of the code
· Naming conventions (tests, methods, variables)
· Quality and stability of locators
· Proper usage of assertions
· Avoiding duplication (DRY principle)
· Avoiding hardcoded values (URLs, selectors, test data)
· Test stability and flakiness risks (waits, selectors, timing issues)
· Overall maintainability and scalability of the test

Add your comments to generated test, compare AI feedback with your own review.

/_ pages/
├── HomePage.ts # ikea.com → Jobs tab
├── JobsLandingPage.ts # Explore available jobs
├── JobsSearchPage.ts # search + 0-results fallback
└── JobDetailsPage.ts # title, Save
components/
├── CookieBanner.ts # oba banery (OneTrust + Radancy)
└── SavedJobsPanel.ts # licznik, otwarcie panelu, tytuł zapisanej oferty
_/
