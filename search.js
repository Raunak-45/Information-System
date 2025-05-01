import { cards } from './cards.js';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search');
const filterCategory = document.getElementById('filter-category');
const searchTimeEl = document.getElementById('search-time');

// Search index for faster searching
let searchIndex = [];

// Initialize search functionality
export function initSearch() {
    // Build initial search index
    buildSearchIndex();
    
    // Set up event listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('input', debounce(performSearch, 300));
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    filterCategory.addEventListener('change', performSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Perform initial search
    performSearch();
}

// Build search index for better performance
export function buildSearchIndex() {
    const startTime = performance.now();
    
    searchIndex = cards.map(card => ({
        id: card.id,
        searchText: `${card.title} ${card.content} ${card.category} ${
            card.attachments.map(a => a.name).join(' ')
        }`.toLowerCase(),
        card: card
    }));
    
    const endTime = performance.now();
    console.log(`Search index built in ${(endTime - startTime).toFixed(2)}ms`);
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Main search function
export function performSearch() {
    const startTime = performance.now();
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilter = filterCategory.value;
    
    // Show clear button if there's a search term
    clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
    
    // Filter cards based on search criteria
    const filteredCards = searchIndex.filter(item => {
        const matchesSearch = searchTerm === '' || 
                            fuzzyMatch(item.searchText, searchTerm);
        const matchesCategory = categoryFilter === 'all' || 
                              item.card.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }).map(item => item.card);
    
    // Display results
    displaySearchResults(filteredCards);
    
    // Update search stats
    const endTime = performance.now();
    searchTimeEl.textContent = `Search took ${(endTime - startTime).toFixed(2)}ms`;
}

// Fuzzy search implementation
function fuzzyMatch(text, term) {
    let searchPos = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === term[searchPos]) {
            searchPos++;
            if (searchPos === term.length) return true;
        }
    }
    return false;
}

// Clear search results
function clearSearch() {
    searchInput.value = '';
    filterCategory.value = 'all';
    performSearch();
    searchInput.focus();
}

// Display search results
function displaySearchResults(filteredCards) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '';
    
    if (filteredCards.length === 0) {
        const searchTerm = searchInput.value;
        cardsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No cards found matching "${searchTerm}"</p>
                ${searchTerm ? '<button id="clear-search-large" class="btn">Clear search</button>' : ''}
            </div>
        `;
        
        if (searchTerm) {
            document.getElementById('clear-search-large').addEventListener('click', clearSearch);
        }
    } else {
        filteredCards.forEach(card => {
            const cardTemplate = document.getElementById('card-template');
            const cardClone = cardTemplate.content.cloneNode(true);
            const cardEl = cardClone.querySelector('.info-card');
            
            cardEl.setAttribute('data-id', card.id);
            if (card.pinned) cardEl.classList.add('pinned');
            
            cardClone.querySelector('.card-title').textContent = card.title;
            
            // Highlight search terms
            const searchTerm = searchInput.value.toLowerCase();
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
                        ${attachment.name}
                    `;
                    attachmentsContainer.appendChild(attachmentEl);
                });
            }
            
            cardsContainer.appendChild(cardClone);
        });
    }
    
    updateCardCount();
}

// Helper function to highlight matches
function highlightMatches(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to update card count
function updateCardCount() {
    const cardCountEl = document.getElementById('card-count');
    const searchTerm = searchInput.value;
    const filteredCount = document.querySelectorAll('.info-card').length;
    const totalCount = cards.length;
    
    if (searchTerm) {
        cardCountEl.textContent = `${filteredCount} of ${totalCount} cards match`;
    } else {
        cardCountEl.textContent = `${totalCount} card${totalCount !== 1 ? 's' : ''}`;
    }
}