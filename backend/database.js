const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alumni_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promisified version for async/await
const dbPromise = db.promise();

// Database helper functions
const dbHelpers = {
  // Execute a query with parameters
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  },

  // Get a single record
  findOne: async (table, conditions = {}) => {
    const whereClause = Object.keys(conditions).length > 0 
      ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
      : '';
    
    const sql = `SELECT * FROM ${table} ${whereClause} LIMIT 1`;
    const params = Object.values(conditions);
    
    const results = await dbHelpers.query(sql, params);
    return results.length > 0 ? results[0] : null;
  },

  // Get multiple records
  findMany: async (table, conditions = {}, orderBy = '', limit = '') => {
    const whereClause = Object.keys(conditions).length > 0 
      ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
      : '';
    
    const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
    const limitClause = limit ? `LIMIT ${limit}` : '';
    
    const sql = `SELECT * FROM ${table} ${whereClause} ${orderClause} ${limitClause}`;
    const params = Object.values(conditions);
    
    return await dbHelpers.query(sql, params);
  },

  // Insert a record
  insert: async (table, data) => {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    
    return await dbHelpers.query(sql, Object.values(data));
  },

  // Update a record
  update: async (table, data, conditions) => {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(conditions)];
    
    return await dbHelpers.query(sql, params);
  },

  // Delete a record
  delete: async (table, conditions) => {
    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    return await dbHelpers.query(sql, Object.values(conditions));
  },

  // User-specific helpers
  user: {
    findByAuth0Id: async (auth0Id) => {
      return await dbHelpers.findOne('users', { auth0_id: auth0Id });
    },

    createOrUpdate: async (userData) => {
      const existingUser = await dbHelpers.user.findByAuth0Id(userData.auth0_id);
      
      if (existingUser) {
        const updateData = { ...userData, updated_at: new Date() };
        delete updateData.auth0_id; // Don't update the auth0_id
        await dbHelpers.update('users', updateData, { auth0_id: userData.auth0_id });
        return { ...existingUser, ...updateData };
      } else {
        const insertData = { 
          ...userData, 
          created_at: new Date(), 
          updated_at: new Date() 
        };
        const result = await dbHelpers.insert('users', insertData);
        return { id: result.insertId, ...insertData };
      }
    }
  }
};

module.exports = { db, dbPromise, dbHelpers };
