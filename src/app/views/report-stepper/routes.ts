import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./report-stepper.component').then(m => m.ReportStepperComponent),    data: {
      title: 'Report Stepper'
    }
  }
];
