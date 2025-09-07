import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage
{
    readonly Leftbar: Locator; 
    readonly logoutOptn: Locator;
    constructor(page:Page)
    {
        super(page)
        this.Leftbar = page.getByRole('button', { name: 'Open Menu' });
        this.logoutOptn = page.locator('[data-test="logout-sidebar-link"]')
        
    }

    async logout()
    {
        await this.Leftbar.click();
        await this.logoutOptn.click();
        
    }
}