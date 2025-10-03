import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, CellValueChangedEvent, CellStyle, GridApi } from 'ag-grid-community';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

import { RulesDataService } from '../../services/rules-data.service';
import { NotificationService } from '../../services/notification.service';
import { ExcelService } from '../../services/excel.service';
import { GitService } from '../../services/git.service';
import { DroolsTableData, DroolsColumn, DroolsRule } from '../../models/drools-table.model';
import { RepoInfo } from '../../models/git.model';
import { CommitDialogComponent } from '../dialogs/commit-dialog.component';
import { PullRequestDialogComponent } from '../dialogs/pull-request-dialog.component';
import { AddColumnDialogComponent, AddColumnDialogData, AddColumnDialogResult } from '../dialogs/add-column-dialog.component';
import { DiffDialogComponent, DiffDialogData, DiffDialogResult } from '../dialogs/diff-dialog.component';
import { PushDialogComponent, PushDialogData, PushDialogResult } from '../dialogs/push-dialog.component';

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
    MatDialogModule,
    AddColumnDialogComponent,
    DiffDialogComponent,
    PushDialogComponent
  ],
  templateUrl: './rule-editor.component.html',
  styleUrls: ['./rule-editor.component.scss']
})
export class RuleEditorComponent implements OnInit, OnDestroy {
  rulesData: DroolsTableData | null = null;
  repoInfo: RepoInfo | null = null;
  hasUnsavedChanges = false;
  hasSavedData = false;
  selectedRowId: string | null = null;
  
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

  private gridApi!: GridApi;
  private destroy$ = new Subject<void>();

  constructor(
    private rulesDataService: RulesDataService,
    private notificationService: NotificationService,
    private excelService: ExcelService,
    private gitService: GitService,
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

    this.rulesDataService.hasSavedData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasSaved => {
        this.hasSavedData = hasSaved;
      });

