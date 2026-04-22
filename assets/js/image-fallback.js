/**
 * Global Image Fallback Handler
 * Checks for broken images and replaces them with a default placeholder.
 */
(function() {
    function handleImageError(event) {
        const img = event.target;
        if (img.tagName.toLowerCase() === 'img') {
            // For flag icons, we might want a specific fallback if the CDN is down
            if (img.classList.contains('flag-icon')) {
                // If it's already a fallback, don't loop
                if (img.src.includes('assets/images/placeholder.png')) return;
                img.src = 'https://flagcdn.com/id.svg'; // Fallback to ID flag if specific one fails? 
                // Or just use a generic flag icon
                return;
            }

            const fallbackSrc = 'assets/images/placeholder.png';
            
            // Prevent infinite loop if fallback also fails
            if (img.src.includes(fallbackSrc)) return;
            
            img.src = fallbackSrc;
            img.classList.add('image-fallback-active');
        }
    }

    // Use capturing phase to catch errors on all images (even dynamic ones)
    window.addEventListener('error', handleImageError, true);

    // Initial check for images that might have failed to load before script execution
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('img').forEach(function(img) {
            if (img.naturalWidth === 0 && img.src) {
                if (img.classList.contains('flag-icon')) {
                    img.src = 'https://flagcdn.com/id.svg';
                } else {
                    img.src = 'assets/images/placeholder.png';
                }
            }
        });
    });
})();
