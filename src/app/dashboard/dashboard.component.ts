import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BatteryComponent } from './battery/battery.component';
import { tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { UnitService, UnitSettings } from '../settings/unit.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Direction1Component } from "../widget/direction1/direction1.component";

interface Files {
  folder_id: number,
  files: fileData[],
  folder_name:string,
  timestamp: string
}
interface fileData{
  file_id:number,
  file_name:string
}
interface dashdata{
  id:string,
  tide:string,
  dateTime:string,
  // time:string,
  depth:string,
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
  imports: [HttpClientModule, CommonModule, BatteryComponent, FormsModule, ToggleSwitchModule, Direction1Component],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  expandedFolders: boolean[] = [];
  opened_file!:string;
  openedFolder!:number;
  selectedFiles: any[] = [];  // Array to track selected files
  isMulti:boolean = true;
  main_table:any[] = [];
  current_hours_data:any[] = [];
  files_list: Files[] = [];
  selected_folder_name!:string;
  selected_data!:dashdata;
  before_data!:any[];
  after_data!:any[];
  isLive:boolean = true;
  bf_tide!:number;
  af_tide!:number;
  bf_c_speed!:number;
  af_c_speed!:number;
  bf_c_dir!:number;
  af_c_dir!:number;
high_watel_level:any[]=[]
isbefore:boolean = true;
currentData!:any;
dir:boolean = false;
  constructor(private http:HttpClient, private toast:ToastrService, private unitSerive:UnitService){}

    // Units
  units: UnitSettings = {
    waterLevel: '',
    currentSpeed: '',
    currentDirection: '',
    battery: '',
    depth: ''
  };

  toggle_tap() {
    // try {
      const filter = this.main_table.filter(item => item.high_water_level === 1);
      console.log(filter);
  
      let bf: any[] = [];
      let af: any[] = [];
      this.currentData = filter[0];
      console.log("current", this.currentData)
      if (filter.length > 0) {
        const targetDateTime = new Date(filter[0].date);
        // this.high_watel_level = filter[0]
        for (let i = 1; i <= 6; i++) {
          const beforeHour = new Date(targetDateTime);
          beforeHour.setHours(beforeHour.getHours() - i, 0, 0, 0); // exact hour
  
          const afterHour = new Date(targetDateTime);
          afterHour.setHours(afterHour.getHours() + i, 0, 0, 0);
  
          const beforeHourData = this.main_table.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === beforeHour.getFullYear() &&
                   itemDate.getMonth() === beforeHour.getMonth() &&
                   itemDate.getDate() === beforeHour.getDate() &&
                   itemDate.getHours() === beforeHour.getHours();
          });
  
          const afterHourData = this.main_table.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === afterHour.getFullYear() &&
                   itemDate.getMonth() === afterHour.getMonth() &&
                   itemDate.getDate() === afterHour.getDate() &&
                   itemDate.getHours() === afterHour.getHours();
          });
  
          bf.push([...beforeHourData]);
          af.push([...afterHourData]);
          // for (let index = 0; index < bf.length; index++) {
          //   this.avgData.push({
          //     name:bf[index].
          //   })
          // }
        }
  
        console.log("Before 6 hours (all intervals):", bf);
        console.log("After 6 hours (all intervals):", af);
  
        this.current_hours_data = []; // clear before pushing again
        this.current_hours_data.push(bf);
        this.current_hours_data.push(af);
        console.log("filter", filter)
        const data = {
          id: filter[0].station_id,
        tide: filter[0].pressure,
        dateTime: filter[0].date,
        battery: filter[0].battery,
        depth:filter[0].depth,
        current_speed: filter[0].speed,
        current_direction: filter[0].direction,
        lat: filter[0].lat,
        lon: filter[0].lon,
        current_speed_b_6: bf[0]?.speed,
        current_dir_b_6: bf[0]?.direction,
        current_speed_after_6: af[0]?.speed,
        current_dir_after_6: af[0]?.direction,
          // You can add summaries or latest values from bf[bf.length-1] or af[0] here if needed
        };
  
        this.selected_data = data;
        this.isLive = !this.isLive;
        const bfMatches = this.filterByHour(bf[0]);
        const afMatches = this.filterByHour(af[0]);
        // const avgSpeed = this.getAverageSpeed(bfMatches, 'speed');
        this.before_data = bf;
        this.after_data = af;
        // const numm = this.get_value_for_widget(1, 'speed','before');
        console.log("matches",this.before_data, this.after_data)
        this.__assign()
      }else{
        this.toast.error("This file has no high_water_level data. Please edit in the process page.", 'Error');
      }
    // } catch (error) {
    //   this.toast.error("This file has no high_water_level data. Please edit in the process page.", 'Error');
    // }
  }

  timee: number = 6;
  changeTime(index: number) {
    this.hours = index;
    // this.__assign();
    console.log("Selected time:", this.timee);
    this.__assign()

  }
