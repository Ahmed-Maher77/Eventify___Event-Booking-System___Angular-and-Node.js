import multer from "multer";

// IMAGE UPLOAD CONFIG
const imageStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
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