// SkiAvax — Object Pool for entity recycling

export class ObjectPool {
    constructor(factory, initialSize = 20) {
        this.factory = factory;
        this.pool = [];
        this.active = [];

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Get an entity from the pool (or create a new one)
     */
    acquire() {
        let entity;
        if (this.pool.length > 0) {
            entity = this.pool.pop();
        } else {
            entity = this.factory();
        }
        entity.isActive = true;
        this.active.push(entity);
        return entity;
    }

    /**
     * Return an entity to the pool
     */
    release(entity) {
        entity.isActive = false;
        const index = this.active.indexOf(entity);
        if (index !== -1) {
            this.active.splice(index, 1);
        }
        this.pool.push(entity);
    }

    /**
     * Release all active entities back to pool
     */
    releaseAll() {
        while (this.active.length > 0) {
            const entity = this.active.pop();
            entity.isActive = false;
            this.pool.push(entity);
        }
    }

    /**
     * Get all active entities
     */
    getActive() {
        return this.active;
    }

    /**
     * Get count of active entities
     */
    get activeCount() {
        return this.active.length;
    }
}
