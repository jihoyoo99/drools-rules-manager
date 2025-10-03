import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span class="toolbar-title">Drools Rules Manager</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
        <mat-icon>home</mat-icon>
        Home
      </button>
      <button mat-button routerLink="/editor" routerLinkActive="active">
        <mat-icon>edit</mat-icon>
        Editor
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .toolbar-title {
      font-size: 20px;
      font-weight: 500;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    button.active {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    button {
      margin-left: 8px;
    }
  `]
})
export class HeaderComponent {}
