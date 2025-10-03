import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { GitService } from '../../services/git.service';
import { ExcelService } from '../../services/excel.service';
import { RulesDataService } from '../../services/rules-data.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  gitFetchForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private gitService: GitService,
    private excelService: ExcelService,
    private rulesDataService: RulesDataService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.gitFetchForm = this.fb.group({
      repoOwner: ['jihoyoo99', Validators.required],
      repoName: ['drools-rules-manager', Validators.required],
      filePath: ['backend/test-data/sample-drools-table.xlsx', Validators.required],
      branch: ['main'],
      token: ['']
    });
  }

  onFetchFromGit(): void {
    if (this.gitFetchForm.invalid) {
      this.notificationService.showError('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formValue = this.gitFetchForm.value;

    this.gitService.fetchFile({
      repoOwner: formValue.repoOwner,
      repoName: formValue.repoName,
      filePath: formValue.filePath,
      branch: formValue.branch || 'main',
      token: formValue.token || undefined
    }).subscribe({
      next: (response) => {
        this.rulesDataService.setRepoInfo({
          owner: formValue.repoOwner,
          name: formValue.repoName,
          filePath: formValue.filePath,
          branch: formValue.branch || 'main',
          token: formValue.token || undefined,
          hasToken: !!formValue.token
        });

        this.excelService.parseFile(response.localPath).subscribe({
          next: (parseResponse) => {
            this.rulesDataService.setRulesData(parseResponse.data);
            this.notificationService.showSuccess('File fetched and parsed successfully!');
            this.isLoading = false;
            this.router.navigate(['/editor']);
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.showError(`Parse error: ${error.error?.message || error.message}`);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showError(`Fetch error: ${error.error?.message || error.message}`);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onUploadFile(): void {
    if (!this.selectedFile) {
      this.notificationService.showError('Please select a file first');
      return;
    }

    this.isLoading = true;

    this.excelService.uploadFile(this.selectedFile).subscribe({
      next: (uploadResponse) => {
        if (!uploadResponse.validation.isValid) {
          this.isLoading = false;
          this.notificationService.showError('Invalid Drools format: ' + uploadResponse.validation.errors.join(', '));
          return;
        }

        this.excelService.parseFile(uploadResponse.file.path).subscribe({
          next: (parseResponse) => {
            this.rulesDataService.setRulesData(parseResponse.data);
            this.notificationService.showSuccess('File uploaded and parsed successfully!');
            this.isLoading = false;
            this.router.navigate(['/editor']);
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.showError(`Parse error: ${error.error?.message || error.message}`);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showError(`Upload error: ${error.error?.message || error.message}`);
      }
    });
  }
}
