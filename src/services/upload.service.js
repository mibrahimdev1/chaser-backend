// const multer = require('multer');
// const path = require('path');
// const sharp = require('sharp');
// const fs = require('fs');
// const crypto = require('crypto');

// const storage = multer.memoryStorage();
// const UPLOADS_DIR = path.join(__dirname, '../../public/assets/uploads');

// const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// const sanitizeFilename = (filename) => {
//   const ext = path.extname(filename).toLowerCase();
//   const baseName = crypto.randomUUID(); // Generate a safe random filename
//   return `${baseName}${ext}`;
// };
// const fileUpload = (req, res, next) => {
//   upload.any()(req, res, async (err) => {
//     if (err) {
//       return next(err);
//     }

//     try {
//       // Process each uploaded file and return a new array of modified file objects
//       const processedFiles = await Promise.all(
//         req.files.map(async (file) => {
//           const ext = path.extname(file.originalname).toLowerCase();
//           const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
//           const safeFilename = sanitizeFilename(file.originalname);
//           const filePath = path.join(UPLOADS_DIR, safeFilename);
//           const finalPath = filePath; // Store final path separately

//           if (isImage) {
//             await sharp(file.buffer).rotate().resize(1024).jpeg({ quality: 70 }).toFile(finalPath);
//           } else {
//             fs.writeFileSync(filePath, file.buffer);
//           }

//           return { ...file, path: finalPath }; // Return a new object instead of modifying file
//         })
//       );

//       req.files = processedFiles; // Assign processed files back to req.files safely
//       next();
//     } catch (compressionErr) {
//       return next(compressionErr);
//     }
//   });
// };

// module.exports = { fileUpload };

const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

// Set up multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const sanitizeFilename = () => {
    return crypto.randomUUID(); // Generate a safe random filename
};

