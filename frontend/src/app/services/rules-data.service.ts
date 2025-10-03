import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DroolsTableData } from '../models/drools-table.model';
import { RepoInfo } from '../models/git.model';

interface SavedState {
  rulesData: DroolsTableData;
  repoInfo: RepoInfo;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class RulesDataService {
  private rulesDataSubject = new BehaviorSubject<DroolsTableData | null>(null);
  private repoInfoSubject = new BehaviorSubject<RepoInfo | null>(null);
  private hasUnsavedChangesSubject = new BehaviorSubject<boolean>(false);
  private originalDataSubject = new BehaviorSubject<DroolsTableData | null>(null);
  private hasSavedDataSubject = new BehaviorSubject<boolean>(false);

  rulesData$: Observable<DroolsTableData | null> = this.rulesDataSubject.asObservable();
  repoInfo$: Observable<RepoInfo | null> = this.repoInfoSubject.asObservable();
  hasUnsavedChanges$: Observable<boolean> = this.hasUnsavedChangesSubject.asObservable();
  hasSavedData$: Observable<boolean> = this.hasSavedDataSubject.asObservable();

  private readonly STORAGE_KEY = 'drools-rules-local-save';

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
    this.hasSavedDataSubject.next(false);
  }

  saveToLocalStorage(): void {
    const currentData = this.rulesDataSubject.value;
    const currentRepo = this.repoInfoSubject.value;
    
    if (currentData && currentRepo) {
      const savedState: SavedState = {
        rulesData: currentData,
        repoInfo: currentRepo,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedState));
      this.hasSavedDataSubject.next(true);
    }
  }

  loadFromLocalStorage(): SavedState | null {
    const savedStr = localStorage.getItem(this.STORAGE_KEY);
    if (savedStr) {
      try {
        return JSON.parse(savedStr) as SavedState;
      } catch (e) {
        console.error('Failed to parse saved state', e);
        return null;
      }
    }
    return null;
  }

  clearLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.hasSavedDataSubject.next(false);
  }

  checkSavedData(): void {
    const saved = this.loadFromLocalStorage();
    this.hasSavedDataSubject.next(!!saved);
  }
}
