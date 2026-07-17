import { expect, Locator, Page } from '@playwright/test';

export class JobAlertsSubscriptionPanel {
  readonly page: Page;
  readonly subscriptionPanel: Locator;
  readonly emailInput: Locator;
  readonly categorySelect: Locator;
  readonly locationCombobox: Locator;
  readonly addButton: Locator;
  readonly signUpButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.subscriptionPanel = page.locator('.job-alert__wrapper');
    this.emailInput = this.subscriptionPanel.locator('[name="EmailAddress"]');
    this.categorySelect = this.subscriptionPanel.locator('[name="Category"]');
    this.locationCombobox = this.subscriptionPanel.getByRole('combobox', {
      name: /location/i,
    });
    this.addButton = this.subscriptionPanel.getByRole('button', {
      name: 'Add Job Alert',
    });
    this.signUpButton = this.subscriptionPanel.getByRole('button', {
      name: 'Submit Job Alerts',
    });
    // injected outside .job-alert__wrapper, directly into the form
    this.successMessage = page.locator('form.job-alert .form-message');
  }

  async expectSubscriptionFormReady(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    // The settling form module can silently clear inputs — verify it stuck.
    await expect(this.emailInput).toHaveValue(email);
  }

  async addInterest(category: string, searchTerm: string, location: string): Promise<void> {
    // The chip is baked from the CURRENT form state when Add is clicked, and
    // the form module can silently wipe the category selection while the
    // location is being typed (trace evidence: placeholder in the Before
    // snapshot of the suggestion click, with zero category-related network
    // traffic). Category, location and Add must therefore act as one atomic,
    // retryable unit — with the category re-verified right before Add.
    for (let attempt = 0; attempt < 2; attempt++) {
      await this.categorySelect.selectOption({ label: category });
      await expect(this.categorySelect).toHaveValue(/\d+/);

      await this.locationCombobox.clear();
      await this.locationCombobox.pressSequentially(searchTerm, { delay: 100 });

      const listboxId = await this.locationCombobox.getAttribute('aria-controls');
      if (!listboxId) {
        throw new Error('Location combobox does not expose aria-controls attribute.');
      }

      try {
        await this.page
          .locator(`#${listboxId}`)
          .getByRole('option', { name: location })
          .click({ timeout: 5000 });
      } catch {
        continue; // dropdown reset mid-typing — retry the whole unit
      }

      // Last-moment guard: re-select the category if the module wiped it.
      if (!/^\d+$/.test(await this.categorySelect.inputValue())) {
        await this.categorySelect.selectOption({ label: category });
        await expect(this.categorySelect).toHaveValue(/\d+/);
      }

      await this.addButton.click();
      return;
    }
    throw new Error(`Could not add interest "${category}, ${location}" after retry.`);
  }

  async expectKeywordAdded(category: string, location: string): Promise<void> {
    await expect(
      this.subscriptionPanel.locator('.keyword-text', { hasText: `${category}, ${location}` }),
    ).toBeVisible();
  }

  async signUp(): Promise<void> {
    await this.signUpButton.click();
  }

  async expectSubscriptionSuccess(): Promise<void> {
    await expect(this.successMessage).toContainText('submitted successfully');
  }
}
