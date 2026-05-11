// public/js/global.js
$(document).ready(function () {
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

    const collectionTableBoxes = $('#collectionTableBoxes');
    if (collectionTableBoxes.length && !$.fn.DataTable.isDataTable(collectionTableBoxes[0])) {
        $('#collectionTableBoxes').DataTable({
            paging: true,
            searching: true,
            info: true,
            layout: {
                topStart: 'search',
                topEnd: null
            },
            language: {
                search: "",
                searchPlaceholder: "Search boxes..."
            },
            columnDefs: [{ orderable: false, targets: 3 }],
            order: [[0, "asc"]]
        });
    }

});
