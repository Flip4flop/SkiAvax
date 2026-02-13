// SkiAvax — Asset Manager (Image loading + manifest)

export class AssetManager {
    constructor() {
        this.images = {};
        this.manifest = {};
        this.loaded = false;
        this.loadProgress = 0;
    }

    /**
     * Load manifest and all assets
     * @param {string} manifestPath - path to manifest.json
     * @returns {Promise} resolves when all assets are loaded
     */
    async loadManifest(manifestPath) {
        try {
            const response = await fetch(manifestPath);
            this.manifest = await response.json();
        } catch (err) {
            console.warn('AssetManager: Could not load manifest, using placeholders.', err);
            this.manifest = {};
            this.loaded = true;
            return;
        }

        // Filter out non-asset keys (like _comment)
        const entries = Object.entries(this.manifest).filter(([key]) => !key.startsWith('_'));
        if (entries.length === 0) {
            this.loaded = true;
            return;
        }

        let loadedCount = 0;
        const totalCount = entries.length;

        const promises = entries.map(([key, path]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    loadedCount++;
                    this.loadProgress = loadedCount / totalCount;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`AssetManager: Failed to load "${key}" from "${path}"`);
                    loadedCount++;
                    this.loadProgress = loadedCount / totalCount;
                    resolve(); // Don't reject — just skip missing assets
                };
                img.src = path;
            });
        });

        await Promise.all(promises);
        this.loaded = true;
        console.log(`AssetManager: Loaded ${Object.keys(this.images).length}/${totalCount} assets.`);
    }

    /**
     * Get a loaded image by key
     * @returns {HTMLImageElement|null}
     */
    get(key) {
        return this.images[key] || null;
    }

    /**
     * Check if a specific asset exists
     */
    has(key) {
        return key in this.images;
    }
}
