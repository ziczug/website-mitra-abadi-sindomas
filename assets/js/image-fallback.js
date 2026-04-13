/**
 * Global Image Fallback Handler
 * Checks for broken images and replaces them with a default placeholder.
 */
(function() {
    function handleImageError(event) {
        const img = event.target;
        if (img.tagName.toLowerCase() === 'img') {
            // Exclude flag icons from general fallback
            if (img.classList.contains('flag-icon')) {
                img.style.display = 'none'; // Just hide the broken flag
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
                    img.style.display = 'none';
                } else {
                    img.src = 'assets/images/placeholder.png';
                }
            }
        });
    });
})();
