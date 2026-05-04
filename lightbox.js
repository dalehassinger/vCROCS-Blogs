// vCROCS Blog - Lightbox Image Gallery
// Enables full-screen image viewing with navigation

class Lightbox {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.overlay = null;
        this.initialize();
    }
    
    initialize() {
        // Find all images in article content
        const contentImages = document.querySelectorAll('article .content img');
        
        if (contentImages.length === 0) return;
        
        // Store image data
        contentImages.forEach((img, index) => {
            this.images.push({
                src: img.src,
                alt: img.alt || 'Image ' + (index + 1)
            });
            
            // Make image clickable
            img.addEventListener('click', (e) => {
                e.preventDefault();
                this.open(index);
            });
            
            // Add cursor pointer style
            img.style.cursor = 'zoom-in';
        });
        
        // Create lightbox overlay
        this.createOverlay();
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'lightbox-overlay';
        this.overlay.innerHTML = `
            <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
            <button class="lightbox-nav lightbox-prev" aria-label="Previous image">&#8249;</button>
            <button class="lightbox-nav lightbox-next" aria-label="Next image">&#8250;</button>
            <div class="lightbox-content">
                <img class="lightbox-image" src="" alt="">
            </div>
            <div class="lightbox-caption"></div>
            <div class="lightbox-counter"></div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // Event listeners
        this.overlay.querySelector('.lightbox-close').addEventListener('click', () => this.close());
        this.overlay.querySelector('.lightbox-prev').addEventListener('click', (e) => {
            e.stopPropagation();
            this.prev();
        });
        this.overlay.querySelector('.lightbox-next').addEventListener('click', (e) => {
            e.stopPropagation();
            this.next();
        });
        
        // Click overlay background to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Prevent closing when clicking on image
        this.overlay.querySelector('.lightbox-image').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    open(index) {
        this.currentIndex = index;
        this.updateImage();
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.updateNavButtons();
    }
    
    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.updateImage();
            this.updateNavButtons();
        }
    }
    
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateImage();
            this.updateNavButtons();
        }
    }
    
    updateImage() {
        const image = this.images[this.currentIndex];
        const imgElement = this.overlay.querySelector('.lightbox-image');
        const caption = this.overlay.querySelector('.lightbox-caption');
        const counter = this.overlay.querySelector('.lightbox-counter');
        
        imgElement.src = image.src;
        imgElement.alt = image.alt;
        caption.textContent = image.alt;
        counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    }
    
    updateNavButtons() {
        const prevBtn = this.overlay.querySelector('.lightbox-prev');
        const nextBtn = this.overlay.querySelector('.lightbox-next');
        
        // Hide/show navigation buttons based on position
        prevBtn.style.display = this.currentIndex === 0 ? 'none' : 'flex';
        nextBtn.style.display = this.currentIndex === this.images.length - 1 ? 'none' : 'flex';
    }
    
    handleKeyboard(e) {
        if (!this.overlay.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowRight':
                this.next();
                break;
        }
    }
}

// Initialize lightbox when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Lightbox());
} else {
    new Lightbox();
}

// Blog Search Functionality
class BlogSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.posts = [];
        this.initialize();
    }
    
    initialize() {
        if (!this.searchInput) return;
        
        // Load search index
        this.loadSearchIndex();
        
        // Setup event listeners
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            }
        });
        
        // Optional: Search as you type (with debounce)
        let debounceTimer;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (this.searchInput.value.trim().length >= 2) {
                    this.showSuggestions();
                } else {
                    // Remove suggestions if query is too short
                    const existingSuggestions = document.querySelector('.search-suggestions');
                    if (existingSuggestions) {
                        existingSuggestions.remove();
                    }
                }
            }, 300);
        });
    }
    
    async loadSearchIndex() {
        try {
            const response = await fetch('search-index.json');
            const data = await response.json();
            this.posts = data.posts || [];
            console.log('✅ Loaded ' + this.posts.length + ' posts for search');
            
            // Debug: Show sample of what was loaded
            if (this.posts.length > 0) {
                console.log('📋 Sample post data:');
                const sample = this.posts[0];
                console.log('   Title:', sample.title);
                console.log('   Has content:', !!sample.content);
                console.log('   Content length:', sample.content ? sample.content.length : 0);
                if (sample.content) {
                    console.log('   Content preview:', sample.content.substring(0, 100));
                }
            }
        } catch (error) {
            console.error('Failed to load search index:', error);
            // Fallback: extract from current page if on index
            this.extractFromPage();
        }
    }
    
    extractFromPage() {
        // Fallback: extract post data from the current page
        const postItems = document.querySelectorAll('.post-item');
        this.posts = Array.from(postItems).map(item => {
            const titleEl = item.querySelector('h2 a') || item.querySelector('h3 a');
            const title = titleEl ? titleEl.textContent : '';
            const url = titleEl ? titleEl.getAttribute('href') : '';
            const metaEl = item.querySelector('.post-meta time');
            const date = metaEl ? metaEl.getAttribute('datetime') : '';
            const excerptEl = item.querySelector('.post-excerpt');
            const excerpt = excerptEl ? excerptEl.textContent : '';
            
            return { title: title, url: url, date: date, excerpt: excerpt, content: excerpt, tags: [], categories: [] };
        });
        console.log('ℹ️ Extracted ' + this.posts.length + ' posts from page');
    }
    
    performSearch() {
        const query = this.searchInput.value.trim().toLowerCase();
        if (!query) return;
        
        console.log('🔍 Searching for:', query);
        
        const results = this.search(query);
        console.log('   Found ' + results.length + ' results');
        
        this.displayResults(results, query);
    }
    
    search(query) {
        console.log('🔎 Searching for "' + query + '" in ' + this.posts.length + ' posts');
        
        const results = this.posts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(query);
            const contentMatch = post.content && post.content.toLowerCase().includes(query);
            const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(query);
            const tagsMatch = post.tags && post.tags.some(tag => 
                tag.toLowerCase().includes(query)
            );
            const categoriesMatch = post.categories && post.categories.some(cat => 
                cat.toLowerCase().includes(query)
            );
            
            const matched = titleMatch || contentMatch || excerptMatch || tagsMatch || categoriesMatch;
            
            // Debug logging for matches
            if (matched) {
                console.log('   ✅ Match in "' + post.title + '"');
                console.log('      Title match:', titleMatch);
                console.log('      Content match:', contentMatch);
                console.log('      Excerpt match:', excerptMatch);
                console.log('      Tags match:', tagsMatch);
                console.log('      Categories match:', categoriesMatch);
            }
            
            return matched;
        }).slice(0, 10); // Limit to 10 results
        
        console.log('   Found ' + results.length + ' total results');
        return results;
    }
    
    showSuggestions() {
        const query = this.searchInput.value.trim().toLowerCase();
        if (!query) return;
        
        const results = this.search(query).slice(0, 5);
        
        // Remove existing suggestions
        const existingSuggestions = document.querySelector('.search-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        
        if (results.length === 0) return;
        
        // Create suggestions dropdown
        const suggestions = document.createElement('div');
        suggestions.className = 'search-suggestions';
        suggestions.innerHTML = results.map(post => {
            let titleHTML = this.highlightMatch(post.title, query);
            
            // Generate context snippet from content or excerpt
            let snippetHTML = '';
            if (post.content && post.content.toLowerCase().includes(query)) {
                // Extract context around the match
                const snippet = this.extractContextSnippet(post.content, query, 80);
                snippetHTML = '<span class="excerpt">' + this.highlightMatch(snippet, query) + '</span>';
            } else if (post.excerpt) {
                snippetHTML = '<span class="excerpt">' + post.excerpt.substring(0, 60) + '...</span>';
            }
            
            return '<a href="' + post.url + '" class="search-suggestion-item">' +
                   '<strong>' + titleHTML + '</strong>' +
                   snippetHTML +
                   '</a>';
        }).join('');
        
        this.searchInput.parentElement.appendChild(suggestions);
        
        // Close suggestions when clicking outside
        const closeSuggestions = (e) => {
            if (!suggestions.contains(e.target) && e.target !== this.searchInput) {
                suggestions.remove();
                document.removeEventListener('click', closeSuggestions);
            }
        };
        document.addEventListener('click', closeSuggestions);
    }
    
    extractContextSnippet(text, query, contextLength = 80) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        
        if (index === -1) return text.substring(0, contextLength) + '...';
        
        // Calculate start and end positions for context
        const start = Math.max(0, index - Math.floor(contextLength / 2));
        const end = Math.min(text.length, index + query.length + Math.floor(contextLength / 2));
        
        let snippet = text.substring(start, end);
        
        // Add ellipsis if needed
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        
        return snippet;
    }
    
    highlightMatch(text, query) {
        const regex = new RegExp('(' + this.escapeRegex(query) + ')', 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    displayResults(results, query) {
        if (results.length === 0) {
            alert('No results found for "' + query + '"');
            return;
        }
        
        // Create results page URL with query parameter
        const searchURL = 'search-results.html?q=' + encodeURIComponent(query);
        
        // Store results in sessionStorage for the results page
        sessionStorage.setItem('searchResults', JSON.stringify({
            query: query,
            results: results
        }));
        
        // Navigate to results page
        window.location.href = searchURL;
    }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new BlogSearch();
});