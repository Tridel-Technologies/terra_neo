import { Routes } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { ReportsComponent } from './reports/reports.component';

export const routes: Routes = [
    {
        path:'',
        pathMatch:'full',
        redirectTo:'base'
    },
    {
        path:'base',
        component:BaseComponent
    },
    {
      path: 'reports',
      component: ReportsComponent,
    },
    {
      path: 'analytics',
      component: AnalyticsComponent,
    },
];