// Function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder, filename) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, public_id: filename, resource_type: 'auto' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            },
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// File Upload Middleware
const fileUpload = (req, res, next) => {
    upload.any()(req, res, async (err) => {
        // Handle multer errors first
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    message: 'File too large. Maximum size allowed is 50MB.',
                });
            }
            return next(err);
        }

        // Check if files exist
        if (!req.files || req.files.length === 0) {
            return next(new Error('No files uploaded'));
        }

        try {
            console.log(`[fileUpload] Processing ${req.files.length} file(s)`);

            const uploadedFiles = await Promise.all(
                req.files.map(async (file, index) => {
                    try {
                        console.log(`\n[fileUpload] File ${index + 1}/${req.files.length}:`);
                        console.log(`Original Name: ${file.originalname}`);
                        console.log(`MIME Type: ${file.mimetype || 'NOT PROVIDED'}`);
                        console.log(`Size: ${(file.size / 1024).toFixed(2)} KB`);

                        // Get file extension from originalname first (most reliable)
                        let ext = '';
                        if (file.originalname) {
                            const extMatch = file.originalname.match(/\.([^.]+)$/);
                            ext = extMatch ? extMatch[1].toLowerCase() : '';
                            console.log(`Extension from filename: ${ext || 'NONE'}`);
                        }

                        // Fallback: try to get extension from mimetype
                        if (!ext && file.mimetype) {
                            ext = file.mimetype.split('/')[1];
                            if (ext.includes(';')) {
                                ext = ext.split(';')[0];
                            }
                            console.log(`Extension from mimetype: ${ext}`);
                        }

                        if (!ext) {
                            ext = 'bin';
                            console.log(`No extension found, defaulting to: ${ext}`);
                        }

                        // Define file extensions that should be saved locally
                        const documentExtensions = [
                            'pdf',
                            'doc',
                            'docx',
                            'xls',
                            'xlsx',
                            'ppt',
                            'pptx',
                            'rtf',
                            'txt',
                            'csv',
                            'odt',
                            'ods',
                            'odp',
                        ];

                        const voiceNoteExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'mp4'];

                        // Define MIME types that should be saved locally (for additional safety)
                        const voiceNoteMimeTypes = [
                            'audio/mpeg',
                            'audio/wav',
                            'audio/ogg',
                            'audio/vnd.dlna.adts',
                            'audio/aac',
                            'audio/x-aac',
                            'audio/mp4',
                            'audio/m4a',
                        ];

                        const documentMimeTypes = [
                            'application/pdf',
                            'application/msword', // .doc
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                            'application/vnd.ms-excel', // .xls
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                            'application/vnd.ms-powerpoint', // .ppt
                            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
                            'application/rtf', // .rtf
                            'text/plain', // .txt
                            'text/csv', // .csv
                            'application/vnd.oasis.opendocument.text', // .odt
                            'application/vnd.oasis.opendocument.spreadsheet', // .ods
                            'application/vnd.oasis.opendocument.presentation', // .odp
                        ];

                        // Check by extension OR mimetype (both must be checked)
                        const isDocumentByExt = documentExtensions.includes(ext);
                        const isDocumentByMime = file.mimetype && documentMimeTypes.includes(file.mimetype);
                        const isVoiceNoteByExt = voiceNoteExtensions.includes(ext);
                        const isVoiceNoteByMime = file.mimetype && voiceNoteMimeTypes.includes(file.mimetype);

                        const isDocument = isDocumentByExt || isDocumentByMime;
                        const isVoiceNote = isVoiceNoteByExt || isVoiceNoteByMime;

                        console.log(`Is Document (by ext): ${isDocumentByExt}`);
                        console.log(`Is Document (by mime): ${isDocumentByMime}`);
                        console.log(`Is Voice Note (by ext): ${isVoiceNoteByExt}`);
                        console.log(`Is Voice Note (by mime): ${isVoiceNoteByMime}`);
                        console.log(`Final Decision: ${isDocument || isVoiceNote ? 'SAVE LOCALLY' : 'UPLOAD TO CLOUDINARY'}`);

                        // Handle special cases for audio extensions
                        if (file.mimetype === 'audio/vnd.dlna.adts' || file.mimetype === 'audio/aac' || file.mimetype === 'audio/x-aac') {
                            ext = 'aac';
                            console.log(`Special case: Setting extension to 'aac'`);
                        }

                        // Save voice notes and documents locally
                        if (isVoiceNote || isDocument) {
                            // Generate safe filename with proper extension
                            const baseFilename = sanitizeFilename();
                            const finalFilename = `${baseFilename}.${ext}`;

                            // Ensure upload directory exists
                            const uploadDir = path.join(process.cwd(), 'public/uploads');
                            const savePath = path.join(uploadDir, finalFilename);

                            console.log(`Upload Directory: ${uploadDir}`);
                            console.log(`Save Path: ${savePath}`);
                            console.log(`Final Filename: ${finalFilename}`);

                            try {
                                // Create directory if it doesn't exist (with error handling)
                                if (!fs.existsSync(uploadDir)) {
                                    console.log(`Creating directory: ${uploadDir}`);
                                    fs.mkdirSync(uploadDir, { recursive: true });
                                } else {
                                    console.log(`Directory exists: ${uploadDir}`);
                                }

                                // Save file asynchronously with error handling
                                console.log(`Writing file to disk...`);
                                await fs.promises.writeFile(savePath, file.buffer);
                                console.log(`File saved successfully!`);

                                // Return file info with public URL
                                return {
                                    ...file,
                                    path: `https://api.chaserthenetwork.com/uploads/${finalFilename}`,
                                    localPath: savePath,
                                }; // PROD
                                // return {
                                //     ...file,
                                //     path: `https://cad7db317af4.ngrok-free.app/uploads/${finalFilename}`,
                                //     localPath: savePath,
                                // }; // DEV ---> Change it to the One You Want to Use
                            } catch (fileError) {
                                console.error(`Error saving file ${finalFilename}:`, fileError.message);
                                throw new Error(`Failed to save file: ${fileError.message}`);
                            }
                        }

                        // Process images using sharp before uploading to Cloudinary
                        console.log(`Processing as image/other file for Cloudinary...`);
                        let { buffer } = file;
                        const imageExts = ['jpeg', 'jpg', 'png', 'webp', 'gif'];

                        if (imageExts.includes(ext.toLowerCase())) {
                            try {
                                console.log(`Processing image with Sharp (resize, rotate, compress)...`);
                                buffer = await sharp(file.buffer).rotate().resize(1024).jpeg({ quality: 70 }).toBuffer();
                                console.log(`Image processed successfully`);
                            } catch (sharpError) {
                                console.error(`Sharp processing error:`, sharpError.message);
                                // Fallback: use original buffer if sharp fails
                                buffer = file.buffer;
                                console.log(`Using original buffer as fallback`);
                            }
                        }

                        // Upload other files (images, etc.) to Cloudinary
                        const baseFilename = sanitizeFilename();
                        const cloudinaryFilename = `${baseFilename}.${ext}`;
                        console.log(`Uploading to Cloudinary...`);
                        console.log(`Cloudinary filename: ${cloudinaryFilename}`);
                        const url = await uploadToCloudinary(buffer, 'uploads', cloudinaryFilename);
                        console.log(`Uploaded to Cloudinary: ${url}`);

                        return {
                            ...file,
                            path: url,
                        };
                    } catch (fileError) {
                        console.error(`Error processing file ${file.originalname}:`, fileError.message);
                        throw fileError;
                    }
                }),
            );

            req.files = uploadedFiles;
            next();
        } catch (error) {
            console.error('[fileUpload] Upload processing error:', error.message);
            return next(error);
        }
    });
};

module.exports = { fileUpload };
