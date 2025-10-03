import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { GitService } from '../../services/git.service';
import { NotificationService } from '../../services/notification.service';
import { RepoInfo } from '../../models/git.model';

@Component({
  selector: 'app-pull-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>merge_type</mat-icon>
      Create Pull Request
    </h2>
    <mat-dialog-content>
      <form [formGroup]="prForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>PR Title</mat-label>
          <input matInput formControlName="title" placeholder="Update Drools rules">
          <mat-icon matPrefix>title</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4" placeholder="Describe the changes..."></textarea>
          <mat-icon matPrefix>description</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Source Branch</mat-label>
          <input matInput formControlName="sourceBranch" placeholder="feature/update-rules">
          <mat-icon matPrefix>account_tree</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Target Branch</mat-label>
          <input matInput formControlName="targetBranch" placeholder="main">
          <mat-icon matPrefix>account_tree</mat-icon>
        </mat-form-field>
      </form>

      <div class="success-message" *ngIf="prUrl">
        <mat-icon>check_circle</mat-icon>
        <span>Pull request created successfully!</span>
        <a [href]="prUrl" target="_blank" mat-button color="primary">
          <mat-icon>open_in_new</mat-icon>
          View PR #{{ prNumber }}
        </a>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isCreating">
        {{ prUrl ? 'Close' : 'Cancel' }}
      </button>
      <button mat-raised-button color="accent" (click)="onCreatePR()" 
              [disabled]="prForm.invalid || isCreating || prUrl" *ngIf="!prUrl">
        <mat-spinner *ngIf="isCreating" diameter="20"></mat-spinner>
        <mat-icon *ngIf="!isCreating">add</mat-icon>
        {{ isCreating ? 'Creating...' : 'Create PR' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-content {
      min-width: 500px;
      padding-top: 20px;
    }

    .full-width {
      width: 100%;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: #e8f5e9;
      border-radius: 4px;
      margin-top: 16px;
      
      mat-icon {
        color: #4caf50;
      }
      
      span {
        flex: 1;
        color: #2e7d32;
      }
    }
  `]
})
export class PullRequestDialogComponent {
  prForm: FormGroup;
  isCreating = false;
  prUrl: string | null = null;
  prNumber: number | null = null;

  constructor(
    private fb: FormBuilder,
    private gitService: GitService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<PullRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { repoInfo: RepoInfo }
  ) {
    this.prForm = this.fb.group({
      title: ['Update Drools decision table rules', Validators.required],
      description: ['Updated rules via Drools Rules Manager'],
      sourceBranch: [data.repoInfo.branch, Validators.required],
      targetBranch: ['main', Validators.required]
    });
  }

  onCreatePR(): void {
    if (this.prForm.invalid) return;

    this.isCreating = true;
    const formValue = this.prForm.value;

    this.gitService.createPullRequest({
      repoOwner: this.data.repoInfo.owner,
      repoName: this.data.repoInfo.name,
      title: formValue.title,
      description: formValue.description,
      sourceBranch: formValue.sourceBranch,
      targetBranch: formValue.targetBranch,
      token: this.data.repoInfo.token
    }).subscribe({
      next: (response) => {
        this.isCreating = false;
        this.prUrl = response.prUrl;
        this.prNumber = response.prNumber;
        this.notificationService.showSuccess(`Pull request #${response.prNumber} created successfully!`);
      },
      error: (error) => {
        this.isCreating = false;
        this.notificationService.showError(`PR creation failed: ${error.error?.message || error.message}`);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
