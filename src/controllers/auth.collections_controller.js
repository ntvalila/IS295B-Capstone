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

// Collection Management Services
import {
    createCollection,
    modifyCollection,
    removeCollection,
    fetchAllCollections,
    createBox,
    modifyBox,
    removeBox,
    createFolder,
    removeFolder,
    uploadItem,
    getItemDetails,
    modifyItem,
    removeItem
} from '../services/auth.collections_services.js'

import pool from '../config/db.js'
import bcrypt from 'bcrypt'

// 2. COLLECTION MANAGEMENT

// 2.1 Collection Level
export const fetchCollections = async (request, result) => {
    try {
        const collections = await fetchAllCollections() || [];
        
        const idFromUrl = request.query.id ? parseInt(request.query.id) : null;
        const boxId = request.query.boxId ? parseInt(request.query.boxId) : null;
        const folderId = request.query.folderId ? parseInt(request.query.folderId) : null;
        const itemId = request.query.itemId ? parseInt(request.query.itemId) : null;
        const currentView = request.query.view || 'overview';

        // 1. Select collection
        let selectedCollection = collections.find(c => c.id === idFromUrl) || (collections.length > 0 ? collections[0] : null);
        
        // 2. Select box
        let selectedBox = null;
        if (selectedCollection?.boxes) {
            selectedBox = selectedCollection.boxes.find(b => b.id === boxId) || 
                         (currentView === 'box_details' ? selectedCollection.boxes[0] : null);
        }

        // 3. Select folder
        let selectedFolder = null;
        if (selectedBox?.folders) {
            selectedFolder = selectedBox.folders.find(f => f.id === folderId);
        }

        // 4. Select item
        let selectedItem = null;
        if (currentView === 'item-details' && itemId) {
            const itemResult = await getItemDetails(itemId); // Assumes this function exists
            selectedItem = itemResult?.rows?.[0] || null;
        }

        let user = request.session?.userId ? await findUserById(request.session.userId) : null;

        result.render('admin/collections', { 
            collections,
            user,
            type: user.user_type, //added
            selectedCollection: selectedCollection || { boxes: [] }, 
            box: selectedBox || { folders: [], items: [] },
            folder: selectedFolder || { items: [] },
            item: selectedItem,
            boxId,
            folderId,
            itemId,
            path: '/admin/collections',
            view: currentView,
            // Flash messages passed here
            success_msg: request.flash ? request.flash('success_msg') : [],
            error_msg: request.flash ? request.flash('error_msg') : []
        });
    } catch (error) {
        console.error("Controller Error:", error);
        result.status(500).send("Internal Server Error: " + error.message);
    }
};

export const addCollection = async (request, result) => {
    try {
      const { name, location, description, restriction_id } = request.body;
      
      const createdBy = request.session.userId; 

      if (!createdBy) {
          request.flash('error_msg', 'You must be logged in to perform this action.');
          return result.redirect('/login');
      }
  
      const result = await createCollection(
          name, 
          location, 
          description, 
          parseInt(restriction_id) || 0, // Ensure it's a number
          createdBy
      );  
        
      request.flash('success_msg', 'Collection saved successfully!');
      result.redirect(`/admin/collections?view=add-collection`);
  
    } catch (error) {
      console.error("DETAILED ERROR:", error);
      request.flash('error_msg', 'Failed to create collection: ' + error.message);
      result.redirect('/admin/collections?view=add-collection');
    }
};

export const updateCollection = async (request, result) => {
    try {
        const { id, name, location, description, restriction_id } = request.body;

        await modifyCollection(
            id, 
            name, 
            location, 
            description, 
            parseInt(restriction_id)
        );

        request.flash('success_msg', 'Collection metadata updated successfully!');
        result.redirect(`/admin/collections?id=${id}&view=collection_overview`);
    } catch (error) {
        console.error(error);
        request.flash('error_msg', error.message);
        result.redirect(`/admin/collections?id=${request.body.id}&view=edit_collection`);
    }
};

export const deleteCollection = async (request, result) => {
    try {
        const { id } = request.body;

        await removeCollection(id);

        request.flash('success_msg', 'Collection permanently deleted.');

        result.redirect('/admin/collections');
    } catch (error) {
        console.error("Delete Error:", error);
        request.flash('error_msg', 'Failed to delete collection. It may contain active records.');
        result.redirect('back');
    }
};

// 2.2 Box Level
export const addBox = async (request, result) => {
    try {
        const { collection_id, name, box_number, physical_order, description, restriction_id } = request.body;
        const createdBy = request.session.userId; 

        await createBox(
            collection_id, 
            name, 
            box_number, 
            physical_order,
            description, 
            restriction_id, 
            createdBy
        );

        request.flash('success_msg', 'Box successfully created!');
        result.redirect(`/admin/collections?id=${collection_id}&view=collection_overview`);

    } catch (error) {
        console.error(error);
        request.flash('error_msg', error.message);
        
        const collId = request.body.collection_id;
        result.redirect(`/admin/collections?id=${collId}&view=collection_overview`);
    }
};

export const updateBox = async (request, result) => {
    try {
        const { box_id,
            collection_id,
            restriction_id,
            name,
            box_number,
            display_order,
            description } = request.body;

        await modifyBox(
            box_id,
            name,
            box_number,
            display_order,
            parseInt(restriction_id) || 0,
            description
        );

        request.flash('success_msg', 'Box updated successfully');
        result.redirect(`/admin/collections?id=${collection_id}&boxId=${box_id}&view=box_details`);
    } catch (error) {
        console.error("Update Error:", error);
        request.flash('error_msg', error.message);
        const collId = request.query.id;
        const box_id = request.query.boxId;
        result.redirect(`/admin/collections?id=${collId}&view=box_details&boxId=${box_id}`);
    }
};

