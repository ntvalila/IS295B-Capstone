function openPreview(filePath, title, type) {
    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    const body = document.getElementById('pBody');
    document.getElementById('pTitle').innerText = title;

    body.innerHTML = '<div class="p-5"><div class="spinner-border text-danger"></div></div>';

    if (type && type.includes('image')) {
        body.innerHTML = `<img src="${filePath}" class="img-fluid rounded shadow-sm" style="max-height: 75vh;">`;
    } else if (type && type.includes('pdf')) {
        body.innerHTML = `<iframe src="${filePath}" width="100%" height="600px" style="border:none;" class="rounded shadow-sm"></iframe>`;
    } else {
        body.innerHTML = `<div class="p-5 text-muted"><i class="bi bi-slash-circle fs-1 d-block mb-2"></i>Preview not available.</div>`;
    }

    modal.show();
}

async function downloadItemFile(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const url = this.getAttribute('data-url');
            const filename = this.getAttribute('data-filename');
            downloadItemFile(url, filename);
        });
    });

    // Delete modal — guarded separately so it doesn't block download wiring
    const modalElement = document.getElementById('deleteConfirmModal');
    if (modalElement) {
        modalElement.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            if (!button) return;

            const itemId = button.getAttribute('data-item-id');
            const itemTitle = button.getAttribute('data-item-title');
            const collectionId = button.getAttribute('data-collection-id');

            const nameDisplay = document.getElementById('modal-item-name-display');
            const deleteLink = document.getElementById('modal-confirm-delete-link');

            if (nameDisplay) nameDisplay.textContent = itemTitle;
            if (deleteLink) {
                deleteLink.href = `/admin/items/delete/${itemId}?collectionId=${collectionId}`;
            }
        });
    }
});