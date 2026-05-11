import express from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import {body} from 'express-validator'
import { 
   getIndex,
   getLogin, 
   postLogin, 
   logout, 
   getRegister, 
   postRegister, 
   getHome,
   getUserManagement,
   updateUserRole,
   updateUserStatus 
} from '../controllers/auth.users_controller.js'
import {
   // Collection Level
   fetchCollections,
   addCollection,
   updateCollection,
   deleteCollection,

   // Box Level
   addBox,
   updateBox,
   deleteBox,
   
   // Folder Level
   addFolder,
   deleteFolder,

   // Item Level
   addItem,
   updateItem,
   deleteItem
} from '../controllers/auth.collections_controller.js'
import { 
    searchInventory,
    downloadItem,
    previewItem,
    getItemDetails
} from '../controllers/auth.search_analytics_controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js' 

const router = express.Router()

// 0. STORAGE CONFIGURATION

// 1.1 Multer Configuration
const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        // Ensure this folder exists: public/uploads/items/
        cb(null, 'public/uploads/items/');
    },
    filename: (request, file, cb) => {
        // Creates a unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadDir = 'public/uploads/items/';

// 0.2 Directory Checker and Creation
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('--- Upload directory created ---');
}

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// 1. USER MANAGEMENT

// 1.1 User Login
router.get('/login', getLogin)
router.post('/login', postLogin)

// 1.2 User Registration
router.get('/register', getRegister)
router.post('/register', 
    body('email').isEmail().withMessage('Invalid email'),
    body('username').isLength({min: 6, max: 15}).withMessage('Username must be at least 6 to 15 characters.'),
    body('password').isLength({min: 6, max: 15}).withMessage('Password must be at least 6 to 15 characters.'),
    body('user_type').isInt({min: 1, max: 5}).withMessage('Please select user category.'),
    body('id_number').isLength({min: 3, max: 15}).withMessage('Please input your ID Number.'),
  postRegister
)

// 1.3 User Access to Dashboard
router.get('/home', 
    isAuthenticated, 
    getHome)
router.get('/index', getIndex)
router.get('/', getIndex)

// 1.4 User Logout
router.get('/logout', logout)

router.post('/logout', (req, res) => {
  req.session.destroy(); // Clear server session
  res.set('Clear-Site-Data', '"cache", "cookies", "storage"'); // Standardized data clearing
  res.redirect('/login');
});

// 1.5 User Management
router.get('/admin/manage_users', isAuthenticated, getUserManagement);
router.post('/admin/users/update-status', isAuthenticated, updateUserStatus);
router.post('/admin/users/update-role', isAuthenticated, updateUserRole);

// 2. COLLECTION MANAGEMENT
// 2.1 Collection Level
router.get('/admin/collections', isAuthenticated, fetchCollections)
router.post('/admin/collections/add', isAuthenticated, addCollection)
router.post('/admin/collections/update', isAuthenticated, updateCollection)
router.post('/admin/collections/delete', isAuthenticated, deleteCollection);

// 2.2 Box Level
router.post('/admin/boxes/add', isAuthenticated, addBox)
router.post('/admin/boxes/update', isAuthenticated, updateBox);
router.post('/admin/boxes/delete', isAuthenticated, deleteBox);

// 2.3 Folder Level
router.post('/admin/folders/add', isAuthenticated, addFolder)
router.post('/admin/folders/delete', isAuthenticated, deleteFolder);

// 2.4 Item Level
router.post('/admin/items/add', isAuthenticated, upload.single('item_file'), addItem);
router.post('/admin/items/update', isAuthenticated, upload.single('item_file'), updateItem);
router.post('/admin/items/delete', isAuthenticated, deleteItem);

// 3. SEARCH AND ANALYTICS
router.get('/search', searchInventory);
router.get('/search/download/:id', downloadItem);
router.get('/search/preview/:id', previewItem);
router.get('/search/details/:id', getItemDetails);

export default router