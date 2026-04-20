const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PRODUCTS_PATH = path.join(ROOT, 'database', 'cms', 'products.json');

function toSlug(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));

console.log('Starting image rename process...');

products.forEach(p => {
  const brandName = p.brand;
  const originalName = p.name.replace(new RegExp(`^${brandName} - `, 'i'), ''); // Handle if already partially renamed
  const newName = `${brandName} - ${originalName}`;
  const brandSlug = toSlug(brandName);
  
  // Calculate potential new filename
  const newFilename = toSlug(newName) + '.png';
  const newPath = `assets/images/products/${brandSlug}/${newFilename}`;

  const currentPath = p.image;
  if (currentPath && fs.existsSync(path.join(ROOT, currentPath))) {
    const fullCurrentPath = path.join(ROOT, currentPath);
    const fullNewPath = path.join(ROOT, newPath);

    if (fullCurrentPath !== fullNewPath) {
      // Create brand directory if missing
      const newDir = path.dirname(fullNewPath);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }

      try {
        fs.renameSync(fullCurrentPath, fullNewPath);
        console.log(`Renamed: ${currentPath} -> ${newPath}`);
        p.image = newPath;
      } catch (err) {
        console.error(`Error renaming ${currentPath}:`, err.message);
      }
    }
  } else {
    // If current image doesn't exist, check for Jacker Chips default logic
    if (brandName.toLowerCase() === 'jacker' && originalName.toLowerCase().includes('potato chips') && originalName.toLowerCase().includes('60g')) {
        let fallback = '';
        if (originalName.toLowerCase().includes('hot & spicy')) {
            fallback = `assets/images/products/${brandSlug}/hot-spicy-flavor-potato-crisps60gr.png`;
        } else if (originalName.toLowerCase().includes('barbecue')) {
            fallback = `assets/images/products/${brandSlug}/barbecue-flavor-potato-crisps60gr.png`;
        }
        
        if (fallback && fs.existsSync(path.join(ROOT, fallback))) {
            console.log(`Using fallback for ${newName}: ${fallback}`);
            // Note: We might want to COPY it to new name or just point to it. 
            // User said "gunakan default", and "rename file gambar... dan terkoneksi otomatis".
            // I'll copy it to the new name so it's consistent.
            try {
                fs.copyFileSync(path.join(ROOT, fallback), path.join(ROOT, newPath));
                p.image = newPath;
                console.log(`Copied fallback to: ${newPath}`);
            } catch (err) {
                console.error(`Error copying fallback for ${newName}:`, err.message);
            }
        }
    }
  }
  
  // Update name
  p.name = newName;
});

// Save updated products.json temporarily to see results
fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf8');
console.log('Migration complete. Products name and image paths updated in products.json.');
