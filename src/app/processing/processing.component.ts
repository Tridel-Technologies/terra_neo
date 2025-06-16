import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { GlobalConfig } from '../global/app.global';

interface Files {
  id: number;
  file_name: string;
  timestamp: string;
}
@Component({
  selector: 'app-processing',
  imports: [HttpClientModule, CommonModule, DashboardComponent],
  templateUrl: './processing.component.html',
  styleUrl: './processing.component.css',
})
export class ProcessingComponent implements OnInit {
  files_list: Files[] = [];

  private baseUrl: string;
  constructor(private http: HttpClient) {
    this.baseUrl = new GlobalConfig().baseUrl;
  }

  fetch_file_data(index: number) {}
  ngOnInit(): void {
    this.http
      .get(`${this.baseUrl}get_files`)
      .subscribe((response: any) => {
        this.files_list = response['data'];
        console.log('files:', response, this.files_list);
      });
  }
}