hours:number = 5;
  __assign(){
    // this.bf_tide = this.get_value_for_widget(this.timee - 1, 'pressure', 'before');
    // this.af_tide = this.get_value_for_widget(this.timee - 1, 'pressure', 'after');
    // this.bf_c_speed = this.get_value_for_widget(this.timee - 1, 'speed', 'before');
    // this.af_c_speed = this.get_value_for_widget(this.timee - 1, 'speed', 'after');
    // this.bf_c_dir = this.get_value_for_widget(this.timee - 1, 'direction', 'before');
    // this.af_c_dir = this.get_value_for_widget(this.timee - 1, 'direction', 'after');
    this.avgData = []; // clear existing data

for (let i = 6; i >= 1; i--) {
  const entries = this.before_data[6 - i] || []; // fallback to empty array
  console.log("entry", entries);
  const avg = this.ccalculateAverage(entries);

  this.avgData.push({
    name: `${i} hour${i > 1 ? 's' : ''} before`,
    tide: avg.pressure.toFixed(2),
    speed: avg.speed.toFixed(2),
    direction: avg.direction.toFixed(2),
  });
}

this.avgData.push({
  name: 'Current',
  tide: this.currentData.pressure?.toString() || 'N/A',
  speed: this.currentData.speed?.toString() || 'N/A',
  direction: this.currentData.direction?.toString() || 'N/A',
});

for (let i = 1; i <= 6; i++) {
  const entries = this.after_data[i - 1] || [];
  const avg = this.ccalculateAverage(entries);
  this.avgData.push({
    name: `${i} hour${i > 1 ? 's' : ''} after`,
    tide: avg.pressure.toFixed(2),
    speed: avg.speed.toFixed(2),
    direction: avg.direction.toFixed(2),
  });
}

console.log("avg",this.avgData)
  }

  // get_value_for_widget(index:number, param:string, period:string):number{
  //   const bfMatches = period ==='after'? this.filterByHour(this.after_data[index]) :this.filterByHour(this.before_data[index]);
  //   return this.getAverageSpeed(bfMatches, param);
  // }


  get dynamicHeight(): number {
  const items = this.filteredAvgData.length;
  return items > 0 ? 95 / items : 13; // Divide full height by number of items
}
get filteredAvgData() {
  const total = 6+ Number(this.hours)+1;
  console.log("hours selected", this.hours, total)
  
  const data = this.isbefore
    ? this.avgData.slice(6 - this.hours, 7)
    : this.avgData.slice(6, total);

    console.log("filteres", data)
  return data
}

get slicedAvgData() {
  return this.isbefore ? this.avgData.slice(0, this.hours + 1) : this.avgData.slice(6, 6 + this.hours + 1);
}



