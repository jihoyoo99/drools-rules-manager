import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DroolsColumn } from '../../models/drools-table.model';

export interface AddColumnDialogData {
  existingColumns: DroolsColumn[];
}

export interface AddColumnDialogResult {
  column: DroolsColumn;
}

@Component({
  selector: 'app-add-column-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Column</h2>
    <mat-dialog-content>
      <form [formGroup]="columnForm" class="column-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Column Label</mat-label>
          <input matInput formControlName="label" placeholder="e.g., Age, Income">
          <mat-error *ngIf="columnForm.get('label')?.hasError('required')">
            Label is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Column Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="CONDITION">Condition</mat-option>
            <mat-option value="ACTION">Action</mat-option>
          </mat-select>
          <mat-error *ngIf="columnForm.get('type')?.hasError('required')">
            Type is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Object Binding</mat-label>
          <input matInput formControlName="objectBinding" placeholder="e.g., $customer:Customer">
          <mat-hint>Required for CONDITION columns</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Pattern Template</mat-label>
          <input matInput formControlName="patternTemplate" placeholder="e.g., $customer.getAge() > ($param)">
          <mat-hint>Use ($param) as placeholder for cell values</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onAdd()" [disabled]="!columnForm.valid">
        Add Column
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .column-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      max-height: 600px;
      overflow-y: auto;
    }
  `]
})
export class AddColumnDialogComponent {
  columnForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddColumnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddColumnDialogData
  ) {
    this.columnForm = this.fb.group({
      label: ['', Validators.required],
      type: ['CONDITION', Validators.required],
      objectBinding: [''],
      patternTemplate: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.columnForm.valid) {
      const formValue = this.columnForm.value;
      const nextIndex = Math.max(...this.data.existingColumns.map(c => c.index), 0) + 1;
      const nextId = `col_${nextIndex}`;

      const newColumn: DroolsColumn = {
        id: nextId,
        index: nextIndex,
        type: formValue.type,
        label: formValue.label,
        objectBinding: formValue.objectBinding || '',
        patternTemplate: formValue.patternTemplate || ''
      };

      const result: AddColumnDialogResult = { column: newColumn };
      this.dialogRef.close(result);
    }
  }
}
