import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { TEST_CONFIG } from '@config/test.config';

export class DashboardPage extends BasePage {
  // Page elements
  private readonly welcomeMessage: Locator;
  private readonly userProfileMenu: Locator;
  private readonly logoutButton: Locator;
  private readonly navigationMenu: Locator;
  private readonly searchBox: Locator;
  private readonly notificationBell: Locator;
  private readonly settingsButton: Locator;
  private readonly dashboardCards: Locator;
  private readonly recentActivities: Locator;
  private readonly quickActions: Locator;
  private readonly sidebarToggle: Locator;
  private readonly breadcrumb: Locator;

  constructor(page: Page) {
    super(page, TEST_CONFIG.ENDPOINTS.DASHBOARD);
    
    // Initialize locators
    this.welcomeMessage = page.locator('[data-testid="welcome-message"], .welcome-message, h1');
    this.userProfileMenu = page.locator('[data-testid="user-profile"], .user-profile, .profile-menu');
    this.logoutButton = page.locator('[data-testid="logout"], .logout-btn, a[href*="logout"]');
    this.navigationMenu = page.locator('[data-testid="nav-menu"], .navigation, nav');
    this.searchBox = page.locator('[data-testid="search"], input[type="search"], .search-input');
    this.notificationBell = page.locator('[data-testid="notifications"], .notification-bell, .notifications');
    this.settingsButton = page.locator('[data-testid="settings"], .settings-btn, a[href*="settings"]');
    this.dashboardCards = page.locator('[data-testid="dashboard-card"], .dashboard-card, .card');
    this.recentActivities = page.locator('[data-testid="recent-activities"], .recent-activities, .activity-list');
    this.quickActions = page.locator('[data-testid="quick-actions"], .quick-actions, .action-buttons');
    this.sidebarToggle = page.locator('[data-testid="sidebar-toggle"], .sidebar-toggle, .menu-toggle');
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
  }

  /**
   * Check if dashboard page is loaded
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await this.waitForElement(this.welcomeMessage);
      await this.waitForElement(this.userProfileMenu);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get welcome message text
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.getElementText(this.welcomeMessage);
  }

  /**
   * Click user profile menu
   */
  async clickUserProfile(): Promise<void> {
    await this.clickElement(this.userProfileMenu);
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    // First try to click profile menu if logout is in dropdown
    if (await this.isElementVisible(this.userProfileMenu)) {
      await this.clickUserProfile();
      await this.page.waitForTimeout(500); // Wait for dropdown to appear
    }
    
    await this.clickElement(this.logoutButton);
    await this.waitForUrlChange(/login|auth/);
  }

