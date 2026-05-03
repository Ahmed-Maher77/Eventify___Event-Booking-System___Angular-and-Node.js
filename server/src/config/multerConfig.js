import path from "node:path";
import multer from "multer";

export const ALLOWED_IMAGE_MIMES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
];

const extToMime = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
};

/** Same MIME rules as multer fileFilter — for disk reads (seed / migration). */
export function mimeTypeFromImageFilename(filename) {
    const ext = path.extname(String(filename)).toLowerCase();
    return extToMime[ext] ?? null;
}

export function assertDiskImageAllowed(filename) {
    const mime = mimeTypeFromImageFilename(filename);
    if (!mime || !ALLOWED_IMAGE_MIMES.includes(mime)) {
        throw new Error(
            `Only JPEG, PNG, GIF, and WebP images are allowed (got ${filename})`,
        );
    }
    return mime;
}

// IMAGE UPLOAD CONFIG
const imageStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only JPEG, PNG, GIF, and WebP images are allowed"),
            false,
        );
    }
};

export const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});