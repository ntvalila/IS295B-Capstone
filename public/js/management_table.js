// public/js/global.js
$(document).ready(function () {
    const collectionTable = $('#collectionTableBoxes');
    if (collectionTable.length && !$.fn.DataTable.isDataTable(collectionTable[0])) {
        collectionTable.DataTable();
    }

    const boxTable = $('#boxTable');
    if (boxTable.length && !$.fn.DataTable.isDataTable(boxTable[0])) {
        boxTable.DataTable();
    }

    const folderTable = $('#folderTable');
    if (folderTable.length && !$.fn.DataTable.isDataTable(folderTable[0])) {
        folderTable.DataTable();
    }

    const pendingUserTable = $('#pendingUserTable');
    if (pendingUserTable.length && !$.fn.DataTable.isDataTable(pendingUserTable[0])) {
        pendingUserTable.DataTable();
    }

    const activeUserTable = $('#activeUserTable');
    if (activeUserTable.length && !$.fn.DataTable.isDataTable(activeUserTable[0])) {
        activeUserTable.DataTable();
    }

    const blockUserTable = $('#blockUserTable');
    if (blockUserTable.length && !$.fn.DataTable.isDataTable(blockUserTable[0])) {
        blockUserTable.DataTable();
    }
});
