/**
 * Category Model - Handles hierarchical category management
 */

const BaseModel = require('./BaseModel');

class Category extends BaseModel {
    constructor() {
        super();
        this.tableName = 'categories';
        this.primaryKey = 'id';
    }

    /**
     * Get category hierarchy
     */
    async getCategoryHierarchy(conditions = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM categories';
            const params = [];
            
            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
                query += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }
            
            query += ' ORDER BY order_index ASC, name ASC';
            
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Build hierarchy
                    const hierarchy = this.buildHierarchy(rows || []);
                    resolve(hierarchy);
                }
            });
        });
    }

    /**
     * Build hierarchical structure from flat array
     */
    buildHierarchy(categories, parentId = null) {
        const children = categories.filter(cat => cat.parent_id === parentId);
        return children.map(child => ({
            ...child,
            children: this.buildHierarchy(categories, child.id)
        }));
    }

    /**
     * Get featured categories
     */
    async getFeaturedCategories(limit = 6) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM categories 
                WHERE is_featured = 1 AND is_active = 1 
                ORDER BY order_index ASC, name ASC 
                LIMIT ?
            `;
            
            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Get category children
     */
    async getCategoryChildren(categoryId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM categories 
                WHERE parent_id = ? AND is_active = 1 
                ORDER BY order_index ASC, name ASC
            `;
            
            this.db.all(query, [categoryId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Get category path (breadcrumb)
     */
    async getCategoryPath(categoryId) {
        return new Promise((resolve, reject) => {
            const path = [];
            
            const getParent = (id) => {
                if (!id) {
                    resolve(path.reverse());
                    return;
                }
                
                this.db.get('SELECT * FROM categories WHERE id = ?', [id], (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        path.push(row);
                        getParent(row.parent_id);
                    } else {
                        resolve(path.reverse());
                    }
                });
            };
            
            getParent(categoryId);
        });
    }

    /**
     * Search categories
     */
    async searchCategories(query, limit = 20) {
        return new Promise((resolve, reject) => {
            const searchQuery = `
                SELECT * FROM categories 
                WHERE (name LIKE ? OR description LIKE ?) AND is_active = 1 
                ORDER BY name ASC 
                LIMIT ?
            `;
            const searchTerm = `%${query}%`;
            
            this.db.all(searchQuery, [searchTerm, searchTerm, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Get category with statistics
     */
    async getCategoryWithStats(categoryId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.*, 
                       COUNT(courses.id) as course_count
                FROM categories c
                LEFT JOIN courses ON c.id = courses.category_id
                WHERE c.id = ?
                GROUP BY c.id
            `;
            
            this.db.get(query, [categoryId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get category statistics
     */
    async getCategoryStatistics() {
        return new Promise((resolve, reject) => {
            const queries = {
                total: 'SELECT COUNT(*) as count FROM categories',
                active: 'SELECT COUNT(*) as count FROM categories WHERE is_active = 1',
                featured: 'SELECT COUNT(*) as count FROM categories WHERE is_featured = 1',
                withParent: 'SELECT COUNT(*) as count FROM categories WHERE parent_id IS NOT NULL'
            };
            
            const stats = {};
            const promises = Object.entries(queries).map(([key, query]) => {
                return new Promise((res, rej) => {
                    this.db.get(query, (err, row) => {
                        if (err) rej(err);
                        else {
                            stats[key] = row.count;
                            res();
                        }
                    });
                });
            });
            
            Promise.all(promises)
                .then(() => resolve(stats))
                .catch(reject);
        });
    }

    /**
     * Check if category would create circular reference
     */
    async wouldCreateCircularReference(categoryId, parentId) {
        if (!parentId || categoryId === parentId) return true;
        
        return new Promise((resolve, reject) => {
            const checkParent = (currentParentId) => {
                if (!currentParentId) {
                    resolve(false);
                    return;
                }
                
                if (currentParentId === categoryId) {
                    resolve(true);
                    return;
                }
                
                this.db.get('SELECT parent_id FROM categories WHERE id = ?', [currentParentId], (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        checkParent(row.parent_id);
                    } else {
                        resolve(false);
                    }
                });
            };
            
            checkParent(parentId);
        });
    }

    /**
     * Reorder categories
     */
    async reorderCategories(categories) {
        return new Promise((resolve, reject) => {
            const updatePromises = categories.map(cat => {
                return new Promise((res, rej) => {
                    this.db.run(
                        'UPDATE categories SET order_index = ? WHERE id = ?',
                        [cat.order_index, cat.id],
                        (err) => {
                            if (err) rej(err);
                            else res();
                        }
                    );
                });
            });
            
            Promise.all(updatePromises)
                .then(() => resolve({ success: true }))
                .catch(reject);
        });
    }

    /**
     * Merge categories
     */
    async mergeCategories(sourceId, targetId) {
        return new Promise((resolve, reject) => {
            // Move all courses from source to target category
            this.db.run(
                'UPDATE courses SET category_id = ? WHERE category_id = ?',
                [targetId, sourceId],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Delete source category
                        this.db.run('DELETE FROM categories WHERE id = ?', [sourceId], (deleteErr) => {
                            if (deleteErr) {
                                reject(deleteErr);
                            } else {
                                resolve({ success: true, merged: true });
                            }
                        });
                    }
                }
            );
        });
    }

    /**
     * Get category analytics
     */
    async getCategoryAnalytics(period = '30d') {
        return new Promise((resolve, reject) => {
            // Simple analytics - can be expanded based on requirements
            const query = `
                SELECT 
                    c.id,
                    c.name,
                    COUNT(courses.id) as course_count,
                    c.is_featured,
                    c.is_active
                FROM categories c
                LEFT JOIN courses ON c.id = courses.category_id
                GROUP BY c.id
                ORDER BY course_count DESC
            `;
            
            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        period,
                        categories: rows || [],
                        summary: {
                            total_categories: rows?.length || 0,
                            total_courses: rows?.reduce((sum, cat) => sum + cat.course_count, 0) || 0
                        }
                    });
                }
            });
        });
    }

    /**
     * Get course count for category
     */
    async getCourseCount(categoryId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT COUNT(*) as count FROM courses WHERE category_id = ?',
                [categoryId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row.count);
                    }
                }
            );
        });
    }

    /**
     * Validate category data
     */
    validate(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Category name is required');
        }
        
        if (data.name && data.name.length > 100) {
            errors.push('Category name must be less than 100 characters');
        }
        
        if (data.description && data.description.length > 500) {
            errors.push('Category description must be less than 500 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitize category data
     */
    sanitize(data) {
        const sanitized = { ...data };

        // Trim string values
        if (sanitized.name) sanitized.name = sanitized.name.trim();
        if (sanitized.description) sanitized.description = sanitized.description.trim();
        if (sanitized.icon_url) sanitized.icon_url = sanitized.icon_url.trim();
        if (sanitized.color) sanitized.color = sanitized.color.trim();

        // Convert boolean values
        if (sanitized.is_featured !== undefined) {
            sanitized.is_featured = Boolean(sanitized.is_featured);
        }
        if (sanitized.is_active !== undefined) {
            sanitized.is_active = Boolean(sanitized.is_active);
        }

        // Ensure numeric values
        if (sanitized.order_index !== undefined) {
            sanitized.order_index = parseInt(sanitized.order_index) || 0;
        }

        return sanitized;
    }
}

module.exports = Category;
