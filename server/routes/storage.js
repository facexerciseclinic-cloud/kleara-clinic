const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

// Cloud Storage SDKs
// AWS S3
let s3Client = null;
try {
  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }
} catch (error) {
  console.log('AWS SDK not installed. Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
}

// Google Cloud Storage
let gcsStorage = null;
try {
  const { Storage } = require('@google-cloud/storage');
  
  if (process.env.GCS_PROJECT_ID && process.env.GCS_KEY_FILE) {
    gcsStorage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE
    });
  }
} catch (error) {
  console.log('GCS SDK not installed. Run: npm install @google-cloud/storage');
}

// Storage Configuration
const STORAGE_CONFIG = {
  provider: process.env.STORAGE_PROVIDER || 'local', // 'local', 's3', 'gcs'
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  },
  s3: {
    bucket: process.env.AWS_S3_BUCKET || '',
    region: process.env.AWS_REGION || 'ap-southeast-1'
  },
  gcs: {
    bucket: process.env.GCS_BUCKET || ''
  }
};

// Configure Multer for local storage
const localStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', req.body.category || 'general');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Configure Multer for memory storage (for S3/GCS upload)
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: STORAGE_CONFIG.provider === 'local' ? localStorage : memoryStorage,
  limits: {
    fileSize: STORAGE_CONFIG.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    const category = req.body.category || 'general';
    const allowedTypes = STORAGE_CONFIG.allowedTypes[category] || STORAGE_CONFIG.allowedTypes.all;
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// @route   POST /api/storage/upload
// @desc    Upload file to storage
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { category = 'general', patientId, description } = req.body;
    let fileUrl = '';
    let fileKey = '';

    // Upload based on provider
    switch (STORAGE_CONFIG.provider) {
      case 's3':
        if (!s3Client) {
          return res.status(500).json({
            success: false,
            message: 'AWS S3 not configured'
          });
        }
        
        fileKey = `${category}/${Date.now()}-${req.file.originalname}`;
        
        const s3Params = {
          Bucket: STORAGE_CONFIG.s3.bucket,
          Key: fileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          Metadata: {
            uploadedBy: req.user.id,
            category,
            patientId: patientId || '',
            description: description || ''
          }
        };

        await s3Client.send(new PutObjectCommand(s3Params));
        fileUrl = `https://${STORAGE_CONFIG.s3.bucket}.s3.${STORAGE_CONFIG.s3.region}.amazonaws.com/${fileKey}`;
        break;

      case 'gcs':
        if (!gcsStorage) {
          return res.status(500).json({
            success: false,
            message: 'Google Cloud Storage not configured'
          });
        }

        const bucket = gcsStorage.bucket(STORAGE_CONFIG.gcs.bucket);
        fileKey = `${category}/${Date.now()}-${req.file.originalname}`;
        const blob = bucket.file(fileKey);

        await blob.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype,
            metadata: {
              uploadedBy: req.user.id,
              category,
              patientId: patientId || '',
              description: description || ''
            }
          }
        });

        fileUrl = `https://storage.googleapis.com/${STORAGE_CONFIG.gcs.bucket}/${fileKey}`;
        break;

      case 'local':
      default:
        fileUrl = `/uploads/${category}/${req.file.filename}`;
        fileKey = req.file.filename;
        break;
    }

    // Save file metadata to database (optional)
    const fileMetadata = {
      filename: req.file.originalname,
      fileKey,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category,
      patientId,
      description,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      provider: STORAGE_CONFIG.provider
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: fileMetadata
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

// @route   POST /api/storage/upload-multiple
// @desc    Upload multiple files
// @access  Private
router.post('/upload-multiple', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { category = 'general', patientId, description } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      let fileUrl = '';
      let fileKey = '';

      switch (STORAGE_CONFIG.provider) {
        case 's3':
          if (s3Client) {
            fileKey = `${category}/${Date.now()}-${file.originalname}`;
            await s3Client.send(new PutObjectCommand({
              Bucket: STORAGE_CONFIG.s3.bucket,
              Key: fileKey,
              Body: file.buffer,
              ContentType: file.mimetype
            }));
            fileUrl = `https://${STORAGE_CONFIG.s3.bucket}.s3.${STORAGE_CONFIG.s3.region}.amazonaws.com/${fileKey}`;
          }
          break;

        case 'gcs':
          if (gcsStorage) {
            const bucket = gcsStorage.bucket(STORAGE_CONFIG.gcs.bucket);
            fileKey = `${category}/${Date.now()}-${file.originalname}`;
            await bucket.file(fileKey).save(file.buffer, { metadata: { contentType: file.mimetype } });
            fileUrl = `https://storage.googleapis.com/${STORAGE_CONFIG.gcs.bucket}/${fileKey}`;
          }
          break;

        case 'local':
        default:
          fileUrl = `/uploads/${category}/${file.filename}`;
          fileKey = file.filename;
          break;
      }

      uploadedFiles.push({
        filename: file.originalname,
        fileKey,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: uploadedFiles
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
});

// @route   GET /api/storage/signed-url/:fileKey
// @desc    Get signed URL for secure file access
// @access  Private
router.get('/signed-url/:fileKey(*)', auth, async (req, res) => {
  try {
    const fileKey = req.params.fileKey;
    const expiresIn = parseInt(req.query.expiresIn) || 3600; // 1 hour default

    let signedUrl = '';

    switch (STORAGE_CONFIG.provider) {
      case 's3':
        if (!s3Client) {
          return res.status(500).json({
            success: false,
            message: 'AWS S3 not configured'
          });
        }

        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        
        const command = new GetObjectCommand({
          Bucket: STORAGE_CONFIG.s3.bucket,
          Key: fileKey
        });

        signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
        break;

      case 'gcs':
        if (!gcsStorage) {
          return res.status(500).json({
            success: false,
            message: 'Google Cloud Storage not configured'
          });
        }

        const bucket = gcsStorage.bucket(STORAGE_CONFIG.gcs.bucket);
        const file = bucket.file(fileKey);

        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + expiresIn * 1000
        });

        signedUrl = url;
        break;

      case 'local':
      default:
        signedUrl = `/uploads/${fileKey}`;
        break;
    }

    res.json({
      success: true,
      data: {
        signedUrl,
        expiresIn
      }
    });

  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL',
      error: error.message
    });
  }
});

