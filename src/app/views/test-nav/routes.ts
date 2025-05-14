import { Routes } from '@angular/router';
import { TestNavComponent } from './test-nav.component';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Test Navigation'
    },
    component: TestNavComponent
  }
];
