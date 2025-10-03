import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { ExcelService } from '../../services/excel.service';
import { GitService } from '../../services/git.service';
import { NotificationService } from '../../services/notification.service';
import { DroolsTableData } from '../../models/drools-table.model';
import { RepoInfo } from '../../models/git.model';

@Component({
  selector: 'app-commit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>save</mat-icon>
      Save & Commit Changes
    </h2>
    <mat-dialog-content>
      <form [formGroup]="commitForm">
        <mat-checkbox formControlName="createNewBranch" class="checkbox-field">
          Create new branch for this commit
        </mat-checkbox>

        <mat-form-field appearance="outline" class="full-width" *ngIf="commitForm.get('createNewBranch')?.value">
          <mat-label>New Branch Name</mat-label>
          <input matInput formControlName="newBranchName" placeholder="e.g., feature/update-rules">
          <mat-icon matPrefix>account_tree</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="!commitForm.get('createNewBranch')?.value">
          <mat-label>Branch</mat-label>
          <input matInput formControlName="branch" placeholder="main">
          <mat-icon matPrefix>account_tree</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Commit Message</mat-label>
          <textarea matInput formControlName="commitMessage" rows="3" placeholder="Describe your changes..."></textarea>
          <mat-icon matPrefix>message</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Author Name</mat-label>
          <input matInput formControlName="authorName" placeholder="Your Name">
          <mat-icon matPrefix>person</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Author Email</mat-label>
          <input matInput formControlName="authorEmail" type="email" placeholder="your.email@example.com">
          <mat-icon matPrefix>email</mat-icon>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isCommitting">Cancel</button>
      <button mat-raised-button color="primary" (click)="onCommit()" [disabled]="commitForm.invalid || isCommitting">
        <mat-spinner *ngIf="isCommitting" diameter="20"></mat-spinner>
        <mat-icon *ngIf="!isCommitting">save</mat-icon>
        {{ isCommitting ? 'Committing...' : 'Commit' }}
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

    .checkbox-field {
      margin-bottom: 16px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class CommitDialogComponent implements OnInit {
  commitForm: FormGroup;
  isCommitting = false;

  constructor(
    private fb: FormBuilder,
    private excelService: ExcelService,
    private gitService: GitService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<CommitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { rulesData: DroolsTableData; repoInfo: RepoInfo }
  ) {
    this.commitForm = this.fb.group({
      createNewBranch: [false],
      newBranchName: [''],
      branch: [data.repoInfo?.branch || 'main', Validators.required],
      commitMessage: ['Update Drools rules', Validators.required],
      authorName: ['Drools Rules Manager', Validators.required],
      authorEmail: ['drools-rules-manager@example.com', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.commitForm.get('createNewBranch')?.valueChanges.subscribe(createNew => {
      if (createNew) {
        this.commitForm.get('newBranchName')?.setValidators([Validators.required]);
        this.commitForm.get('branch')?.clearValidators();
      } else {
        this.commitForm.get('newBranchName')?.clearValidators();
        this.commitForm.get('branch')?.setValidators([Validators.required]);
      }
      this.commitForm.get('newBranchName')?.updateValueAndValidity();
      this.commitForm.get('branch')?.updateValueAndValidity();
    });
  }

  onCommit(): void {
    if (this.commitForm.invalid || !this.data.repoInfo) return;

    this.isCommitting = true;
    const formValue = this.commitForm.value;

    this.excelService.generateFile(this.data.rulesData).subscribe({
      next: (generateResponse) => {
        fetch(generateResponse.file.downloadUrl)
          .then(res => res.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const base64Content = base64data.split(',')[1];

              const targetBranch = formValue.createNewBranch ? formValue.newBranchName : formValue.branch;

              this.gitService.commitFile({
                repoOwner: this.data.repoInfo!.owner,
                repoName: this.data.repoInfo!.name,
                filePath: this.data.repoInfo!.filePath,
                content: base64Content,
                message: formValue.commitMessage,
                branch: targetBranch,
                author: {
                  name: formValue.authorName,
                  email: formValue.authorEmail
                },
                token: this.data.repoInfo!.token
              }).subscribe({
                next: (response) => {
                  this.isCommitting = false;
                  this.notificationService.showSuccess(`Successfully committed to branch '${response.branch}'`);
                  this.dialogRef.close('success');
                },
                error: (error) => {
                  this.isCommitting = false;
                  this.notificationService.showError(`Commit failed: ${error.error?.message || error.message}`);
                }
              });
            };
          })
          .catch(error => {
            this.isCommitting = false;
            this.notificationService.showError(`Failed to read generated file: ${error.message}`);
          });
      },
      error: (error) => {
        this.isCommitting = false;
        this.notificationService.showError(`File generation failed: ${error.error?.message || error.message}`);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