ccalculateAverage(entries: any[] = []): { pressure: number, speed: number, direction: number } {
  if (!Array.isArray(entries)) {
    entries = [];
  }
  console.log("inside entry", entries);
  let totalPressure = 0, totalSpeed = 0, totalDirection = 0;
  let count = entries.length;

  for (let entry of entries) {
    totalPressure += parseFloat(entry?.pressure) ?? 0;
    totalSpeed += parseFloat(entry?.speed) ?? 0;
    totalDirection +=  parseFloat(entry?.direction) ?? 0;
  }

  return {
    pressure: count ? totalPressure / count : 0,
    speed: count ? totalSpeed / count : 0,
    direction: count ? totalDirection / count : 0
  };
}


  
  filterByHour(dataArray: any[]): any[] {
    const date = dataArray[0].date;
    const targetDate = new Date(date);
  
    return dataArray.filter(item => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getFullYear() === targetDate.getFullYear() &&
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getDate() === targetDate.getDate() &&
        itemDate.getHours() === targetDate.getHours()
      );
    });
  }
  
  

  tap_date(date: string, time: string) {
    console.log('started ', date, time);
    const filter = this.main_table.filter(
      (item) => item.date === date && item.time === time
    );
    console.log(filter);
    const data = {
      id:filter[0].station_id,
      tide:filter[0].pressure,
      dateTime:filter[0].date,
      // time:filter[0].time,
      depth:filter[0].depth,
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
      this.dir = false;
    console.log("selected",this.selected_data)
   this.directionTo= this.directionValue(parseFloat(this.selected_data.current_direction))
   setTimeout(() => {
    this.dir = true;
   }, 100);
    // this.dir=true;
  }
  directionTo!:string;
  directionValue(degrees: number): string {
      degrees = degrees % 360;
      if (degrees < 0) degrees += 360;
      if (degrees >= 348.75 || degrees < 11.25) {
        return 'N';   // North
      } else if (degrees >= 11.25 && degrees < 33.75) {
        return 'NNE'; // North-Northeast
      } else if (degrees >= 33.75 && degrees < 56.25) {
        return 'NE';  // Northeast
      } else if (degrees >= 56.25 && degrees < 78.75) {
        return 'ENE'; // East-Northeast
      } else if (degrees >= 78.75 && degrees < 101.25) {
        return 'E';   // East
      } else if (degrees >= 101.25 && degrees < 123.75) {
        return 'ESE'; // East-Southeast
      } else if (degrees >= 123.75 && degrees < 146.25) {
        return 'SE';  // Southeast
      } else if (degrees >= 146.25 && degrees < 168.75) {
        return 'SSE'; // South-Southeast
      } else if (degrees >= 168.75 && degrees < 191.25) {
        return 'S';   // South
      } else if (degrees >= 191.25 && degrees < 213.75) {
        return 'SSW'; // South-Southwest
      } else if (degrees >= 213.75 && degrees < 236.25) {
        return 'SW';  // Southwest
      } else if (degrees >= 236.25 && degrees < 258.75) {
        return 'WSW'; // West-Southwest
      } else if (degrees >= 258.75 && degrees < 281.25) {
        return 'W';   // West
      } else if (degrees >= 281.25 && degrees < 303.75) {
        return 'WNW'; // West-Northwest
      } else if (degrees >= 303.75 && degrees < 326.25) {
        return 'NW';  // Northwest
      } else {
        return 'NNW'; // North-Northwest
      }
    }

  Array_item:number[]=[1,2, 3, 4, 5,3 , 6, 7,8 , 8,9  ,9,10 ,];
  ngOnInit(): void {
    this.files_list = [];
    this.http.get('http://localhost:3000/api/files').subscribe(
      (response: any) => {
        console.log("resposnse==", response)
        this.files_list = response['data'];
        console.log('files:', response, this.files_list);
        this.expandedFolders = this.files_list.map(() => false);
        if (this.files_list.length!== 0 && this.files_list[0].files.length !== 0) {
          const firstFolder = this.files_list[0];
          const firstFile = firstFolder.files[0].file_name;
  
          // Set folder as opened
          this.expandedFolders[0] = true;
          this.openedFolder = firstFolder.folder_id;
          this.selected_folder_name = firstFolder.folder_name;

          // Select file
          this.selectedFiles = [{
            file_name: firstFile,
            file_id: firstFolder.files[0].file_id
          }];
          this.opened_file = firstFile;

          // Fetch data for the file
          this.open_file(firstFile, firstFolder.files[0].file_id);
        }

        
      }
    );

        // Units
    this.unitSerive.units$.subscribe((u) => {
      this.units = u;
    });
 
  }
  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
  }
  toggleFileSelection(fileName: string, event: MouseEvent, file_id:number, folder_name:string) {
    // this.dir = false;
    console.log(fileName, file_id);
    this.selected_folder_name = folder_name;
    this.isLive = true;
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
    this.selectedFiles = [
      {
        file_name: fileName,
        file_id: file_id,
      },
    ]; // Only keep the clicked file selected
    this.open_file(fileName, file_id);

    // }
  }

  getFileImage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'csv':
        return '../../assets/csv.png'; // Path to CSV image
      case 'xlsx':
        return '../../assets/xl.png'; // Path to Excel image
      default:
        return 'assets/file.png'; // Default file image
    }
  }
  open_file(file_name:string, file_id:number){
    console.log("h")
    this.opened_file = file_name;
    const data = {
      folder_id: file_id,
      file_name: file_name,
    };
    console.log(data);
    this.http.get(`http://localhost:3000/api/fetch_data_by_file/${file_id}`).subscribe(
      (response:any)=>{
        console.log("response", response);
        if(this.isMulti){
          let data = this.main_table;
          this.main_table = [];
          setTimeout(() => {
            this.main_table = data;
            for (let index = 0; index < response.length; index++) {
              this.main_table.push(response[index]);
            }
            console.log(this.main_table);
            this.tap_date(this.main_table[0].date, this.main_table[0].time);
          }, 100);
        } else {
          this.main_table = [];
          setTimeout(() => {
            this.main_table = response;
          }, 100);
        }
      });
  }
  getFileClass(fileName: string, file_id: number): string {
    // Check if file is selected based on both file_name and file_id
    const isSelected = this.selectedFiles.some(
      (file) => file.file_name === fileName && file.file_id === file_id
    );
    return isSelected ? 'file-item_active' : 'file-item';
  // }
}

avgData:any[]=[
  { "name": "6 hours before1", "tide": "1.2", "speed": "3.4", "direction": "234" },
  { "name": "5 hours before", "tide": "1.4", "speed": "3.1", "direction": "240" },
  { "name": "4 hours before", "tide": "1.6", "speed": "3.6", "direction": "245" },
  { "name": "3 hours before", "tide": "1.8", "speed": "3.2", "direction": "250" },
  { "name": "2 hours before", "tide": "2.0", "speed": "3.0", "direction": "255" },
  { "name": "1 hour before", "tide": "2.2", "speed": "3.5", "direction": "260" },
  { "name": "Current",          "tide": "2.5", "speed": "3.8", "direction": "265" },
  { "name": "1 hour after",     "tide": "2.4", "speed": "3.7", "direction": "270" },
  { "name": "2 hours after",    "tide": "2.1", "speed": "3.3", "direction": "275" },
  { "name": "3 hours after",    "tide": "1.9", "speed": "3.1", "direction": "280" },
  { "name": "4 hours after",    "tide": "1.7", "speed": "3.2", "direction": "285" },
  { "name": "5 hours after",    "tide": "1.5", "speed": "3.0", "direction": "290" },
  { "name": "6 hours after",    "tide": "N/A", "speed": "N/A", "direction": "N/A" }
]

}
