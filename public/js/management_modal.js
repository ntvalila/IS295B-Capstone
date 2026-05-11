document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view");

    // --- 1. Logic for Folder Edit Modal ---
    const editFolderModal = document.getElementById("editFolderModal");
    if (editFolderModal) {
        editFolderModal.addEventListener("show.bs.modal", function (event) {
            const btn = event.relatedTarget;
            if (!btn) return;

            document.getElementById("edit_folder_id").value = btn.getAttribute("data-id");
            document.getElementById("edit_folder_name").value = btn.getAttribute("data-name");
            document.getElementById("edit_folder_description").value = btn.getAttribute("data-description");
            document.getElementById("edit_physical_order").value = btn.getAttribute("data-physical-order");
        });
    }

    // --- 2. Logic for Add/Edit Item Modal ---
    const itemModal = document.getElementById("addItemModal");
    if (itemModal) {
        itemModal.addEventListener("show.bs.modal", function (event) {
            const btn = event.relatedTarget;
            const form = document.getElementById("itemForm");
            const label = document.getElementById("itemModalLabel");
            const fileMsg = document.getElementById("file_edit_msg");

            // Check if we are ADDING or EDITING
            if (btn.getAttribute("data-mode") === "edit") {
                label.innerText = "Update Item Details";
                form.action = "/admin/items/update";
                if (fileMsg) fileMsg.classList.remove("d-none");

                document.getElementById("item_id").value = btn.getAttribute("data-id");
                document.getElementById("item_title").value = btn.getAttribute("data-title");
                document.getElementById("item_creator").value = btn.getAttribute("data-creator");
                document.getElementById("item_extent").value = btn.getAttribute("data-extent");
                document.getElementById("item_medium_id").value = btn.getAttribute("data-medium");
                document.getElementById("item_restriction_id").value = btn.getAttribute("data-restriction");
                document.getElementById("item_description").value = btn.getAttribute("data-description");
            } else {
                // Default to ADD mode
                label.innerText = "Add Item to Folder";
                form.action = "/admin/items/add";
                form.reset();
                document.getElementById("item_id").value = "";
                if (fileMsg) fileMsg.classList.add("d-none");
            }
        });
    }

    // --- 3. Logic for Box Details Page (Your existing code) ---
    if (view === "box_details") {
        const editBoxModal = document.getElementById("editBoxModal");
        if (editBoxModal) {
            editBoxModal.addEventListener("show.bs.modal", function (event) {
                const btn = event.relatedTarget;
                if (!btn) return;
                document.getElementById("modal_edit_box_id").value = btn.getAttribute("data-id");
                document.getElementById("modal_edit_box_name").value = btn.getAttribute("data-name");
                document.getElementById("modal_edit_box_number").value = btn.getAttribute("data-number");
                document.getElementById("modal_edit_box_display_order").value = btn.getAttribute("data-order");
                document.getElementById("modal_edit_box_description").value = btn.getAttribute("data-description");
                const rest = btn.getAttribute("data-restriction") || "1";
                document.getElementById("modal_edit_box_restriction_id").value = rest;
            });
        }
    }

    // --- 4. Logic for Item Details Page Delete (Your existing code) ---
    if (view === "item-details") {
        const deleteModal = document.getElementById('deleteConfirmModal');
        if (deleteModal) {
            deleteModal.addEventListener('show.bs.modal', function (event) {
                const btn = event.relatedTarget;
                if (!btn) return;
                const itemId = btn.getAttribute('data-item-id');
                const title = btn.getAttribute('data-item-title');
                document.getElementById('modal-item-name-display').textContent = title;
                document.getElementById('modal-confirm-delete-link').href = `/admin/items/delete/${itemId}?collectionId=${btn.getAttribute('data-collection-id')}&boxId=${btn.getAttribute('data-box-id')}`;
            });
        }
    }
});