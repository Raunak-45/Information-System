// Attach to global window object instead of ES6 exports
window.cardUtils = {
    cards: cards, // Your card array
    handleFileUpload: handleFileUpload,
    initCardEvents: initCardEvents
  };

// Card data management
let cards = loadCards() || [
    {
        id: 1,
        title: 'Card 1',
        content: 'Something useful',
        category: 'notes',
        date: new Date().toISOString(),
        pinned: false,
        attachments: []
    },
    {
        id: 2,
        title: 'Card 2',
        content: 'No attachment',
        category: 'assignment',
        date: new Date().toISOString(),
        pinned: false,
        attachments: []
    },
    {
        id: 3,
        title: 'Card 3',
        content: 'Another file here',
        category: 'resource',
        date: new Date().toISOString(),
        pinned: false,
        attachments: []
    }
];

// File attachment handling
function handleFileUpload(files) {
    const attachments = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSize) {
            alert(`File "${files[i].name}" is too large (max 5MB)`);
            continue;
        }
        
        attachments.push({
            name: files[i].name,
            size: files[i].size,
            type: files[i].type,
            lastModified: files[i].lastModified
        });
    }
    
    return attachments;
}

// Initialize card event listeners
function initCardEvents() {
    // File input change handler
    document.getElementById('file-input').addEventListener('change', function(e) {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        Array.from(e.target.files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${file.name} (${(file.size/1024).toFixed(1)}KB)</span>
                <button class="remove-file" data-index="${index}">×</button>
            `;
            fileList.appendChild(fileItem);
        });
    });
    
    // File removal handler
    document.getElementById('file-list').addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-file')) {
            e.preventDefault();
            const index = parseInt(e.target.dataset.index);
            const files = document.getElementById('file-input').files;
            const newFiles = Array.from(files).filter((_, i) => i !== index);
            
            // Create new DataTransfer to update files
            const dataTransfer = new DataTransfer();
            newFiles.forEach(file => dataTransfer.items.add(file));
            document.getElementById('file-input').files = dataTransfer.files;
            
            // Trigger change event to update UI
            const event = new Event('change');
            document.getElementById('file-input').dispatchEvent(event);
        }
    });
}

export { cards, handleFileUpload, initCardEvents };