// @route   DELETE /api/storage/:fileKey
// @desc    Delete file from storage
// @access  Private
router.delete('/:fileKey(*)', auth, async (req, res) => {
  try {
    const fileKey = req.params.fileKey;

    switch (STORAGE_CONFIG.provider) {
      case 's3':
        if (!s3Client) {
          return res.status(500).json({
            success: false,
            message: 'AWS S3 not configured'
          });
        }

        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        await s3Client.send(new DeleteObjectCommand({
          Bucket: STORAGE_CONFIG.s3.bucket,
          Key: fileKey
        }));
        break;

      case 'gcs':
        if (!gcsStorage) {
          return res.status(500).json({
            success: false,
            message: 'Google Cloud Storage not configured'
          });
        }

        const bucket = gcsStorage.bucket(STORAGE_CONFIG.gcs.bucket);
        await bucket.file(fileKey).delete();
        break;

      case 'local':
      default:
        const filePath = path.join(__dirname, '../uploads', fileKey);
        await fs.unlink(filePath);
        break;
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

// @route   GET /api/storage/list
// @desc    List files in storage
// @access  Private
router.get('/list', auth, async (req, res) => {
  try {
    const { category, patientId, limit = 50 } = req.query;
    let files = [];

    switch (STORAGE_CONFIG.provider) {
      case 's3':
        if (s3Client) {
          const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
          const prefix = category ? `${category}/` : '';
          
          const command = new ListObjectsV2Command({
            Bucket: STORAGE_CONFIG.s3.bucket,
            Prefix: prefix,
            MaxKeys: parseInt(limit)
          });

          const response = await s3Client.send(command);
          files = (response.Contents || []).map(item => ({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
            url: `https://${STORAGE_CONFIG.s3.bucket}.s3.${STORAGE_CONFIG.s3.region}.amazonaws.com/${item.Key}`
          }));
        }
        break;

      case 'gcs':
        if (gcsStorage) {
          const bucket = gcsStorage.bucket(STORAGE_CONFIG.gcs.bucket);
          const prefix = category ? `${category}/` : '';
          
          const [gcsFiles] = await bucket.getFiles({ prefix, maxResults: parseInt(limit) });
          files = gcsFiles.map(file => ({
            key: file.name,
            size: parseInt(file.metadata.size),
            lastModified: file.metadata.updated,
            url: `https://storage.googleapis.com/${STORAGE_CONFIG.gcs.bucket}/${file.name}`
          }));
        }
        break;

      case 'local':
      default:
        const uploadsDir = path.join(__dirname, '../uploads');
        const targetDir = category ? path.join(uploadsDir, category) : uploadsDir;
        
        try {
          const fileNames = await fs.readdir(targetDir);
          for (const fileName of fileNames.slice(0, parseInt(limit))) {
            const filePath = path.join(targetDir, fileName);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
              files.push({
                key: category ? `${category}/${fileName}` : fileName,
                size: stats.size,
                lastModified: stats.mtime,
                url: `/uploads/${category ? category + '/' : ''}${fileName}`
              });
            }
          }
        } catch (error) {
          // Directory doesn't exist or empty
          files = [];
        }
        break;
    }

    res.json({
      success: true,
      data: {
        files,
        count: files.length,
        provider: STORAGE_CONFIG.provider
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files',
      error: error.message
    });
  }
});

module.exports = router;