export const deleteBox = async (request, result) => {
    const { box_id, collection_id } = request.body;

    try {
        const rowsAffected = await removeBox(box_id);

        if (rowsAffected > 0) {
            result.redirect(`/admin/collections?id=${collection_id}&view=overview&message=box_deleted`);
        } else {
            result.status(404).send("Box not found or already inactive.");
        }
    } catch (error) {
        console.error("Controller Error deleting box:", error);
        result.status(500).send("Internal Server Error during deletion.");
    }
};

// 2.3 Folder Level
export const addFolder = async (request, result) => {
    try {
        const { collection_id, name, physical_order, restriction_id, description, box_id } = request.body;
        const createdBy = request.session.userId; 

        await createFolder(
            name,
            physical_order,
            parseInt(restriction_id) || 0,
            description,
            parseInt(box_id) || 0,
            createdBy
        );

        request.flash('success_msg', 'Folder successfully created!');
        result.redirect(`/admin/collections?id=${collection_id}&boxId=${box_id}&view=box_details`);
    } catch (error) {
        console.error(error);
        request.flash('error_msg', error.message);
        
        const collId = request.body.collection_id;
        const boxId = request.body.box_id;
        result.redirect(`/admin/collections?id=${collId}&boxId=${boxId}&view=box_details`);
    }
};

export const deleteFolder = async (request, result) => {
    const { collectionId, boxId, folderId } = request.body;

    try {
        const rowsAffected = await removeFolder(folderId);

        if (rowsAffected > 0) {
            result.redirect(`/admin/collections?id=${collectionId}&boxId=${boxId}&view=box-details`);
        } else {
            result.status(404).send("Folder not found or already inactive.");
        }
    } catch (error) {
        console.error("Controller Error deleting folder:", error);
        result.status(500).send("Internal Server Error during deletion.");
    }
};

export const getFolderWithItems = async (folderId) => {
    const folderRes = await pool.query("SELECT * FROM folders WHERE id = $1", [folderId]);
    const folder = folderRes.rows[0];

    if (!folder) return null;

    // 2. Get Items inside this folder
    const itemsRes = await pool.query(
        "SELECT * FROM items WHERE folder_id = $1 ORDER BY title ASC", 
        [folderId]
    );
    
    folder.items = itemsRes.rows;
    return folder;
};

// 2.4 Item Level

export const addItem = async (request, result) => {
    try {
        const {
            collection_id,
            box_id,
            folder_id,
            title,
            creator,
            description,
            physical_order,
            medium_id,
            extent,
            document_date,
            restriction_id
        } = request.body;

        const file_path = request.file ? request.file.path : null;
        const file_name = request.file ? request.file.filename : null;
        const file_type = request.file ? request.file.mimetype : null;
        const file_size = request.file ? request.file.size : null;

        const finalFolderId = (folder_id && folder_id !== "" && folder_id !== "null") ? folder_id : null;

        await uploadItem({
            title,
            creator,
            physical_order: physical_order || 0,
            extent,
            description,
            medium_id,
            document_date,
            restriction_id: parseInt(restriction_id) || 3,
            folder_id: finalFolderId,
            file_path,
            file_name,
            file_type,
            file_size,
            box_id,
            created_by: request.session.userId
        });

        request.flash('success_msg', 'Item added successfully!');

        if (!finalFolderId) {
            return result.redirect(`/admin/collections?id=${collection_id}&boxId=${box_id}&view=box-details`);
        } else {
            return result.redirect(`/admin/collections?id=${collection_id}&boxId=${box_id}&folderId=${folder_id}&view=folder-details`);
        }

    } catch (error) {
        console.error("Add Item Error:", error);
        const collId = request.body.collection_id;
        const boxId = request.body.box_id;
        result.redirect(`/admin/collections?id=${collId}&boxId=${boxId}&view=box_details`);
    }
};

export const updateItem = async (request, result) => {
    try {
        const { 
            item_id, 
            title, 
            creator, 
            extent, 
            medium_id, 
            restriction_id, 
            description, 
            collection_id, 
            box_id 
        } = request.body;
        
        // Capture the new filename if multer uploaded one
        const newFileName = request.file ? request.file.filename : null;

        // Call the model function
        await modifyItem(
            item_id, 
            title, 
            creator, 
            extent, 
            medium_id, 
            restriction_id, 
            description, 
            newFileName
        );

        request.flash('success_msg', 'Item updated successfully!');
        result.redirect(`/admin/collections?id=${collection_id}&boxId=${box_id}&itemId=${item_id}&view=item-details`);
        
    } catch (error) {
        console.error("Update Controller Error:", error);
        request.flash('error_msg', error.message);
        result.redirect(`/admin/collections?id=${collection_id}&boxId=${box_id}&itemId=${item_id}&view=item-details`);
    }
};

export const deleteItem = async (request, result) => {
    const { collectionId, boxId, folderId, item_id } = request.body;

    try {
        const rowsAffected = await removeItem(item_id);

        if (rowsAffected > 0) {
            result.redirect(`/admin/collections?id=${collectionId}&boxId=${boxId}&folderId=${folderId}&view=box_details`);
        } else {
            result.status(404).send("Item not found or already inactive.");
        }
    } catch (error) {
        console.error("Controller Error deleting item:", error);
        result.status(500).send("Internal Server Error during deletion.");
    }
};