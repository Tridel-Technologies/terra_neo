import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DashboardComponent } from "../dashboard/dashboard.component";
interface Files{
  id:number,
  file_name:string,
  timestamp:string
}
@Component({
  selector: 'app-processing',
  imports: [HttpClientModule, CommonModule, DashboardComponent],
  templateUrl: './processing.component.html',
  styleUrl: './processing.component.css'
})
export class ProcessingComponent implements OnInit{
  files_list:Files[] = []

  constructor(private http:HttpClient){}

  fetch_file_data(index:number){

  }
  ngOnInit(): void {
      this.http.get('http://localhost:3000/api/get_files').subscribe(
        (response:any)=>{
          this.files_list = response['data'];
          console.log("files:", response, this.files_list);
        }
      )
  }
}
