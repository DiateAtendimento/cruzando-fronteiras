// backend-programacoes/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dohooplme',
  api_key: '513438551232695',
  api_secret: 'IUi6aWyDj7yBmxECSARLHFOsrKU',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'drpps-programacoes',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

module.exports = { cloudinary, storage };
