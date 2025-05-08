import { Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics/analytics.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'analytics',
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
  },
  {
    path: '**',
    redirectTo: 'analytics',
  },
];
