import { CommonModule } from '@angular/common';
import { Component, EventEmitter } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { ImporterComponent } from '../importer/importer.component';
import { ProcessingComponent } from '../processing/processing.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SettingsComponent } from '../settings/settings.component';
import { ReportsComponent } from '../reports/reports.component';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { AuthGuard } from '../auth.guard';
import { HttpClientModule } from '@angular/common/http';
import { MessageModule } from 'primeng/message';
import { signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GlobalConfig } from '../global/app.global';
import { Router } from '@angular/router';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ImporterComponent,
    ProcessingComponent,
    DashboardComponent,
    SettingsComponent,
    ReportsComponent,
    AnalyticsComponent,
    MessageModule,
  ],
  templateUrl: './base.component.html',
  styleUrl: './base.component.css',
  providers: [HttpClientModule, HttpClient],
})
export class BaseComponent {
  index: number = 0;
  chartFont: string = 'light';
  fileId: number | undefined;
  licenseExpired: boolean = false;
  remainingDays: number = 0;
  baseUrl: string;
  timezone: string = 'UTC';
  constructor(private http: HttpClient, private router: Router) {
    this.baseUrl = new GlobalConfig().baseUrl;
  }

  dir_enable: boolean = false;
  dirEnableChange = new EventEmitter<boolean>();

  setDirEnable(value: boolean) {
    this.dir_enable = value;
    this.dirEnableChange.emit(value);
  }

  ngOnInit() {
    this.http.get(`${this.baseUrl}check`).subscribe((response: any) => {
      this.remainingDays = response.result.pendingDays;
      if (this.remainingDays == 0) {
        this.licenseExpired = true;
        alert('Your license has expired. Application access is restricted.');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
        return;
      }
      if (this.remainingDays < 8) {
        this.licenseExpired = true;
      } else {
        this.licenseExpired = false;
      }
    });
  }
}
