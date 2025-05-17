import { Routes } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
    {
        path:'',
        pathMatch:'full',
        redirectTo:'base'
    },
    {
        path:'base',
        component:BaseComponent,
            canActivate: [AuthGuard],
    children: [
  
    ]
    },
    
];
