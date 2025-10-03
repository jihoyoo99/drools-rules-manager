import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DroolsTableData, DroolsRule } from '../../models/drools-table.model';

export interface DiffDialogData {
  currentData: DroolsTableData;
  pulledData: DroolsTableData;
}

export interface DiffDialogResult {
  action: 'accept' | 'keep';
}

interface RuleDiff {
  type: 'added' | 'deleted' | 'modified' | 'unchanged';
  rule: DroolsRule;
  currentRule?: DroolsRule;
}

@Component({
  selector: 'app-diff-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Pull Changes from Git</h2>
    <mat-dialog-content>
      <div class="diff-summary">
        <p><strong>Changes detected:</strong></p>
        <ul>
          <li *ngIf="addedRules.length > 0">{{ addedRules.length }} rule(s) added</li>
          <li *ngIf="deletedRules.length > 0">{{ deletedRules.length }} rule(s) deleted</li>
          <li *ngIf="modifiedRules.length > 0">{{ modifiedRules.length }} rule(s) modified</li>
          <li *ngIf="columnChanges">Column structure changed</li>
        </ul>
      </div>

      <div class="diff-details" *ngIf="diffs.length > 0">
        <h3>Rule Changes:</h3>
        <div *ngFor="let diff of diffs" class="rule-diff" [ngClass]="'diff-' + diff.type">
          <div class="diff-header">
            <mat-icon>{{ getDiffIcon(diff.type) }}</mat-icon>
            <span class="rule-name">{{ diff.rule.ruleName }}</span>
            <span class="diff-label">{{ getDiffLabel(diff.type) }}</span>
          </div>
        </div>
      </div>

      <div class="warning-message" *ngIf="hasLocalChanges">
        <mat-icon color="warn">warning</mat-icon>
        <p>Warning: You have unsaved local changes. Accepting these changes will overwrite your local edits.</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onKeep()">Keep Local Changes</button>
      <button mat-raised-button color="primary" (click)="onAccept()">
        Accept Changes from Git
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      max-height: 600px;
      overflow-y: auto;
      min-width: 500px;
    }

    .diff-summary {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .diff-summary ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .diff-details {
      margin-top: 20px;
    }

    .rule-diff {
      padding: 12px;
      margin: 8px 0;
      border-radius: 4px;
      border-left: 4px solid;
    }

    .diff-added {
      background: #e8f5e9;
      border-left-color: #4caf50;
    }

    .diff-deleted {
      background: #ffebee;
      border-left-color: #f44336;
    }

    .diff-modified {
      background: #fff3e0;
      border-left-color: #ff9800;
    }

    .diff-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rule-name {
      font-weight: 500;
      flex: 1;
    }

    .diff-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff3e0;
      padding: 16px;
      border-radius: 4px;
      margin-top: 20px;
    }

    .warning-message p {
      margin: 0;
      color: #e65100;
    }
  `]
})
export class DiffDialogComponent {
  diffs: RuleDiff[] = [];
  addedRules: RuleDiff[] = [];
  deletedRules: RuleDiff[] = [];
  modifiedRules: RuleDiff[] = [];
  columnChanges = false;
  hasLocalChanges = false;

  constructor(
    public dialogRef: MatDialogRef<DiffDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DiffDialogData
  ) {
    this.calculateDiffs();
  }

  calculateDiffs(): void {
    const currentRules = this.data.currentData.ruleTable.rules;
    const pulledRules = this.data.pulledData.ruleTable.rules;

    const currentRuleMap = new Map(currentRules.map(r => [r.ruleName, r]));
    const pulledRuleMap = new Map(pulledRules.map(r => [r.ruleName, r]));

    pulledRules.forEach(pulledRule => {
      const currentRule = currentRuleMap.get(pulledRule.ruleName);
      if (!currentRule) {
        const diff: RuleDiff = { type: 'added', rule: pulledRule };
        this.diffs.push(diff);
        this.addedRules.push(diff);
      } else if (JSON.stringify(currentRule) !== JSON.stringify(pulledRule)) {
        const diff: RuleDiff = { type: 'modified', rule: pulledRule, currentRule };
        this.diffs.push(diff);
        this.modifiedRules.push(diff);
      }
    });

    currentRules.forEach(currentRule => {
      if (!pulledRuleMap.has(currentRule.ruleName)) {
        const diff: RuleDiff = { type: 'deleted', rule: currentRule };
        this.diffs.push(diff);
        this.deletedRules.push(diff);
      }
    });

    this.columnChanges = JSON.stringify(this.data.currentData.ruleTable.columns) !== 
                        JSON.stringify(this.data.pulledData.ruleTable.columns);

    this.hasLocalChanges = this.diffs.length > 0 || this.columnChanges;
  }

  getDiffIcon(type: string): string {
    switch (type) {
      case 'added': return 'add_circle';
      case 'deleted': return 'remove_circle';
      case 'modified': return 'edit';
      default: return 'check_circle';
    }
  }

  getDiffLabel(type: string): string {
    switch (type) {
      case 'added': return 'Added';
      case 'deleted': return 'Deleted';
      case 'modified': return 'Modified';
      default: return 'Unchanged';
    }
  }

  onAccept(): void {
    const result: DiffDialogResult = { action: 'accept' };
    this.dialogRef.close(result);
  }

  onKeep(): void {
    const result: DiffDialogResult = { action: 'keep' };
    this.dialogRef.close(result);
  }
}
