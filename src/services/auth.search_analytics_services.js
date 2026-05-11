import pool from '../config/db.js'

export const getArchivalInventory = async (filters) => {
    const { searchTerm, medium_ids, dateFrom, dateTo, limit = 20, offset = 0 } = filters;

    let query = `
        SELECT i.*, f.name as folder_name, b.name as box_name 
        FROM items i
        LEFT JOIN folders f ON i.folder_id = f.id
        LEFT JOIN boxes b ON f.box_id = b.id
        WHERE i.is_active = true
    `;

    const params = [];
    let count = 1;

    if (searchTerm) {
        query += ` AND (i.title ILIKE $${count} OR i.description ILIKE $${count})`;
        params.push(`%${searchTerm}%`);
        count++;
    }

    if (medium_ids && medium_ids.length > 0) {
        query += ` AND i.medium_id = ANY($${count}::int[])`;
        params.push(medium_ids);
        count++;
    }

    if (dateFrom) {
        query += ` AND i.created_at >= $${count}`;
        params.push(dateFrom);
        count++;
    }
    if (dateTo) {
        query += ` AND i.created_at <= $${count}`;
        params.push(dateTo);
        count++;
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${count} OFFSET $${count + 1}`;
    params.push(limit, offset);

    try {
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error("Database Error in getArchivalInventory:", error);
        throw error;
    }
};

export const getItemById = async (id) => {
    const query = `SELECT file_name, file_path, file_type FROM items WHERE id = $1 AND is_active = true`;
    try {
        const result = await pool.query(query, [id]);
        return result.rows[0]; // Returns the item object or undefined
    } catch (error) {
        console.error("Error fetching item for download:", error);
        throw error;
    }
};

export const getItemFileDetails = async (id) => {
    const query = `
        SELECT file_path, file_type, file_name 
        FROM items 
        WHERE id = $1 AND is_active = true
    `;
    try {
        const result = await pool.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        console.error("Service Error (getItemFileDetails):", error);
        throw error;
    }
};

export const getSingleItemFullDetails = async (id) => {
    const query = `
        SELECT i.*, f.name as folder_name, b.name as box_name 
        FROM items i
        LEFT JOIN folders f ON i.folder_id = f.id
        LEFT JOIN boxes b ON f.box_id = b.id
        WHERE i.id = $1 AND i.is_active = true
    `;
    try {
        const result = await pool.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};