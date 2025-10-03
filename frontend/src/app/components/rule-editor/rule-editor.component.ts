import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, CellValueChangedEvent, CellStyle } from 'ag-grid-community';
import { Subject, takeUntil } from 'rxjs';

import { RulesDataService } from '../../services/rules-data.service';
import { NotificationService } from '../../services/notification.service';
import { ExcelService } from '../../services/excel.service';
import { DroolsTableData, DroolsColumn } from '../../models/drools-table.model';
import { RepoInfo } from '../../models/git.model';
import { CommitDialogComponent } from '../dialogs/commit-dialog.component';
import { PullRequestDialogComponent } from '../dialogs/pull-request-dialog.component';

@Component({
  selector: 'app-rule-editor',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './rule-editor.component.html',
  styleUrls: ['./rule-editor.component.scss']
})
export class RuleEditorComponent implements OnInit, OnDestroy {
  rulesData: DroolsTableData | null = null;
  repoInfo: RepoInfo | null = null;
  hasUnsavedChanges = false;
  
  columnDefs: ColDef[] = [];
  rowData: any[] = [];
  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 150,
    editable: true,
    resizable: true,
    sortable: true,
    filter: true
  };

  private destroy$ = new Subject<void>();

  constructor(
    private rulesDataService: RulesDataService,
    private notificationService: NotificationService,
    private excelService: ExcelService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.rulesDataService.rulesData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.rulesData = data;
          this.setupGrid(data);
        } else {
          this.router.navigate(['/']);
        }
      });

    this.rulesDataService.repoInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.repoInfo = info;
      });

    this.rulesDataService.hasUnsavedChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasChanges => {
        this.hasUnsavedChanges = hasChanges;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupGrid(data: DroolsTableData): void {
    this.columnDefs = this.buildColumnDefs(data.ruleTable.columns);
    this.rowData = this.buildRowData(data);
  }

  buildColumnDefs(columns: DroolsColumn[]): ColDef[] {
    return columns.map(col => ({
      field: col.id,
      headerName: col.label,
      editable: true,
      cellStyle: (params): CellStyle | null => {
        if (col.type === 'NAME') {
          return { fontWeight: 'bold', backgroundColor: '#f5f5f5' };
        } else if (col.type === 'CONDITION') {
          return { backgroundColor: '#e3f2fd' };
        } else if (col.type === 'ACTION') {
          return { backgroundColor: '#fff3e0' };
        }
        return null;
      }
    }));
  }

  buildRowData(data: DroolsTableData): any[] {
    return data.ruleTable.rules.map(rule => {
      const row: any = {
        _ruleId: rule.id,
        _ruleName: rule.ruleName
      };

      data.ruleTable.columns.forEach(col => {
        if (col.type === 'NAME') {
          row[col.id] = rule.ruleName;
        } else if (col.type === 'CONDITION' && rule.conditions[col.id]) {
          row[col.id] = rule.conditions[col.id].value;
        } else if (col.type === 'ACTION' && rule.actions[col.id]) {
          row[col.id] = rule.actions[col.id].value;
        } else {
          row[col.id] = '';
        }
      });

      return row;
    });
  }

  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    if (!this.rulesData) return;

    const colId = event.column.getId();
    const ruleId = event.data._ruleId;
    const newValue = event.newValue;

    const rule = this.rulesData.ruleTable.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const column = this.rulesData.ruleTable.columns.find(c => c.id === colId);
    if (!column) return;

    if (column.type === 'NAME') {
      rule.ruleName = newValue;
    } else if (column.type === 'CONDITION' && rule.conditions[colId]) {
      rule.conditions[colId].value = newValue;
    } else if (column.type === 'ACTION' && rule.actions[colId]) {
      rule.actions[colId].value = newValue;
    }

    this.rulesDataService.markAsChanged();
    this.notificationService.showInfo('Cell updated');
  }

  openCommitDialog(): void {
    if (!this.rulesData) return;

    const dialogRef = this.dialog.open(CommitDialogComponent, {
      width: '600px',
      data: {
        rulesData: this.rulesData,
        repoInfo: this.repoInfo
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.rulesDataService.clearUnsavedChanges();
      }
    });
  }

  openPullRequestDialog(): void {
    if (!this.repoInfo) {
      this.notificationService.showError('No repository information available');
      return;
    }

    const dialogRef = this.dialog.open(PullRequestDialogComponent, {
      width: '600px',
      data: {
        repoInfo: this.repoInfo
      }
    });
  }

  canCommit(): boolean {
    return this.hasUnsavedChanges && this.rulesData !== null;
  }

  canCreatePR(): boolean {
    return this.repoInfo !== null;
  }

  downloadModifiedFile(): void {
    if (!this.rulesData) return;

    this.notificationService.showInfo('Generating Excel file...');
    
    this.excelService.generateFile(this.rulesData).subscribe({
      next: (response) => {
        const link = document.createElement('a');
        link.href = response.file.downloadUrl;
        link.download = response.file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.rulesDataService.clearUnsavedChanges();
        this.notificationService.showSuccess('File downloaded successfully');
      },
      error: (error) => {
        this.notificationService.showError(`Download failed: ${error.message}`);
      }
    });
  }
}
