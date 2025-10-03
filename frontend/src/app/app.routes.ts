import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RuleEditorComponent } from './components/rule-editor/rule-editor.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'editor', component: RuleEditorComponent },
  { path: '**', redirectTo: '' }
];
