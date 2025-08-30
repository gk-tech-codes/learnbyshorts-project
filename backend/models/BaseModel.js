/**
 * BaseModel - Abstract base class for all models
 * Provides common database operations and validation
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class BaseModel {
    constructor() {
        this.db = null;
        this.tableName = '';
        this.primaryKey = 'id';
        this.timestamps = true;
        this.initDatabase();
    }

    /**
     * Initialize database connection
     */
    initDatabase() {
        const dbPath = path.join(__dirname, '../database/learnbyshorts.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Database connection error:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    /**
     * Create tables - to be overridden by child classes
     */
    createTables() {
        // Override in child classes
    }

    /**
     * Execute SQL query with parameters
     */
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Execute SQL query and return single row
     */
    queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Execute SQL query without return
     */
    execute(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Find all records
     */
    async findAll(conditions = {}, orderBy = null, limit = null) {
        let sql = `SELECT * FROM ${this.tableName}`;
        const params = [];

        // Add WHERE conditions
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }

        // Add ORDER BY
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }

        // Add LIMIT
        if (limit) {
            sql += ` LIMIT ${limit}`;
        }

        return await this.query(sql, params);
    }

    /**
     * Find record by ID
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        return await this.queryOne(sql, [id]);
    }

    /**
     * Find single record by conditions
     */
    async findOne(conditions = {}) {
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');
        const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
        return await this.queryOne(sql, Object.values(conditions));
    }

    /**
     * Create new record
     */
    async create(data) {
        // Add timestamps if enabled
        if (this.timestamps) {
            data.created_at = new Date().toISOString();
            data.updated_at = new Date().toISOString();
        }

        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
        
        const result = await this.execute(sql, Object.values(data));
        return await this.findById(result.id);
    }

    /**
     * Update record by ID
     */
    async update(id, data) {
        // Add updated timestamp if enabled
        if (this.timestamps) {
            data.updated_at = new Date().toISOString();
        }

        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
        
        await this.execute(sql, [...Object.values(data), id]);
        return await this.findById(id);
    }

    /**
     * Delete record by ID
     */
    async delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        const result = await this.execute(sql, [id]);
        return result.changes > 0;
    }

    /**
     * Count records
     */
    async count(conditions = {}) {
        let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const params = [];

        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }

        const result = await this.queryOne(sql, params);
        return result.count;
    }

    /**
     * Validate data - to be overridden by child classes
     */
    validate(data) {
        return { isValid: true, errors: [] };
    }

    /**
     * Sanitize data - to be overridden by child classes
     */
    sanitize(data) {
        return data;
    }

    /**
     * Initialize database with schema
     */
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            const initSqlPath = path.join(__dirname, '../database/init.sql');
            
            // Check if init.sql exists
            if (!fs.existsSync(initSqlPath)) {
                console.log('init.sql not found, creating basic tables...');
                this.createTables();
                return resolve();
            }

            // Read and execute init.sql
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            
            this.db.exec(initSql, (err) => {
                if (err) {
                    console.error('Database initialization error:', err.message);
                    reject(err);
                } else {
                    console.log('Database initialized successfully');
                    resolve();
                }
            });
        });
    }

    /**
     * Close database connection gracefully
     */
    async closeDatabase() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = BaseModel;
