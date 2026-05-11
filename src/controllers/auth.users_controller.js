import {validationResult} from 'express-validator'

// User Management Services
import { 
    findUserByEmail, 
    findUserByUsername, 
    createUser, 
    findUserById,
    fetchAllUsers,
    updateTypeStatus,
    updateUserTypeRole,
    findUserByIdNumber
} from '../services/auth.users_services.js'

import bcrypt from 'bcrypt'

// 1. USER MANAGEMENT

// 1.1 Landing & Dashboard
export const getIndex = async (request, result) => {
    const user = await findUserById(request.session.userId)

    if (!user) {
        return result.render('index', { error: null, success : null })
    }

    result.render('index', { 
        user: user, 
        username: user.username, 
        first_name: user.first_name, 
        type: user.user_type
    })
}

export const getHome = async (request, result) => {
    const user = await findUserById(request.session.userId)

    if (!user) {
        return result.render('login', { error: 'You must login first.', success : null })
    }

    result.render('home', { user: user, username: user.username, first_name: user.first_name, type: user.user_type})
}

// 1.2 Login
export const getLogin = (request, result) => {
    result.render('login', { error: null, success : null })
}

export const postLogin = async (request, result) => {
    const errors = validationResult(request)

    if (!errors.isEmpty()) {
        return result.render('login', { error: errors.array()[0].msg })
    }

    const { username, password } = request.body

    const UsernameExists = await findUserByUsername(username)

    if (!UsernameExists) {
        return result.render('login', { error: 'Username does not exist.', success : null })
    }

    const match = await bcrypt.compare(password, UsernameExists.password)
    if (!match) {
        return result.render('login', { error: 'Incorrect password.', success : null })
    }

    const checkStatus = await (UsernameExists.status)
    if (checkStatus === 0) {
        return result.render('login', { error: 'Your account is awaiting approval. Please contact the administrator.', success : null })
    } else if (checkStatus > 2) {
        return result.render('login', { error: 'Your account has been blocked. Please contact the administrator.', success : null })
    }

    request.session.userId = UsernameExists.id;
    request.session.save((err) => {
        if (err) {
            return result.render('login', { error: 'Session error', success: null });
        }
        return result.redirect('home');
    });
}

// 1.3 Register
export const getRegister = (request, result) => {
    result.render('register', { error: null, success : null })
}

export const postRegister = async (request, result) => {
    const errors = validationResult(request)

    if (!errors.isEmpty()) {
        return result.render('register', { error: errors.array()[0].msg, success : null })
    }

    const { username, first_name, last_name, email, user_type, id_number, password, confirmPassword } = request.body

    if (password != confirmPassword) { 
        return result.render('register', { error: 'Passwords do not match.', success : null})
    }

    const UsernameExists = await findUserByUsername(username)

    if (UsernameExists) {
        return result.render('register', { error: 'Username is already taken.', success : null })
    }

    const EmailExists = await findUserByEmail(email)

    if (EmailExists) {
        return result.render('register', { error: 'Email is already in use.', success : null })
    }

    const IDNumberExists = await findUserByIdNumber(id_number)

    if (IDNumberExists) {
        return result.render('register', { error: 'ID number is already in use.', success : null })
    }

    await createUser(username, first_name, last_name, email, user_type, id_number, password)

    result.render('login', { success : 'User account requested. Please wait for email confirmation before logging in.', error: null })
        
}

// 1.4 Logout
export const logout = (request, result) => {
    request.session.destroy(() => {
        result.clearCookie('connect.sid'); //no back
        result.render('login', { error: null, success : 'Logged out. Please sign in again.' });
    })
}

// 1.5 User Management

export const getUserManagement = async (request, result) => {
    try {
        // 1. Fetch the logged-in user from the session so the header can see it
        let user = null;
        if (request.session && request.session.userId) {
            user = await findUserById(request.session.userId);
        }

        // 2. Fetch the list of users for the table
        const AllUsers = await fetchAllUsers(); //

        result.render('admin/manage_users', { 
            users: AllUsers,
            user,
            type: user.user_type, //added
            path: '/admin/manage_users',
            // Flash messages passed here
            success_msg: request.flash ? request.flash('success_msg') : [],
            error_msg: request.flash ? request.flash('error_msg') : []
        });
    } catch (error) {
        console.error("Controller Error:", error);
        result.status(500).send("Internal Server Error: " + error.message);
    }
};

export const updateUserStatus = async (request, result) => {
    const { userId, status } = request.body;
    
    const adminId = request.session.userId; 

    if (!adminId) {
        return result.status(401).send("Unauthorized: No admin session found");
    }

    try {
        await updateTypeStatus(userId, status, adminId);
        result.redirect('/admin/manage_users');
    } catch (error) {
        console.error("Status Update Error:", error);
        result.status(500).send("Update Failed");
    }
};

export const updateUserRole = async (request, result) => {
    const { userId, user_type } = request.body;

    try {
        await updateUserTypeRole(userId, user_type);
        result.redirect('/admin/users');
    } catch (error) {
        console.error("Role Update Error:", error);
        result.status(500).send("Role Update Failed");
    }
};