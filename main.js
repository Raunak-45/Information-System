import { cards, handleFileUpload, initCardEvents } from './cards.js';
import { initSearch, performSearch, buildSearchIndex } from './search.js';
import { saveCards, loadCards } from './storage.js';

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const addCardBtn = document.getElementById('add-card-btn');
const exportAllBtn = document.getElementById('export-all-btn');
const cardModal = document.getElementById('card-modal');
const helpModal = document.getElementById('help-modal');
const closeModals = document.querySelectorAll('.close-modal');
const cardForm = document.getElementById('card-form');
const cardsContainer = document.getElementById('cards-container');
const cardTemplate = document.getElementById('card-template');
const helpBtn = document.getElementById('help-btn');
const keyboardShortcutsBtn = document.getElementById('keyboard-shortcuts');

// Theme Management
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Modal Management
function openModal(modalId, cardId = null) {
    const modal = document.getElementById(modalId);
    
    if (modalId === 'card-modal' && cardId) {
        // Edit mode for card modal
        const card = cards.find(c => c.id === cardId);
        if (card) {
            document.getElementById('modal-title').textContent = 'Edit Card';
            document.getElementById('card-title-input').value = card.title;
            document.getElementById('card-content-input').value = card.content;
            document.getElementById('card-category').value = card.category;
            
            // Store current card ID in form
            cardForm.dataset.editingId = cardId;
        }
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModalFunc() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Card Operations
function renderCards() {
    cardsContainer.innerHTML = '';
    
    // Sort cards: pinned first, then by date (newest first)
    const sortedCards = [...cards].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
    });
    
    if (sortedCards.length === 0) {
        cardsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-inbox"></i>
                <p>No cards found. Create your first card!</p>
            </div>
        `;
        return;
    }
    
    sortedCards.forEach(card => {
        const cardClone = cardTemplate.content.cloneNode(true);
        const cardEl = cardClone.querySelector('.info-card');
        
        cardEl.setAttribute('data-id', card.id);
        if (card.pinned) cardEl.classList.add('pinned');
        
        cardClone.querySelector('.card-title').textContent = card.title;
        
        // Highlight search terms if they exist
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        if (searchTerm) {
            const highlightedContent = highlightMatches(card.content, searchTerm);
            cardClone.querySelector('.card-text').innerHTML = highlightedContent;
        } else {
            cardClone.querySelector('.card-text').textContent = card.content;
        }
        
        cardClone.querySelector('.card-category').textContent = card.category;
        cardClone.querySelector('.card-date').textContent = formatDate(card.date);
        
        // Add attachments if they exist
        const attachmentsContainer = cardClone.querySelector('.attachments-container');
        if (card.attachments && card.attachments.length > 0) {
            card.attachments.forEach(attachment => {
                const attachmentEl = document.createElement('div');
                attachmentEl.className = 'attachment';
                attachmentEl.innerHTML = `
                    <i class="fas fa-paperclip"></i>
                    ${attachment.name} (${(attachment.size/1024).toFixed(1)}KB)
                `;
                attachmentsContainer.appendChild(attachmentEl);
            });
        }
        
        // Add event listeners
        cardClone.querySelector('.edit-btn').addEventListener('click', () => openModal('card-modal', card.id));
        cardClone.querySelector('.delete-btn').addEventListener('click', () => deleteCard(card.id));
        cardClone.querySelector('.pin-btn').addEventListener('click', () => togglePinCard(card.id));
        
        cardsContainer.appendChild(cardClone);
    });
    
    updateCardCount();
}

function highlightMatches(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function addCard(newCard) {
    cards.push(newCard);
    saveCards(cards);
    buildSearchIndex();
    renderCards();
}

function updateCard(cardId, updatedData) {
    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
        cards[cardIndex] = { ...cards[cardIndex], ...updatedData };
        saveCards(cards);
        buildSearchIndex();
        renderCards();
    }
}

function deleteCard(cardId) {
    if (confirm('Are you sure you want to delete this card?')) {
        const index = cards.findIndex(c => c.id === cardId);
        if (index !== -1) {
            cards.splice(index, 1);
            saveCards(cards);
            buildSearchIndex();
            renderCards();
        }
    }
}

function togglePinCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (card) {
        card.pinned = !card.pinned;
        saveCards(cards);
        renderCards();
    }
}

function updateCardCount() {
    const searchTerm = document.getElementById('search-input').value;
    const totalCards = cards.length;
    const displayedCards = document.querySelectorAll('.info-card').length;
    
    if (searchTerm) {
        document.getElementById('card-count').textContent = 
            `${displayedCards} of ${totalCards} cards match`;
    } else {
        document.getElementById('card-count').textContent = 
            `${totalCards} card${totalCards !== 1 ? 's' : ''}`;
    }
}

// Form Submission
cardForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('card-title-input').value;
    const content = document.getElementById('card-content-input').value;
    const category = document.getElementById('card-category').value;
    const files = document.getElementById('file-input').files;
    
    const attachments = files.length > 0 ? handleFileUpload(files) : [];
    
    const cardData = {
        title,
        content,
        category,
        date: new Date().toISOString(),
        pinned: false,
        attachments
    };
    
    if (this.dataset.editingId) {
        // Update existing card
        updateCard(parseInt(this.dataset.editingId), cardData);
    } else {
        // Add new card
        cardData.id = Date.now();
        addCard(cardData);
    }
    
    closeModalFunc();
});

// Export Functionality
function exportAllCards() {
    const data = JSON.stringify(cards, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-viii-cards-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+N for new card
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openModal('card-modal');
        }
        
        // Ctrl+F to focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('search-input').focus();
        }
        
        // Esc to close modal
        if (e.key === 'Escape') {
            closeModalFunc();
        }
    });
}

// Initialize the application
function init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    updateThemeIcon();
    
    // Set up event listeners
    themeToggle.addEventListener('click', toggleTheme);
    addCardBtn.addEventListener('click', () => openModal('card-modal'));
    exportAllBtn.addEventListener('click', exportAllCards);
    helpBtn.addEventListener('click', () => openModal('help-modal'));
    keyboardShortcutsBtn.addEventListener('click', () => openModal('help-modal'));
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', closeModalFunc);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModalFunc();
        }
    });
    
    // Initialize modules
    initSearch();
    initCardEvents();
    setupKeyboardShortcuts();
    
    // Initial render
    renderCards();
}

document.addEventListener('DOMContentLoaded', init);

import { handleFileUpload, initCardEvents } from './cards.js';
import { initSearch } from './search.js';
import { getCards, addCardToFirestore, updateCardInFirestore, deleteCardFromFirestore, togglePinInFirestore } from './storage.js';

// Theme and Modal logic (unchanged)
// ... keep your existing toggleTheme(), updateThemeIcon(), openModal(), closeModalFunc() here

function renderCards(cards) {
    cardsContainer.innerHTML = '';

    if (cards.length === 0) {
        cardsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-inbox"></i>
                <p>No cards found. Create your first card!</p>
            </div>
        `;
        return;
    }

    cards.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
    });

    cards.forEach(card => {
        const clone = cardTemplate.content.cloneNode(true);
        const cardEl = clone.querySelector('.info-card');

        cardEl.setAttribute('data-id', card.id);
        if (card.pinned) cardEl.classList.add('pinned');
        clone.querySelector('.card-title').textContent = card.title;
        clone.querySelector('.card-text').textContent = card.content;
        clone.querySelector('.card-category').textContent = card.category;
        clone.querySelector('.card-date').textContent = new Date(card.date).toLocaleDateString();

        clone.querySelector('.edit-btn').addEventListener('click', () => openModal('card-modal', card.id));
        clone.querySelector('.delete-btn').addEventListener('click', async () => {
            if (confirm('Delete this card?')) {
                await deleteCardFromFirestore(card.id);
                loadAndRenderCards();
            }
        });
        clone.querySelector('.pin-btn').addEventListener('click', async () => {
            await togglePinInFirestore(card.id, !card.pinned);
            loadAndRenderCards();
        });

        cardsContainer.appendChild(clone);
    });
}

