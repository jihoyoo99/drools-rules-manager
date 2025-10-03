import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DroolsTableData } from '../models/drools-table.model';
import { RepoInfo } from '../models/git.model';

@Injectable({
  providedIn: 'root'
})
export class RulesDataService {
  private rulesDataSubject = new BehaviorSubject<DroolsTableData | null>(null);
  private repoInfoSubject = new BehaviorSubject<RepoInfo | null>(null);
  private hasUnsavedChangesSubject = new BehaviorSubject<boolean>(false);
  private originalDataSubject = new BehaviorSubject<DroolsTableData | null>(null);

  rulesData$: Observable<DroolsTableData | null> = this.rulesDataSubject.asObservable();
  repoInfo$: Observable<RepoInfo | null> = this.repoInfoSubject.asObservable();
  hasUnsavedChanges$: Observable<boolean> = this.hasUnsavedChangesSubject.asObservable();

  setRulesData(data: DroolsTableData): void {
    this.rulesDataSubject.next(data);
    this.originalDataSubject.next(JSON.parse(JSON.stringify(data)));
    this.hasUnsavedChangesSubject.next(false);
  }

  getRulesData(): DroolsTableData | null {
    return this.rulesDataSubject.value;
  }

  setRepoInfo(info: RepoInfo): void {
    this.repoInfoSubject.next(info);
  }

  getRepoInfo(): RepoInfo | null {
    return this.repoInfoSubject.value;
  }

  markAsChanged(): void {
    this.hasUnsavedChangesSubject.next(true);
  }

  clearUnsavedChanges(): void {
    this.hasUnsavedChangesSubject.next(false);
    const currentData = this.rulesDataSubject.value;
    if (currentData) {
      this.originalDataSubject.next(JSON.parse(JSON.stringify(currentData)));
    }
  }

  hasChanges(): boolean {
    return this.hasUnsavedChangesSubject.value;
  }

  clear(): void {
    this.rulesDataSubject.next(null);
    this.repoInfoSubject.next(null);
    this.hasUnsavedChangesSubject.next(false);
    this.originalDataSubject.next(null);
  }
}