  /**
   * Search for content
   */
  async search(query: string): Promise<void> {
    await this.fillInput(this.searchBox, query);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Click notifications
   */
  async clickNotifications(): Promise<void> {
    await this.clickElement(this.notificationBell);
  }

  /**
   * Navigate to settings
   */
  async navigateToSettings(): Promise<void> {
    await this.clickElement(this.settingsButton);
    await this.waitForUrlChange(/settings/);
  }

  /**
   * Get dashboard card count
   */
  async getDashboardCardCount(): Promise<number> {
    return await this.getElementCount(this.dashboardCards);
  }

  /**
   * Get dashboard card titles
   */
  async getDashboardCardTitles(): Promise<string[]> {
    const cards = await this.getAllElements(this.dashboardCards);
    const titles: string[] = [];
    
    for (const card of cards) {
      const titleElement = card.locator('h2, h3, .card-title, [data-testid="card-title"]');
      if (await titleElement.isVisible()) {
        const title = await titleElement.textContent();
        if (title) titles.push(title.trim());
      }
    }
    
    return titles;
  }

  /**
   * Click on a specific dashboard card
   */
  async clickDashboardCard(cardTitle: string): Promise<void> {
    const card = this.dashboardCards.filter({ hasText: cardTitle });
    await this.clickElement(card);
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(): Promise<string[]> {
    if (!await this.isElementVisible(this.recentActivities)) {
      return [];
    }
    
    const activityItems = this.recentActivities.locator('.activity-item, li, .list-item');
    const activities: string[] = [];
    const count = await activityItems.count();
    
    for (let i = 0; i < count; i++) {
      const activity = await activityItems.nth(i).textContent();
      if (activity) activities.push(activity.trim());
    }
    
    return activities;
  }

  /**
   * Click quick action button
   */
  async clickQuickAction(actionName: string): Promise<void> {
    const actionButton = this.quickActions.locator('button, a').filter({ hasText: actionName });
    await this.clickElement(actionButton);
  }

  /**
   * Toggle sidebar
   */
  async toggleSidebar(): Promise<void> {
    if (await this.isElementVisible(this.sidebarToggle)) {
      await this.clickElement(this.sidebarToggle);
    }
  }

  /**
   * Navigate using main menu
   */
  async navigateToMenuItem(menuItem: string): Promise<void> {
    const menuLink = this.navigationMenu.locator('a, button').filter({ hasText: menuItem });
    await this.clickElement(menuLink);
  }

  /**
   * Get breadcrumb navigation
   */
  async getBreadcrumbPath(): Promise<string[]> {
    if (!await this.isElementVisible(this.breadcrumb)) {
      return [];
    }
    
    const breadcrumbItems = this.breadcrumb.locator('a, span, .breadcrumb-item');
    const path: string[] = [];
    const count = await breadcrumbItems.count();
    
    for (let i = 0; i < count; i++) {
      const item = await breadcrumbItems.nth(i).textContent();
      if (item) path.push(item.trim());
    }
    
    return path;
  }

  /**
   * Check if user is logged in
   */
  async isUserLoggedIn(): Promise<boolean> {
    return await this.isElementVisible(this.userProfileMenu) && 
           await this.isElementVisible(this.welcomeMessage);
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    const badge = this.notificationBell.locator('.badge, .notification-count, [data-testid="notification-count"]');
    
    if (await badge.isVisible()) {
      const countText = await badge.textContent();
      return parseInt(countText || '0', 10);
    }
    
    return 0;
  }

  /**
   * Validate dashboard layout
   */
  async validateDashboardLayout(): Promise<void> {
    // Check essential elements are present
    await this.validationUtils.validateElementIsInteractable(this.welcomeMessage);
    await this.validationUtils.validateElementIsInteractable(this.userProfileMenu);
    
    // Check navigation is present
    if (await this.isElementVisible(this.navigationMenu)) {
      await this.validationUtils.validateElementIsInteractable(this.navigationMenu);
    }
    
    // Validate dashboard cards if present
    const cardCount = await this.getDashboardCardCount();
    if (cardCount > 0) {
      await this.validationUtils.validateElementCount(this.dashboardCards, cardCount);
    }
  }

  /**
   * Wait for dashboard data to load
   */
  async waitForDashboardDataLoad(): Promise<void> {
    // Wait for any loading spinners to disappear
    const loadingSpinner = this.page.locator('.loading, .spinner, [data-testid="loading"]');
    if (await loadingSpinner.isVisible()) {
      await this.waitForElementToBeHidden(loadingSpinner);
    }
    
    // Wait for dashboard cards to be populated
    await this.waitForCondition(async () => {
      const cardCount = await this.getDashboardCardCount();
      return cardCount > 0;
    }, 10000);
  }

  /**
   * Refresh dashboard data
   */
  async refreshDashboard(): Promise<void> {
    const refreshButton = this.page.locator('[data-testid="refresh"], .refresh-btn, button[title*="refresh"]');
    
    if (await refreshButton.isVisible()) {
      await this.clickElement(refreshButton);
      await this.waitForDashboardDataLoad();
    } else {
      // Fallback to page refresh
      await this.refresh();
    }
  }

  /**
   * Take screenshot of dashboard
   */
  async takeDashboardScreenshot(name: string = 'dashboard'): Promise<string> {
    return await this.takeScreenshot(name);
  }

  /**
   * Validate dashboard performance
   */
  async validateDashboardPerformance(): Promise<void> {
    const startTime = Date.now();
    await this.waitForDashboardDataLoad();
    const loadTime = Date.now() - startTime;
    
    // Validate load time is within acceptable limits
    await this.validationUtils.validatePageLoadTime(TEST_CONFIG.PERFORMANCE_THRESHOLDS.LOAD_TIME);
    
    console.log(`Dashboard loaded in ${loadTime}ms`);
  }

  /**
   * Get user information from profile
   */
  async getUserInfo(): Promise<{ name?: string; email?: string; role?: string }> {
    await this.clickUserProfile();
    
    // Wait for profile dropdown/modal to appear
    await this.page.waitForTimeout(500);
    
    const userInfo: { name?: string; email?: string; role?: string } = {};
    
    // Try to extract user information from profile dropdown
    const nameElement = this.page.locator('[data-testid="user-name"], .user-name, .profile-name');
    const emailElement = this.page.locator('[data-testid="user-email"], .user-email, .profile-email');
    const roleElement = this.page.locator('[data-testid="user-role"], .user-role, .profile-role');
    
    if (await nameElement.isVisible()) {
      userInfo.name = await nameElement.textContent() || undefined;
    }
    
    if (await emailElement.isVisible()) {
      userInfo.email = await emailElement.textContent() || undefined;
    }
    
    if (await roleElement.isVisible()) {
      userInfo.role = await roleElement.textContent() || undefined;
    }
    
    // Click outside to close dropdown
    await this.page.click('body');
    
    return userInfo;
  }
}