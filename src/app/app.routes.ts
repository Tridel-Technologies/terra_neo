import { Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics/analytics.component';
import { ReportsComponent } from './reports/reports.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'reports',
  },
  {
    path: 'reports',
    component: ReportsComponent,
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
  },
  {
    path: '**',
    redirectTo: 'reports',
  },
];
