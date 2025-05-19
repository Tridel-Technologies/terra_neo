import { Routes } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { LoginComponent } from './login/login.component';

import { AnalyticsComponent } from './analytics/analytics.component';
import { ReportsComponent } from './reports/reports.component';

import { TestComponent } from './test/test.component';


export const routes: Routes = [
    {
        path:'',
        pathMatch:'full',
        redirectTo:'login'
    },
    {
        path:'login',
        component:TestComponent
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
