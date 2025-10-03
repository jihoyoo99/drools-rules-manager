const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Joi = require('joi');

const excelService = require('../services/excelService');
const logger = require('../utils/logger');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  }
});

const generateRuleDataSchema = Joi.object({
  metadata: Joi.object({
    ruleSet: Joi.string().required(),
    imports: Joi.array().items(Joi.string()).default([]),
    variables: Joi.array().items(Joi.string()).default([]),
    notes: Joi.string().default('')
  }).required(),
  ruleTable: Joi.object({
    name: Joi.string().required(),
    columns: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      index: Joi.number().required(),
      type: Joi.string().valid('NAME', 'CONDITION', 'ACTION').required(),
      objectBinding: Joi.string().default(''),
      patternTemplate: Joi.string().default(''),
      label: Joi.string().required()
    })).required(),
    rules: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      ruleName: Joi.string().required(),
      conditions: Joi.object().default({}),
      actions: Joi.object().default({})
    })).required()
  }).required(),
  worksheetName: Joi.string().default('Rules')
});

router.post('/upload', upload.single('excelFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select an Excel file to upload',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`File uploaded: ${req.file.originalname} (${req.file.size} bytes)`);

    const validation = await excelService.validateDroolsFormat(req.file.path);
    
    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      },
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.post('/parse', async (req, res, next) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        error: 'Missing file path',
        message: 'Please provide the path to the Excel file to parse',
        timestamp: new Date().toISOString()
      });
    }

    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified Excel file could not be found',
        timestamp: new Date().toISOString()
      });
    }

    const droolsData = await excelService.parseExcelFile(filePath);
    
    logger.info(`Excel file parsed successfully: ${filePath}`);
    
    res.status(200).json({
      message: 'Excel file parsed successfully',
      data: droolsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const { error, value } = generateRuleDataSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details,
        timestamp: new Date().toISOString()
      });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const outputFileName = `generated-rules-${uniqueSuffix}.xlsx`;
    const outputPath = path.join(__dirname, '../../uploads', outputFileName);

    await excelService.generateExcelFile(value, outputPath);
    
    logger.info(`Excel file generated successfully: ${outputPath}`);
    
    res.status(200).json({
      message: 'Excel file generated successfully',
      file: {
        filename: outputFileName,
        path: outputPath,
        downloadUrl: `/uploads/${outputFileName}`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