async function loadAndRenderCards() {
    const cards = await getCards();
    renderCards(cards);
}

// Handle Form Submit
cardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('card-title-input').value;
    const content = document.getElementById('card-content-input').value;
    const category = document.getElementById('card-category').value;
    const files = document.getElementById('file-input').files;

    const attachments = files.length > 0 ? handleFileUpload(files) : [];

    const cardData = {
        title,
        content,
        category,
        date: new Date().toISOString(),
        pinned: false,
        attachments
    };

    const editingId = cardForm.dataset.editingId;
    if (editingId) {
        await updateCardInFirestore(editingId, cardData);
        delete cardForm.dataset.editingId;
    } else {
        await addCardToFirestore(cardData);
    }

    closeModalFunc();
    loadAndRenderCards();
});

function init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.body.classList.add('dark-theme');
    updateThemeIcon();

    themeToggle.addEventListener('click', toggleTheme);
    addCardBtn.addEventListener('click', () => openModal('card-modal'));
    exportAllBtn.addEventListener('click', async () => {
        const cards = await getCards();
        const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cards-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    closeModals.forEach(btn => btn.addEventListener('click', closeModalFunc));
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) closeModalFunc();
    });

    initSearch();
    initCardEvents();
    loadAndRenderCards();
}

document.addEventListener('DOMContentLoaded', init);
