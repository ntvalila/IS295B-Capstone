import bcrypt from 'bcrypt'
import pool from '../config/db.js'

//COLLECTION MANAGEMENT

export const fetchAllCollections = async () => {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.location,
        CASE 
          WHEN c.restriction_id = 1 THEN 'Public'
          WHEN c.restriction_id = 2 THEN 'Confidential'
          ELSE 'Restricted'
        END AS security_level,
        TO_CHAR(c.created_at, 'YYYY-MM-DD') AS date_created,
        TO_CHAR(c.updated_at, 'YYYY-MM-DD') AS date_updated,
        COALESCE(
          (SELECT json_agg(box_data)
           FROM (
             SELECT 
               b.id,
               b.name AS box_name, 
               b.description AS box_description,
               b.box_number AS box_number,
               b.physical_order AS box_physical_order,
               b.restriction_id AS box_restriction_id,
               CASE 
                    WHEN b.restriction_id = 1 THEN 'Public'
                    WHEN b.restriction_id = 2 THEN 'Confidential'
                    ELSE 'Restricted'
                    END AS box_security_level,
                    -- SUBQUERY: FOLDERS (and items inside them)
               COALESCE(
                 (SELECT json_agg(folder_data)
                  FROM (
                    SELECT 
                      f.id,
                      f.name AS folder_name, 
                      f.description AS folder_description,
                      f.physical_order AS folder_physical_order,
                      f.restriction_id AS folder_restriction_id,
                    COALESCE(
                      (SELECT json_agg(item_data)
                       FROM (
                         SELECT 
                            i.id as item_id, 
                            i.title as item_title, 
                            i.creator as item_creator, 
                            i.description as item_description, 
                            i.physical_order as item_physical_order, 
                            i.document_date as item_document_date,
                            i.file_name as item_file_name,
                            i.extent as item_extent,
                            i.medium_id as item_medium_id
                        FROM items i
                        WHERE i.folder_id = f.id  -- CRITICAL FIX: Link items to folder
                        AND i.is_active = true
                        ORDER BY i.physical_order ASC
                    ) item_data
                ), '[]') AS items
            FROM folders f 
            WHERE f.box_id = b.id AND f.is_active = true
            ORDER BY f.physical_order ASC
        ) folder_data
        ), '[]') AS folders,
        -- SUBQUERY: ITEMS (Outside of any folder, but inside the box)
        COALESCE(
            (SELECT json_agg(item_data)
                FROM (
                    SELECT 
                        i.id as item_id, 
                        i.title as item_title, 
                        i.file_name as item_file_name,
                        i.description as item_description,
                        i.physical_order as item_physical_order
                    FROM items i
                    WHERE i.box_id = b.id 
                    AND i.folder_id IS NULL  -- Only items NOT in a folder
                    AND i.is_active = true
                    ORDER BY i.physical_order ASC
                 ) item_data
            ), '[]') AS items
        FROM boxes b 
        WHERE b.collection_id = c.id AND b.is_active = true 
        ORDER BY b.physical_order ASC, b.name ASC 
      ) box_data
    ), '[]') AS boxes
    FROM collections c
    WHERE c.is_active = true
    ORDER BY c.id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

export const createCollection = async (name, location, description, restriction_id, createdBy) => {
    return await pool.query(
        `INSERT INTO collections (name, location, description, restriction_id, created_by) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [name, location, description, restriction_id, createdBy]
    );
}

export const modifyCollection = async (id, name, location, description, restrictionId) => {
    const query = `
        UPDATE collections 
        SET name = $1, 
            location = $2, 
            description = $3, 
            restriction_id = $4, 
            updated_at = NOW() 
        WHERE id = $5
    `;

    return await pool.query(query, [name, location, description, restrictionId, id]);
};

export const removeCollection = async (id) => {
    return await pool.query("UPDATE collections SET is_active=False WHERE id = $1", [id]);
};

export const createBox = async (collectionId, name, number, physical_order, description, restriction_id, createdBy) => {
    return await pool.query(
        `INSERT INTO boxes (
            collection_id, 
            box_number, 
            name, 
            physical_order, 
            description, 
            restriction_id, 
            created_by
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id`,
        [collectionId, number, name, physical_order, description, restriction_id, createdBy]
    );
};

// Function to update a box
export const modifyBox = async (boxId, name, boxNumber, displayOrder, restriction_id, description) => {
    const query = `
        UPDATE boxes 
        SET 
            name = $1, 
            description = $2, 
            box_number = $3, 
            physical_order = $4, 
            restriction_id = $5,
            updated_at = NOW() 
        WHERE id = $6
        RETURNING *;
    `;

    const values = [name, description, boxNumber, displayOrder, restriction_id, boxId];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0]; 
    } catch (error) {
        console.error("Database Error updating box:", error);
        throw error;
    }
};

// Function to delete a box
export const removeBox = async (boxId) => {
    const query = `UPDATE boxes set is_active=False WHERE id = $1`;
    try {
        const result = await pool.query(query, [boxId]);
        return result.rowCount;
    } catch (error) {
        console.error("Database Error deleting box:", error);
        throw error;
    }
};


export const createFolder = async (name, physical_order, restriction_id, description, box_id, createdBy) => {
    return await pool.query(
        `INSERT INTO folders ( 
            name,
            physical_order,
            restriction_id,
            description,
            box_id,
            created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;`,
        [name, physical_order, restriction_id, description, box_id, createdBy]
    );
};

export const removeFolder = async (folderId) => {
    const query = `UPDATE folders set is_active=False WHERE id = $1`;
    try {
        const result = await pool.query(query, [folderId]);
        return result.rowCount;
    } catch (error) {
        console.error("Database Error deleting folder:", error);
        throw error;
    }
};

export const uploadItem = async (data) => {
  if (!data.folder_id) {
    const query = `
      INSERT INTO items (
          title, 
          creator, 
          physical_order,
          extent,
          description, 
          medium_id, 
          document_date, 
          restriction_id, 
          file_path, 
          file_name, 
          file_type, 
          file_size,
          box_id, 
          created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    const params = [
      data.title,
      data.creator,
      data.physical_order,
      data.extent,
      data.description,
      data.medium_id,
      data.document_date,
      data.restriction_id,
      data.file_path,
      data.file_name,
      data.file_type,
      data.file_size,
      data.box_id,
      data.created_by
    ];
    return await pool.query(query, params);
  } else {
    const query = `
      INSERT INTO items (
          title, 
          creator, 
          extent,
          description, 
          medium_id, 
          physical_order, 
          document_date,
          restriction_id,
          box_id, 
          folder_id,
          file_path, 
          file_name, 
          file_type, 
          file_size, 
          created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;
    const params = [
      data.title, data.creator, data.extent, data.description,
      data.medium_id, data.physical_order, data.document_date, data.restriction_id, data.box_id, data.folder_id,
      data.file_path, data.file_name, data.file_type, data.file_size, data.created_by
    ];
    return await pool.query(query, params);
  }
};

export const getItemDetails = async (id) => {
    const result = await pool.query('SELECT * from items where id = $1', [id])
    return result
}

export const modifyItem = async (id, title, creator, extent, medium_id, document_date, restriction_id, description, fileName = null) => {
    let query;
    let params;

    if (fileName) {
        // Query if a new file is being uploaded
        query = `
            UPDATE items 
            SET title=$1, creator=$2, extent=$3, medium_id=$4, document_date=$5, restriction_id=$6, description=$7, file_name=$8 
            WHERE id=$9 
            RETURNING *`;
        params = [title, creator, extent, medium_id, document_date, restriction_id, description, fileName, id];
    } else {
        // Query if no new file is uploaded (keep existing file_name)
        query = `
            UPDATE items 
            SET title=$1, creator=$2, extent=$3, medium_id=$4, document_date=$5, restriction_id=$6, description=$7 
            WHERE id=$8 
            RETURNING *`;
        params = [title, creator, extent, medium_id, document_date, restriction_id, description, id];
    }

    const result = await pool.query(query, params);
    return result.rows[0];
};

export const removeItem = async (item_id) => {
    const query = `Update items SET is_active=False WHERE id = $1`;
    try {
        const result = await pool.query(query, [item_id]);
        return result.rowCount;
    } catch (error) {
        console.error("Database Error deleting box:", error);
        throw error;
    }
};