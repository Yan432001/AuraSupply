/**
 * CATEGORY MODEL
 * ==============
 * Handles all database operations for product categories
 */

const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

/**
 * GET ALL CATEGORIES
 * Get all product categories from database
 */
exports.getAll = async () => {
    try {
        const sql = "SELECT * FROM aura_categories ORDER BY name ASC";
        const [rows] = await db.query(sql);
        return rows;
    } catch (err) {
        console.error("Error fetching categories:", err);
        throw err;
    }
};

/**
 * GET CATEGORY BY ID
 * Get a specific category by ID
 */
exports.getById = async (id) => {
    try {
        const sql = "SELECT * FROM aura_categories WHERE id = :id LIMIT 1";
        const [rows] = await db.query(sql, { id });
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.error("Error fetching category:", err);
        throw err;
    }
};

/**
 * CREATE CATEGORY
 * Add a new product category
 */
exports.create = async (data) => {
    try {
        const sql = `
            INSERT INTO aura_categories 
            (name, description, status)
            VALUES (:name, :description, :status)
        `;
        const [result] = await db.query(sql, {
            name: data.name,
            description: data.description || null,
            status: data.status ?? 1
        });
        return result;
    } catch (err) {
        console.error("Error creating category:", err);
        throw err;
    }
};

/**
 * UPDATE CATEGORY
 * Update an existing category
 */
exports.update = async (data) => {
    try {
        const sql = `
            UPDATE aura_categories 
            SET name = :name, 
                description = :description,
                status = :status
            WHERE id = :id
        `;
        const [result] = await db.query(sql, {
            id: data.id,
            name: data.name,
            description: data.description || null,
            status: data.status ?? 1
        });
        return result;
    } catch (err) {
        console.error("Error updating category:", err);
        throw err;
    }
};

/**
 * DELETE CATEGORY
 * Delete a category
 */
exports.delete = async (id) => {
    try {
        const sql = "DELETE FROM aura_categories WHERE id = :id";
        const [result] = await db.query(sql, { id });
        return result;
    } catch (err) {
        console.error("Error deleting category:", err);
        throw err;
    }
};

module.exports = exports;
