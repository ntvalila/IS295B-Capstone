import bcrypt from 'bcrypt'
import pool from '../config/db.js'

export const findUserByEmail = async(email) => {
    const result = await pool.query(
        'SELECT * from users where email = $1',
        [email]
    )
    return result.rows[0]
}

export const findUserByUsername = async(username) => {
    const result = await pool.query(
        'SELECT * from users where username = $1',
        [username]
    )
    return result.rows[0]
}

export const createUser = async (username, first_name, last_name, email, user_type, id_number, password) => {
    const hashedpw = await bcrypt.hash(password, 10)

    await pool.query(
        'INSERT into users (username, first_name, last_name, email, user_type, id_number, password) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [username, first_name, last_name, email, user_type, id_number, hashedpw]
    )
}

export const findUserById = async(id) => {
    const result = await pool.query('SELECT * from users where id = $1', [id])
    return result.rows[0]
}

export const findUserByIdNumber = async(id_number) => {
    'SELECT * from users where id_number = $1',
    [id_number]
}

export const fetchAllUsers = async () => {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
}

export const updateTypeStatus = async (userId, status, adminId) => {
    return await pool.query(
        `UPDATE users 
         SET status = $1, 
             approved_by = $2, 
             approval_date = NOW(), 
             updated_at = NOW() 
         WHERE id = $3`,
        [status, adminId, userId]
    );
};

// Update role (Archivist, Admin, Faculty, Student)
export const updateUserTypeRole = async (userId, user_type) => {
    return await pool.query(
        'UPDATE users SET user_type = $1, updated_at = NOW() WHERE id = $2',
        [user_type, userId]
    );
};