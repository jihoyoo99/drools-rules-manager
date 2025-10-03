import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GitFetchRequest,
  GitFetchResponse,
  GitCommitRequest,
  GitCommitResponse,
  GitCreateBranchRequest,
  GitCreateBranchResponse,
  GitCreatePRRequest,
  GitCreatePRResponse
} from '../models/git.model';

@Injectable({
  providedIn: 'root'
})
export class GitService {
  private apiUrl = '/api/git';

  constructor(private http: HttpClient) {}

  fetchFile(request: GitFetchRequest): Observable<GitFetchResponse> {
    let params = new HttpParams()
      .set('repoOwner', request.repoOwner)
      .set('repoName', request.repoName)
      .set('filePath', request.filePath);
    
    if (request.branch) {
      params = params.set('branch', request.branch);
    }
    
    if (request.token) {
      params = params.set('token', request.token);
    }

    return this.http.get<GitFetchResponse>(`${this.apiUrl}/fetch-file`, { params });
  }

  commitFile(request: GitCommitRequest): Observable<GitCommitResponse> {
    return this.http.post<GitCommitResponse>(`${this.apiUrl}/commit-file`, request);
  }

  createBranch(request: GitCreateBranchRequest): Observable<GitCreateBranchResponse> {
    return this.http.post<GitCreateBranchResponse>(`${this.apiUrl}/create-branch`, request);
  }

  createPullRequest(request: GitCreatePRRequest): Observable<GitCreatePRResponse> {
    return this.http.post<GitCreatePRResponse>(`${this.apiUrl}/create-pr`, request);
  }
}
