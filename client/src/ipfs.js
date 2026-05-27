const GOV_API = 'http://localhost:4002/api';

const fileUpload = {
    upload: async (fileOrBuffer) => {
        try {
            const formData = new FormData();
            if (fileOrBuffer instanceof File) {
                formData.append('file', fileOrBuffer, fileOrBuffer.name);
            } else {
                // Legacy buffer support
                const blob = new Blob([fileOrBuffer]);
                formData.append('file', blob, 'upload.bin');
            }
            const res = await fetch(`${GOV_API}/files/upload`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            return { fileId: data.fileId, hash: data.sha256Hash, url: data.url };
        } catch (err) {
            console.error('File upload failed:', err);
            throw new Error('File upload service unavailable. Is the Gov Portal running on port 4002?');
        }
    },
    getUrl: (fileId) => {
        return `${GOV_API}/files/${fileId}`;
    }
};

export default fileUpload;
