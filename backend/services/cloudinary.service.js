const streamifier = require('stream');
const cloudinary = require('../config/cloudinary');

/**
 * Uploads a buffer (from multer memoryStorage) to Cloudinary via an
 * upload_stream, resolved as a Promise.
 */
const uploadBuffer = (buffer, { folder, resourceType = 'auto', publicId } = {}) =>
  new Promise((resolve, reject) => {
    const uploadOptions = { folder, resource_type: resourceType };
    if (publicId) uploadOptions.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });

    const readable = new streamifier.Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });

const destroy = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[cloudinary] Failed to destroy ${publicId}: ${err.message}`);
    return null;
  }
};

module.exports = { uploadBuffer, destroy };
