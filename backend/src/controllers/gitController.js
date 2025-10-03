const express = require('express');
const Joi = require('joi');
const gitService = require('../services/gitService');
const logger = require('../utils/logger');

const router = express.Router();

const fetchFileSchema = Joi.object({
  repoOwner: Joi.string().required(),
  repoName: Joi.string().required(),
  filePath: Joi.string().required(),
  branch: Joi.string().default('main'),
  token: Joi.string().optional()
});

const commitFileSchema = Joi.object({
  repoOwner: Joi.string().required(),
  repoName: Joi.string().required(),
  filePath: Joi.string().required(),
  content: Joi.string().required(),
  message: Joi.string().required(),
  branch: Joi.string().required(),
  author: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required()
  }).required(),
  token: Joi.string().optional()
});

const createBranchSchema = Joi.object({
  repoOwner: Joi.string().required(),
  repoName: Joi.string().required(),
  newBranch: Joi.string().required(),
  fromBranch: Joi.string().default('main'),
  token: Joi.string().optional()
});

const createPRSchema = Joi.object({
  repoOwner: Joi.string().required(),
  repoName: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().default(''),
  sourceBranch: Joi.string().required(),
  targetBranch: Joi.string().required(),
  token: Joi.string().optional()
});

router.get('/fetch-file', async (req, res, next) => {
  try {
    const { error, value } = fetchFileSchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      });
    }

    const { repoOwner, repoName, filePath, branch, token } = value;
    
    const result = await gitService.fetchFileFromGitHub(
      repoOwner,
      repoName,
      filePath,
      branch,
      token
    );
    
    logger.info(`File fetched successfully from ${repoOwner}/${repoName}/${filePath}`);
    
    res.status(200).json({
      message: 'File fetched successfully from GitHub',
      localPath: result.localPath,
      content: result.content,
      sha: result.sha,
      size: result.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.post('/commit-file', async (req, res, next) => {
  try {
    const { error, value } = commitFileSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      });
    }

    const { repoOwner, repoName, filePath, content, message, branch, author, token } = value;
    
    const result = await gitService.commitFileToGitHub(
      repoOwner,
      repoName,
      filePath,
      content,
      message,
      branch,
      author,
      token
    );
    
    logger.info(`File committed successfully to ${repoOwner}/${repoName}/${filePath}`);
    
    res.status(200).json({
      message: 'File committed successfully to GitHub',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.post('/create-branch', async (req, res, next) => {
  try {
    const { error, value } = createBranchSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      });
    }

    const { repoOwner, repoName, newBranch, fromBranch, token } = value;
    
    const result = await gitService.createBranchOnGitHub(
      repoOwner,
      repoName,
      newBranch,
      fromBranch,
      token
    );
    
    logger.info(`Branch created successfully: ${repoOwner}/${repoName}/${newBranch}`);
    
    res.status(200).json({
      message: 'Branch created successfully on GitHub',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.post('/create-pr', async (req, res, next) => {
  try {
    const { error, value } = createPRSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      });
    }

    const { repoOwner, repoName, title, description, sourceBranch, targetBranch, token } = value;
    
    const result = await gitService.createPullRequestOnGitHub(
      repoOwner,
      repoName,
      title,
      description,
      sourceBranch,
      targetBranch,
      token
    );
    
    logger.info(`PR created successfully: ${repoOwner}/${repoName}#${result.prNumber}`);
    
    res.status(200).json({
      message: 'Pull request created successfully on GitHub',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
