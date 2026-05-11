import path from 'path';
import fs from 'fs';

// Search Services
import {
  getArchivalInventory,
  getItemById,
  getItemFileDetails,
  getSingleItemFullDetails
} from '../services/auth.search_analytics_services.js'

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

const MEDIUM_TYPES = {
  1: "Document",
  2: "Book",
  3: "Image",
  4: "Pamphlet",
  5: "Magazine"
};

export const searchInventory = async (request, result) => {
  try {
    let mediums = request.query.medium_id || [];

    if (!Array.isArray(mediums)) {
      mediums = [mediums];
    }

    let user = request.session?.userId ? await findUserById(request.session.userId) : null;

    const items = await getArchivalInventory({
      searchTerm: request.query.searchTerm,
      medium_ids: mediums,
      dateFrom: request.query.dateFrom,
      dateTo: request.query.dateTo,
      user,
      type: user.user_type
    });

    result.render('searchData', {
      items: items || [],
      query: request.query || {},
      mediumLabels: MEDIUM_TYPES,
      selectedMediums: mediums,
      user: user, 
      username: user.username, 
      first_name: user.first_name, 
      type: user.user_type
    });

  } catch (error) {
    console.error(error);
    result.status(500).send("Server Error");
  }
};

export const downloadItem = async (request, result) => {
  try {
    const { id } = request.params;
    const item = await getItemById(id);

    if (!item || !item.file_path) {
      request.flash('error_msg', 'File record not found.');
      return result.redirect('/search');
    }

    const absolutePath = path.resolve(item.file_path);

    if (fs.existsSync(absolutePath)) {
      return result.download(absolutePath, item.file_name);
    } else {
      console.error("File missing on disk at:", absolutePath);
      request.flash('error_msg', 'The physical file is missing from the server.');
      return result.redirect('/search');
    }
  } catch (error) {
    console.error("Download Controller Error:", error);
    return result.redirect('/search');
  }
};

export const previewItem = async (request, result) => {
  try {
    const { id } = request.params;
    const item = await getItemFileDetails(id);

    if (!item || !item.file_path) {
      request.flash('error_msg', 'File not found in database.');
      return result.redirect('/search');
    }

    const absolutePath = path.resolve(item.file_path);

    if (fs.existsSync(absolutePath)) {
      return result.sendFile(absolutePath);
    } else {
      console.error("Physical file missing at:", absolutePath);
      return result.redirect('/search');
    }
  } catch (error) {
    console.error("Controller Error (previewItem):", error);
    return result.redirect('/search');
  }
};

export const getItemDetails = async (request, result) => {
  try {
    const { id } = request.params;

    let user = request.session?.userId ? await findUserById(request.session.userId) : null;

    const item = await getSingleItemFullDetails(id);

    if (!item) {
      request.flash('error_msg', 'Record not found');
      return result.redirect('/search');
    }

    result.render('details', {
      user: user, 
      username: user.username, 
      first_name: user.first_name, 
      type: user.user_type,
      item,
      mediumLabels: MEDIUM_TYPES
    });
  } catch (error) {
    console.log(error)
    request.flash('error_msg', error);
    return result.redirect('/search');
  }
};