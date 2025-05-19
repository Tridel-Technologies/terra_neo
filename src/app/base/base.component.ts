import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { ImporterComponent } from "../importer/importer.component";
import { ProcessingComponent } from "../processing/processing.component";
import { DashboardComponent } from "../dashboard/dashboard.component";
import { SettingsComponent } from "../settings/settings.component";
import { ReportsComponent } from '../reports/reports.component';
import { AnalyticsComponent } from '../analytics/analytics.component';


@Component({
  selector: 'app-base',
  standalone:true,
  imports: [CommonModule, HeaderComponent, ImporterComponent, ProcessingComponent, DashboardComponent, SettingsComponent, ReportsComponent, AnalyticsComponent],
  templateUrl: './base.component.html',
  styleUrl: './base.component.css',
})
export class BaseComponent {
  index: number = 0;
  chartFont:string = 'light';
}
