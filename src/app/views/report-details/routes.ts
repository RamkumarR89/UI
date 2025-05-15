import { Routes } from '@angular/router';
import { ReportDetailsComponent } from './report-details.component';

export const routes: Routes = [
  {
    path: '',
    component: ReportDetailsComponent,
    data: {
      title: 'Report Details'
    }
  }
];
