/**
 * Advanced Caching System
 * Redis-like caching with TTL, tags, and intelligent eviction policies
 */

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  evictionPolicy: 'LRU' | 'LFU' | 'TTL' | 'RANDOM';
  compression: boolean;
  encryption: boolean;
  persistence: boolean;
}

export interface CacheItem {
  key: string;
  value: any;
  ttl: number;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
  size: number;
  tags: string[];
  compressed: boolean;
  encrypted: boolean;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  memoryUsage: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  encrypt?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export class AdvancedCachingSystem {
  private cache: Map<string, CacheItem> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private evictionQueue: string[] = [];
  private accessOrder: string[] = [];

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 60 * 60 * 1000, // 1 hour
      evictionPolicy: 'LRU',
      compression: true,
      encryption: false,
      persistence: true,
      ...config
    };

    this.stats = {
      totalItems: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      memoryUsage: 0
    };

    this.initializePersistence();
    this.startCleanupInterval();
  }

  /**
   * Set cache item
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const item: CacheItem = {
      key,
      value: await this.prepareValue(value, options),
      ttl: options.ttl || this.config.defaultTTL,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0,
      size: this.calculateSize(value),
      tags: options.tags || [],
      compressed: options.compress !== false && this.config.compression,
      encrypted: options.encrypt === true && this.config.encryption
    };

    // Remove existing item if it exists
    if (this.cache.has(key)) {
      this.removeFromEvictionQueue(key);
      this.removeFromAccessOrder(key);
    }

    // Check if we need to evict items
    await this.ensureSpace(item.size);

    // Add to cache
    this.cache.set(key, item);
    this.addToEvictionQueue(key);
    this.addToAccessOrder(key);

    // Update stats
    this.updateStats();

    // Persist if enabled
    if (this.config.persistence) {
      await this.persistItem(item);
    }
  }

  /**
   * Get cache item
   */
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.missRate++;
      return null;
    }

    // Check if expired
    if (this.isExpired(item)) {
      await this.delete(key);
      this.stats.missRate++;
      return null;
    }

    // Update access info
    item.accessedAt = Date.now();
    item.accessCount++;
    
    // Update access order
    this.updateAccessOrder(key);
    
    this.stats.hitRate++;
    return await this.restoreValue(item);
  }

  /**
   * Delete cache item
   */
  async delete(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    this.cache.delete(key);
    this.removeFromEvictionQueue(key);
    this.removeFromAccessOrder(key);
    
    this.updateStats();
    
    if (this.config.persistence) {
      await this.removePersistedItem(key);
    }
    
    return true;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (this.isExpired(item)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get multiple items
   */
  async mget(keys: string[]): Promise<Map<string, any>> {
    const result = new Map<string, any>();
    
    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    
    return result;
  }

  /**
   * Set multiple items
   */
  async mset(items: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    for (const item of items) {
      await this.set(item.key, item.value, item.options);
    }
  }

  /**
   * Delete multiple items
   */
  async mdel(keys: string[]): Promise<number> {
    let deleted = 0;
    
    for (const key of keys) {
      if (await this.delete(key)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (item.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    });
    
    return await this.mdel(keysToDelete);
  }

  /**
   * Get keys by pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys());
    
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.evictionQueue = [];
    this.accessOrder = [];
    this.updateStats();
    
    if (this.config.persistence) {
      await this.clearPersistedData();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Prepare value for storage
   */
  private async prepareValue(value: any, options: CacheOptions): Promise<any> {
    let processedValue = value;

    // Compress if enabled
    if (options.compress !== false && this.config.compression) {
      processedValue = await this.compress(processedValue);
    }

    // Encrypt if enabled
    if (options.encrypt === true && this.config.encryption) {
      processedValue = await this.encrypt(processedValue);
    }

    return processedValue;
  }

  /**
   * Restore value from storage
   */
  private async restoreValue(item: CacheItem): Promise<any> {
    let value = item.value;

    // Decrypt if encrypted
    if (item.encrypted) {
      value = await this.decrypt(value);
    }

    // Decompress if compressed
    if (item.compressed) {
      value = await this.decompress(value);
    }

    return value;
  }

  /**
   * Check if item is expired
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.createdAt > item.ttl;
  }

  /**
   * Calculate item size
   */
  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  /**
   * Ensure space for new item
   */
  private async ensureSpace(newItemSize: number): Promise<void> {
    while (this.stats.totalSize + newItemSize > this.config.maxSize) {
      if (this.cache.size === 0) break;
      
      const keyToEvict = this.getKeyToEvict();
      if (keyToEvict) {
        await this.delete(keyToEvict);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }

  /**
   * Get key to evict based on policy
   */
  private getKeyToEvict(): string | null {
    switch (this.config.evictionPolicy) {
      case 'LRU':
        return this.accessOrder[0] || null;
      case 'LFU':
        let leastFrequentKey = null;
        let leastFrequentCount = Infinity;
        
        this.cache.forEach((item, key) => {
          if (item.accessCount < leastFrequentCount) {
            leastFrequentCount = item.accessCount;
            leastFrequentKey = key;
          }
        });
        
        return leastFrequentKey;
      case 'TTL':
        let oldestKey = null;
        let oldestTime = Infinity;
        
        this.cache.forEach((item, key) => {
          if (item.createdAt < oldestTime) {
            oldestTime = item.createdAt;
            oldestKey = key;
          }
        });
        
        return oldestKey;
      case 'RANDOM':
        const keys = Array.from(this.cache.keys());
        return keys[Math.floor(Math.random() * keys.length)];
      default:
        return this.accessOrder[0] || null;
    }
  }

  /**
   * Add to eviction queue
   */
  private addToEvictionQueue(key: string): void {
    this.evictionQueue.push(key);
  }

  /**
   * Remove from eviction queue
   */
  private removeFromEvictionQueue(key: string): void {
    const index = this.evictionQueue.indexOf(key);
    if (index > -1) {
      this.evictionQueue.splice(index, 1);
    }
  }

  /**
   * Add to access order
   */
  private addToAccessOrder(key: string): void {
    this.accessOrder.push(key);
  }

  /**
   * Update access order (move to end)
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.addToAccessOrder(key);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.totalItems = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values()).reduce((total, item) => total + item.size, 0);
    this.stats.memoryUsage = this.stats.totalSize;
    
    const totalRequests = this.stats.hitRate + this.stats.missRate;
    if (totalRequests > 0) {
      this.stats.hitRate = (this.stats.hitRate / totalRequests) * 100;
      this.stats.missRate = (this.stats.missRate / totalRequests) * 100;
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000); // Every minute
  }

  /**
   * Cleanup expired items
   */
  private cleanupExpiredItems(): void {
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    });
    
    this.mdel(expiredKeys);
  }

  /**
   * Compress data
   */
  private async compress(data: any): Promise<string> {
    // Simple compression using JSON stringify
    // In a real implementation, you'd use a compression library
    return JSON.stringify(data);
  }

  /**
   * Decompress data
   */
  private async decompress(data: string): Promise<any> {
    // Simple decompression using JSON parse
    // In a real implementation, you'd use a decompression library
    return JSON.parse(data);
  }

  /**
   * Encrypt data
   */
  private async encrypt(data: any): Promise<string> {
    // Simple base64 encoding for demo
    // In a real implementation, you'd use proper encryption
    return btoa(JSON.stringify(data));
  }

  /**
   * Decrypt data
   */
  private async decrypt(data: string): Promise<any> {
    // Simple base64 decoding for demo
    // In a real implementation, you'd use proper decryption
    return JSON.parse(atob(data));
  }

  /**
   * Initialize persistence
   */
  private initializePersistence(): void {
    if (!this.config.persistence) return;
    
    // Load persisted data
    this.loadPersistedData();
  }

  /**
   * Load persisted data
   */
  private loadPersistedData(): void {
    try {
      const persistedData = localStorage.getItem('advanced_cache');
      if (persistedData) {
        const data = JSON.parse(persistedData);
        this.cache = new Map(data);
        this.updateStats();
      }
    } catch (error) {
      console.error('Error loading persisted cache data:', error);
    }
  }

  /**
   * Persist item
   */
  private async persistItem(item: CacheItem): Promise<void> {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('advanced_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Error persisting cache item:', error);
    }
  }

  /**
   * Remove persisted item
   */
  private async removePersistedItem(key: string): Promise<void> {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('advanced_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Error removing persisted cache item:', error);
    }
  }

  /**
   * Clear persisted data
   */
  private async clearPersistedData(): Promise<void> {
    try {
      localStorage.removeItem('advanced_cache');
    } catch (error) {
      console.error('Error clearing persisted cache data:', error);
    }
  }
}

// Export default instance
export const advancedCache = new AdvancedCachingSystem();
