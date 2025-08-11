import { themeSwitcherBtn } from './elements.js';
import { App } from './main.js';

/**
 * Applies the selected theme (light or dark) to the application.
 * @param {string} theme - The theme to apply ('light' or 'dark').
 */
export const applyTheme = (theme) => {
    console.log(`[INFO] Applying theme: ${theme}`);
    const html = document.documentElement;
    if (theme === 'light') {
        html.classList.add('light');
    } else {
        html.classList.remove('light');
    }
    // Update switcher icon
    themeSwitcherBtn.innerHTML = theme === 'light'
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003