    this.rulesDataService.checkSavedData();
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
    return columns.map((col, index) => ({
      field: col.id,
      headerName: col.label,
      editable: true,
      checkboxSelection: index === 0,
      headerCheckboxSelection: index === 0,
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
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onSelectionChanged(): void {
    if (!this.gridApi) return;
    const selectedRows = this.gridApi.getSelectedRows();
    this.selectedRowId = selectedRows.length > 0 ? selectedRows[0]._ruleId : null;
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

  addRow(): void {
    if (!this.rulesData) return;

    const nextRowIndex = Math.max(...this.rulesData.ruleTable.rules.map(r => r.rowIndex || 0), 0) + 1;
    const nextId = `rule_${Date.now()}`;
    
    const newRule: DroolsRule = {
      id: nextId,
      rowIndex: nextRowIndex,
      ruleName: `NewRule${nextRowIndex}`,
      conditions: {},
      actions: {}
    };

    this.rulesData.ruleTable.columns.forEach(col => {
      if (col.type === 'CONDITION') {
        newRule.conditions[col.id] = {
          label: col.label,
          patternTemplate: col.patternTemplate,
          value: ''
        };
      } else if (col.type === 'ACTION') {
        newRule.actions[col.id] = {
          label: col.label,
          patternTemplate: col.patternTemplate,
          value: ''
        };
      }
    });

    this.rulesData.ruleTable.rules.push(newRule);
    this.rulesDataService.setRulesData(this.rulesData);
    this.rulesDataService.markAsChanged();
    this.setupGrid(this.rulesData);
    
    this.notificationService.showSuccess('New row added');
  }

  deleteSelectedRow(): void {
    if (!this.rulesData || !this.selectedRowId) {
      this.notificationService.showError('Please select a row to delete');
      return;
    }

    const ruleIndex = this.rulesData.ruleTable.rules.findIndex(r => r.id === this.selectedRowId);
    if (ruleIndex !== -1) {
      this.rulesData.ruleTable.rules.splice(ruleIndex, 1);
      this.rulesDataService.setRulesData(this.rulesData);
      this.rulesDataService.markAsChanged();
      this.setupGrid(this.rulesData);
      this.selectedRowId = null;
      
      this.notificationService.showSuccess('Row deleted');
    }
  }

  openAddColumnDialog(): void {
    if (!this.rulesData) return;

    const dialogData: AddColumnDialogData = {
      existingColumns: this.rulesData.ruleTable.columns
    };

    const dialogRef = this.dialog.open(AddColumnDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: AddColumnDialogResult) => {
      if (result && result.column) {
        this.addColumn(result.column);
      }
    });
  }

  addColumn(newColumn: DroolsColumn): void {
    if (!this.rulesData) return;

    this.rulesData.ruleTable.columns.push(newColumn);

    this.rulesData.ruleTable.rules.forEach(rule => {
      if (newColumn.type === 'CONDITION') {
        rule.conditions[newColumn.id] = {
          label: newColumn.label,
          patternTemplate: newColumn.patternTemplate,
          value: ''
        };
      } else if (newColumn.type === 'ACTION') {
        rule.actions[newColumn.id] = {
          label: newColumn.label,
          patternTemplate: newColumn.patternTemplate,
          value: ''
        };
      }
    });

    this.rulesDataService.setRulesData(this.rulesData);
    this.rulesDataService.markAsChanged();
    this.setupGrid(this.rulesData);
    
    this.notificationService.showSuccess(`Column "${newColumn.label}" added`);
  }

  deleteColumn(): void {
    if (!this.rulesData || this.rulesData.ruleTable.columns.length <= 1) {
      this.notificationService.showError('Cannot delete the last column');
      return;
    }

    const columnToDelete = this.rulesData.ruleTable.columns[this.rulesData.ruleTable.columns.length - 1];
    
    this.rulesData.ruleTable.columns = this.rulesData.ruleTable.columns.filter(
      col => col.id !== columnToDelete.id
    );

    this.rulesData.ruleTable.rules.forEach(rule => {
      delete rule.conditions[columnToDelete.id];
      delete rule.actions[columnToDelete.id];
    });

    this.rulesDataService.setRulesData(this.rulesData);
    this.rulesDataService.markAsChanged();
    this.setupGrid(this.rulesData);
    
    this.notificationService.showSuccess(`Column "${columnToDelete.label}" deleted`);
  }

  async pullFromGit(): Promise<void> {
    if (!this.repoInfo) return;

    try {
      this.notificationService.showInfo('Fetching from Git...');

      const fetchResponse = await firstValueFrom(
        this.gitService.fetchFile({
          repoOwner: this.repoInfo.owner,
          repoName: this.repoInfo.name,
          filePath: this.repoInfo.filePath,
          branch: this.repoInfo.branch,
          token: this.repoInfo.token
        })
      );

      const parseResponse = await firstValueFrom(
        this.excelService.parseFile(fetchResponse.localPath)
      );

      const pulledData = parseResponse.data;

      if (!this.rulesData) {
        this.rulesDataService.setRulesData(pulledData);
        this.notificationService.showSuccess('Data pulled from Git');
        return;
      }

      const dialogData: DiffDialogData = {
        currentData: this.rulesData,
        pulledData: pulledData
      };

      const dialogRef = this.dialog.open(DiffDialogComponent, {
        width: '700px',
        data: dialogData
      });

      dialogRef.afterClosed().subscribe((result: DiffDialogResult) => {
        if (result && result.action === 'accept') {
          this.rulesDataService.setRulesData(pulledData);
          this.rulesDataService.clearUnsavedChanges();
          this.notificationService.showSuccess('Changes accepted from Git');
        } else {
          this.notificationService.showInfo('Kept local changes');
        }
      });
    } catch (error: any) {
      this.notificationService.showError(`Error pulling from Git: ${error.message}`);
    }
  }

  saveLocally(): void {
    this.rulesDataService.saveToLocalStorage();
    this.notificationService.showSuccess('Changes saved locally');
  }

  openPushDialog(): void {
    if (!this.repoInfo) return;

    const dialogData: PushDialogData = {
      repoOwner: this.repoInfo.owner,
      repoName: this.repoInfo.name,
      currentBranch: this.repoInfo.branch
    };

    const dialogRef = this.dialog.open(PushDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: PushDialogResult) => {
      if (result) {
        this.pushChanges(result);
      }
    });
  }

  async pushChanges(pushData: PushDialogResult): Promise<void> {
    if (!this.rulesData || !this.repoInfo || !this.repoInfo.token) return;

    try {
      this.notificationService.showInfo('Generating Excel file...');

      const generateResponse = await firstValueFrom(
        this.excelService.generateFile(this.rulesData)
      );

      const fileContentResponse = await fetch(`http://localhost:3000${generateResponse.file.downloadUrl}`);
      const fileBlob = await fileContentResponse.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Content = (reader.result as string).split(',')[1];

        try {
          this.notificationService.showInfo('Creating PR...');

          const pushResponse = await firstValueFrom(
            this.gitService.pushChanges({
              repoOwner: this.repoInfo!.owner,
              repoName: this.repoInfo!.name,
              filePath: this.repoInfo!.filePath,
              fileContent: base64Content,
              newBranch: pushData.branchName,
              commitMessage: pushData.commitMessage,
              author: {
                name: pushData.authorName,
                email: pushData.authorEmail
              },
              prTitle: pushData.prTitle,
              prDescription: pushData.prDescription,
              targetBranch: pushData.targetBranch,
              token: this.repoInfo!.token!
            })
          );

          this.notificationService.showSuccess(
            `PR #${pushResponse.prNumber} created successfully!`
          );

          this.rulesDataService.clearLocalStorage();
          this.rulesDataService.clearUnsavedChanges();

          window.open(pushResponse.prUrl, '_blank');
        } catch (error: any) {
          this.notificationService.showError(`Error pushing changes: ${error.message}`);
        }
      };

      reader.readAsDataURL(fileBlob);
    } catch (error: any) {
      this.notificationService.showError(`Error generating file: ${error.message}`);
    }
  }
}
