import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

export interface PushDialogData {
  repoOwner: string;
  repoName: string;
  currentBranch: string;
}

export interface PushDialogResult {
  branchName: string;
  commitMessage: string;
  authorName: string;
  authorEmail: string;
  prTitle: string;
  prDescription: string;
  targetBranch: string;
}

@Component({
  selector: 'app-push-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Push Changes to Git</h2>
    <mat-dialog-content>
      <form [formGroup]="pushForm" class="push-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Branch Name</mat-label>
          <input matInput formControlName="branchName">
          <mat-error *ngIf="pushForm.get('branchName')?.hasError('required')">
            Branch name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Commit Message</mat-label>
          <textarea matInput formControlName="commitMessage" rows="3" placeholder="Describe your changes"></textarea>
          <mat-error *ngIf="pushForm.get('commitMessage')?.hasError('required')">
            Commit message is required
          </mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Author Name</mat-label>
            <input matInput formControlName="authorName">
            <mat-error *ngIf="pushForm.get('authorName')?.hasError('required')">
              Author name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Author Email</mat-label>
            <input matInput formControlName="authorEmail" type="email">
            <mat-error *ngIf="pushForm.get('authorEmail')?.hasError('required')">
              Author email is required
            </mat-error>
            <mat-error *ngIf="pushForm.get('authorEmail')?.hasError('email')">
              Invalid email format
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Target Branch (for PR)</mat-label>
          <input matInput formControlName="targetBranch">
          <mat-error *ngIf="pushForm.get('targetBranch')?.hasError('required')">
            Target branch is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Pull Request Title</mat-label>
          <input matInput formControlName="prTitle">
          <mat-error *ngIf="pushForm.get('prTitle')?.hasError('required')">
            PR title is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Pull Request Description</mat-label>
          <textarea matInput formControlName="prDescription" rows="4" placeholder="Describe the changes in this PR"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onPush()" [disabled]="!pushForm.valid || isLoading">
        <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
        <span *ngIf="!isLoading">Create PR</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .push-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 500px;
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .half-width {
      flex: 1;
    }

    mat-dialog-content {
      max-height: 600px;
      overflow-y: auto;
    }

    button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class PushDialogComponent implements OnInit {
  pushForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PushDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PushDialogData
  ) {
    const timestamp = Date.now();
    const suggestedBranch = `rule-update-${timestamp}`;

    this.pushForm = this.fb.group({
      branchName: [suggestedBranch, Validators.required],
      commitMessage: ['', Validators.required],
      authorName: ['', Validators.required],
      authorEmail: ['', [Validators.required, Validators.email]],
      targetBranch: ['main', Validators.required],
      prTitle: ['', Validators.required],
      prDescription: ['']
    });
  }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onPush(): void {
    if (this.pushForm.valid) {
      const result: PushDialogResult = {
        branchName: this.pushForm.value.branchName,
        commitMessage: this.pushForm.value.commitMessage,
        authorName: this.pushForm.value.authorName,
        authorEmail: this.pushForm.value.authorEmail,
        prTitle: this.pushForm.value.prTitle,
        prDescription: this.pushForm.value.prDescription,
        targetBranch: this.pushForm.value.targetBranch
      };
      this.dialogRef.close(result);
    }
  }
}
