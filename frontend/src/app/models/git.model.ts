export interface GitFetchRequest {
  repoOwner: string;
  repoName: string;
  filePath: string;
  branch?: string;
  token?: string;
}

export interface GitFetchResponse {
  message: string;
  localPath: string;
  content: string;
  sha: string;
  size: number;
  timestamp: string;
}

export interface GitCommitRequest {
  repoOwner: string;
  repoName: string;
  filePath: string;
  content: string;
  message: string;
  branch: string;
  author: {
    name: string;
    email: string;
  };
  token?: string;
}

export interface GitCommitResponse {
  message: string;
  commitSha: string;
  branch: string;
  status: string;
  htmlUrl: string;
  timestamp: string;
}

export interface GitCreateBranchRequest {
  repoOwner: string;
  repoName: string;
  newBranch: string;
  fromBranch?: string;
  token?: string;
}

export interface GitCreateBranchResponse {
  message: string;
  branchName: string;
  sha: string;
  status: string;
  timestamp: string;
}

export interface GitCreatePRRequest {
  repoOwner: string;
  repoName: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  token?: string;
}

export interface GitCreatePRResponse {
  message: string;
  prNumber: number;
  prUrl: string;
  status: string;
  timestamp: string;
}

export interface RepoInfo {
  owner: string;
  name: string;
  filePath: string;
  branch: string;
  token?: string;
  hasToken: boolean;
}
