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
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>` // Moon
        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`; // Sun
};

/**
 * Initializes the theme switcher functionality.
 */
export const initTheme = () => {
    themeSwitcherBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('light') ? 'dark' : 'light';
        console.log(`[INFO] Theme toggled to: ${newTheme}`);
        applyTheme(newTheme);
        if (App.currentUser && App.currentUser.id) {
            try {
                App.updateProfile(App.currentUser.id, { theme: newTheme }, false);
            } catch (error) {
                console.error('[ERROR] Failed to save theme preference:', error);
            }
        }
    });

    // Set default theme on initial load
    applyTheme('dark');
};