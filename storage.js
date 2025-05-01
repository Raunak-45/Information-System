// LocalStorage management for cards
const STORAGE_KEY = 'classVIII_cards';

export function saveCards(cards) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
        return true;
    } catch (e) {
        console.error('Failed to save cards:', e);
        alert('Failed to save cards to storage. Data might be too large.');
        return false;
    }
}

export function loadCards() {
    try {
        const cards = localStorage.getItem(STORAGE_KEY);
        return cards ? JSON.parse(cards) : null;
    } catch (e) {
        console.error('Failed to load cards:', e);
        return null;
    }
}

export function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

// Export for testing
if (typeof window !== 'undefined') {
    window.__storage = { saveCards, loadCards, clearStorage };
}