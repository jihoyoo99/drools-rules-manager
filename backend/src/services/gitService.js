const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class GitService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp-files');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`Temp directory ready: ${this.tempDir}`);
    } catch (error) {
      logger.error('Error creating temp directory:', error);
    }
  }

  getOctokit(token) {
    const authToken = token || process.env.GITHUB_TOKEN;
    if (authToken) {
      return new Octokit({ auth: authToken });
    }
    return new Octokit();
  }

  async fetchFileFromGitHub(owner, repo, filePath, ref = 'main', token = null) {
    try {
      logger.info(`Fetching file from GitHub: ${owner}/${repo}/${filePath} (ref: ${ref})`);
      
      const octokit = this.getOctokit(token);
      
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref
      });

      if (response.data.type !== 'file') {
        throw new Error('The specified path is not a file');
      }

      const content = Buffer.from(response.data.content, 'base64');
      
      const fileName = path.basename(filePath);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const localFileName = `github-${uniqueSuffix}-${fileName}`;
      const localPath = path.join(this.tempDir, localFileName);
      
      await fs.writeFile(localPath, content);
      
      logger.info(`File saved locally: ${localPath}`);
      
      return {
        localPath,
        content: content.toString('base64'),
        sha: response.data.sha,
        size: response.data.size
      };
    } catch (error) {
      logger.error('Error fetching file from GitHub:', error);
      if (error.status === 404) {
        throw new Error(`File not found: ${owner}/${repo}/${filePath}`);
      }
      throw new Error(`Failed to fetch file from GitHub: ${error.message}`);
    }
  }

  async commitFileToGitHub(owner, repo, filePath, content, message, branch, author, token = null) {
    try {
      logger.info(`Committing file to GitHub: ${owner}/${repo}/${filePath} on branch ${branch}`);
      
      const octokit = this.getOctokit(token);
      
      let branchRef;
      try {
        const branchResponse = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`
        });
        branchRef = branchResponse.data;
      } catch (error) {
        if (error.status === 404) {
          logger.info(`Branch ${branch} does not exist, will create it`);
          const defaultBranchResponse = await octokit.repos.get({ owner, repo });
          const defaultBranch = defaultBranchResponse.data.default_branch;
          
          const defaultRef = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${defaultBranch}`
          });
          
          const newBranchResponse = await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branch}`,
            sha: defaultRef.data.object.sha
          });
          branchRef = newBranchResponse.data;
        } else {
          throw error;
        }
      }

      let fileSha = null;
      try {
        const existingFile = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branch
        });
        fileSha = existingFile.data.sha;
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }

      const commitData = {
        owner,
        repo,
        path: filePath,
        message,
        content,
        branch,
        committer: {
          name: author.name || 'Drools Rules Manager',
          email: author.email || 'drools-rules-manager@example.com'
        },
        author: {
          name: author.name || 'Drools Rules Manager',
          email: author.email || 'drools-rules-manager@example.com'
        }
      };

      if (fileSha) {
        commitData.sha = fileSha;
      }

      const commitResponse = await octokit.repos.createOrUpdateFileContents(commitData);
      
      logger.info(`File committed successfully: ${commitResponse.data.commit.sha}`);
      
      return {
        commitSha: commitResponse.data.commit.sha,
        branch,
        status: 'success',
        htmlUrl: commitResponse.data.commit.html_url
      };
    } catch (error) {
      logger.error('Error committing file to GitHub:', error);
      throw new Error(`Failed to commit file to GitHub: ${error.message}`);
    }
  }

  async createBranchOnGitHub(owner, repo, newBranch, fromBranch = 'main', token = null) {
    try {
      logger.info(`Creating branch on GitHub: ${owner}/${repo}/${newBranch} from ${fromBranch}`);
      
      const octokit = this.getOctokit(token);
      
      const sourceRef = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${fromBranch}`
      });
      
      const newBranchResponse = await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranch}`,
        sha: sourceRef.data.object.sha
      });
      
      logger.info(`Branch created successfully: ${newBranch}`);
      
      return {
        branchName: newBranch,
        sha: newBranchResponse.data.object.sha,
        status: 'success'
      };
    } catch (error) {
      logger.error('Error creating branch on GitHub:', error);
      if (error.status === 422) {
        throw new Error(`Branch ${newBranch} already exists`);
      }
      throw new Error(`Failed to create branch on GitHub: ${error.message}`);
    }
  }

  async createPullRequestOnGitHub(owner, repo, title, body, head, base, token = null) {
    try {
      logger.info(`Creating PR on GitHub: ${owner}/${repo} from ${head} to ${base}`);
      
      const octokit = this.getOctokit(token);
      
      const prResponse = await octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      });
      
      logger.info(`PR created successfully: #${prResponse.data.number}`);
      
      return {
        prNumber: prResponse.data.number,
        prUrl: prResponse.data.html_url,
        status: 'success'
      };
    } catch (error) {
      logger.error('Error creating PR on GitHub:', error);
      if (error.status === 422) {
        throw new Error('A pull request already exists for this branch or validation failed');
      }
      throw new Error(`Failed to create PR on GitHub: ${error.message}`);
    }
  }
}

module.exports = new GitService();
