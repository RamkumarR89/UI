import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./report-details.component').then(m => m.ReportDetailsComponent),
    data: {
      title: 'Report Details'
    }
  }
];
