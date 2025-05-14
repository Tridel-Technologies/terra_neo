import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BatteryComponent } from "./battery/battery.component";
import { tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UnitService, UnitSettings } from '../settings/unit.service';

interface Files {
  id: number,
  files: string[],
  folder_name:string,
  timestamp: string
}
interface dashdata{
  id:string,
  tide:string,
  date:string,
  time:string,
  battery:string,
  current_speed:string,
  current_direction:string,
  current_speed_b_6:string,
  current_dir_b_6:string,
  current_speed_after_6:string,
  current_dir_after_6:string,
  lat:string,
  lon:string,

}

@Component({
  selector: 'app-dashboard',
  imports: [HttpClientModule, CommonModule, BatteryComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  expandedFolders: boolean[] = [];
  opened_file!:string;
  openedFolder!:number;
  selectedFiles: any[] = [];  // Array to track selected files
  isMulti:boolean = true;
  main_table:any[] = [];
  files_list: Files[] = [];
  selected_folder_name!:string;
  selected_data!:dashdata;
  isLive:boolean = true;
  constructor(private http:HttpClient, private toast:ToastrService, private unitService: UnitService){}

  // Units
  units: UnitSettings = {
    waterLevel: '',
    currentSpeed: '',
    currentDirection: '',
    battery: ''
  };

  toggle_tap(){
    try {
      const filter = this.main_table.filter(item=> item.high_water_level === 1);
    console.log(filter);
    let bf = [];
    let af = []
    if (filter.length > 0) {
      const targetDateTime = new Date(`${filter[0].date.substring(0, 10)}T${filter[0].time}`);
      const sixHoursInMs = 6 * 60 * 60 * 1000;
    
      // Data before 6 hours
      const beforeSixHours = this.main_table.filter(item => {
        const itemDateTime = new Date(`${item.date.substring(0, 10)}T${item.time}`);
        return itemDateTime.getTime() < targetDateTime.getTime() - sixHoursInMs;
      });
    
      // Data after 6 hours
      const afterSixHours = this.main_table.filter(item => {
        const itemDateTime = new Date(`${item.date.substring(0, 10)}T${item.time}`);
        return itemDateTime.getTime() > targetDateTime.getTime() + sixHoursInMs;
      });
    
      console.log('Before 6 hours:', beforeSixHours);
      console.log('After 6 hours:', afterSixHours);
      bf = beforeSixHours;
      af = afterSixHours
    }
    const data = {
      id:filter[0].station_id,
      tide:filter[0].pressure,
      date:filter[0].date,
      time:filter[0].time,
      battery:filter[0].battery,
      current_speed:filter[0].speed,
      current_direction:filter[0].direction,
      lat:filter[0].lat,
      lon:filter[0].lon,
      current_speed_b_6: bf[0].speed,
      current_dir_b_6:bf[0].direction,
      current_speed_after_6:af[0].speed,
      current_dir_after_6:af[0].direction
    }
    this.selected_data = data;
    console.log("selected",this.selected_data)
    this.isLive = !this.isLive
    } catch (error) {
        this.toast.error("This file has no high_water_level data please edit in process page", 'Error');
    }
    
  }

  tap_date(date:string, time:string){
    console.log("started ", date, time);
    const filter = this.main_table.filter(item=> item.date === date && item.time === time);
    console.log(filter);
    const data = {
      id:filter[0].station_id,
      tide:filter[0].pressure,
      date:filter[0].date,
      time:filter[0].time,
      battery:filter[0].battery,
      current_speed:filter[0].speed,
      current_direction:filter[0].direction,
      lat:filter[0].lat,
      lon:filter[0].lon,
      current_speed_b_6:'',
      current_dir_b_6:'',
      current_speed_after_6:'',
      current_dir_after_6:''
    }
    this.selected_data = data;
    console.log("selected",this.selected_data)
  }
  ngOnInit(): void {
    this.files_list = [];
    this.http.get('http://localhost:3000/api/get_files').subscribe(
      (response: any) => {
        this.files_list = response['data'];
        console.log('files:', response, this.files_list);
        this.expandedFolders = this.files_list.map(() => false);
        if (this.files_list.length > 0 && this.files_list[0].files.length > 0) {
          const firstFolder = this.files_list[0];
          const firstFile = firstFolder.files[0];
  
          // Set folder as opened
          this.expandedFolders[0] = true;
          this.openedFolder = firstFolder.id;
          this.selected_folder_name = firstFolder.folder_name;
  
          // Select file
          this.selectedFiles = [{
            file_name: firstFile,
            file_id: firstFolder.id
          }];
          this.opened_file = firstFile;
  
          // Fetch data for the file
          this.open_file(firstFile, firstFolder.id);
        }

        
      }
    );

    // Units
    this.unitService.units$.subscribe((u) => {
      this.units = u;
    });

  }
  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
  }
  toggleFileSelection(fileName: string, event: MouseEvent, file_id:number, folder_name:string) {
    console.log(fileName, file_id);
    this.selected_folder_name = folder_name
    // const isCtrlPressed = event.ctrlKey || event.metaKey; // Detect if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
    
    // if (isCtrlPressed) {
    //   this.isMulti = true;
    //   // If Ctrl/Cmd is pressed, toggle file selection
    //   const index = this.selectedFiles.indexOf(fileName);
    //   if (index === -1) {
    //     this.selectedFiles.push({
    //       file_name: fileName,
    //       file_id:file_id
    //     });  // Add file to selection
    //     console.log(this.selectedFiles)
    //     this.open_file(fileName, file_id)
    //   } else {
    //     this.selectedFiles.splice(index, 1);  // Remove file from selection
    //   }
    // } else {
      this.isMulti = false;
      // If Ctrl/Cmd is not pressed, select this file and deselect all others
      this.selectedFiles = [{
        file_name: fileName,
        file_id:file_id
      }];  // Only keep the clicked file selected
      this.open_file(fileName, file_id)
      
    // }
  }

  getFileImage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
  
    switch (extension) {
      case 'csv':
        return '../../assets/csv.png';  // Path to CSV image
      case 'xlsx':
        return '../../assets/xl.png'; // Path to Excel image
      default:
        return 'assets/file.png'; // Default file image
    }
  }
  open_file(file_name:string, file_id:number){
    this.opened_file = file_name;
    const data ={
      folder_id:file_id,
      file_name:file_name
    }
    console.log(data);
    this.http.get(`http://localhost:3000/api/fetch_data_by_file/${this.openedFolder}/${file_name}`).subscribe(
      (response:any)=>{
        console.log("response", response);
        if(this.isMulti){
          let data = this.main_table;
          this.main_table = [];
          setTimeout(() => {
            this.main_table = data;
            for (let index = 0; index < response.length; index++) {
              this.main_table.push(response[index])
            }
            console.log(this.main_table)
            this.tap_date(this.main_table[0].date, this.main_table[0].time)
          }, 100);
        }else{
          this.main_table = [];
          setTimeout(() => {
            this.main_table = response
          }, 100);
        }
      }
    )
  }
  getFileClass(fileName: string, file_id: number): string {
    // Check if file is selected based on both file_name and file_id
    const isSelected = this.selectedFiles.some(file => file.file_name === fileName && file.file_id === file_id);
    return isSelected ? 'file-item_active' : 'file-item';
  // }
}
}
