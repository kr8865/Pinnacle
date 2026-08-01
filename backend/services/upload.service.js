const { uploadBuffer } = require('./cloudinary.service');

/** Picks resource_type based on mimetype for Cloudinary. */
const resourceTypeFor = (mimetype = '') => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw';
};

/**
 * Uploads a single multer file object to Cloudinary under the given folder.
 * Returns { url, publicId, resourceType, originalName, mimetype }.
 */
const uploadFile = async (file, folder) => {
  const resourceType = resourceTypeFor(file.mimetype);
  const result = await uploadBuffer(file.buffer, { folder, resourceType });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType,
    originalName: file.originalname,
    mimetype: file.mimetype,
    bytes: result.bytes,
  };
};

/** Uploads multiple multer files (array) to the same folder. */
const uploadFiles = async (files = [], folder) => Promise.all(files.map((f) => uploadFile(f, folder)));

/** Uploads a raw Buffer (e.g. a generated PDF) to Cloudinary. */
const uploadGeneratedBuffer = async (buffer, folder, publicId, resourceType = 'raw') =>
  uploadBuffer(buffer, { folder, publicId, resourceType }).then((result) => ({
    url: result.secure_url,
    publicId: result.public_id,
  }));

module.exports = { uploadFile, uploadFiles, uploadGeneratedBuffer, resourceTypeFor };
