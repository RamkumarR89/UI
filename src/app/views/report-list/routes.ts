import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./report-list.component').then(m => m.ReportListComponent),
    data: {
      title: 'Report List'
    }
  }
];
