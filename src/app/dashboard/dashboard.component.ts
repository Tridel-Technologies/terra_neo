import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, Input } from '@angular/core';
import { BatteryComponent } from './battery/battery.component';
import { tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { UnitService, UnitSettings } from '../settings/unit.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Direction1Component } from '../widget/direction1/direction1.component';
import { GlobalConfig } from '../global/app.global';
import { BaseComponent } from '../base/base.component';
import { ChangeDetectorRef } from '@angular/core';
import { AwacDataModel } from './dash_model.model';


interface Files {
  folder_id: number;
  files: fileData[];
  folder_name: string;
  timestamp: string;
}
interface fileData {
  file_id: number;
  file_name: string;
  is_processed: boolean;
  battery_unit_to: string;
  coord_unit_to: string;
  current_direction_unit_to: string;
  current_speed_unit_to: string;
  depth_unit_to: string;
  water_level_unit_to: string;
  type:string
}
interface dashdata {
  id: string;
  tide: string;
  dateTime: string;
  depth: string;
  battery: string;
  current_speed: string;
  current_direction: string;
  current_speed_b_6: string;
  current_dir_b_6: string;
  current_speed_after_6: string;
  current_dir_after_6: string;
  lat: string;
  lon: string;
}

export interface HighWaterTime {
  rank: number;
  datetime: string;
  water_level: number;
  dateFormatted: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    HttpClientModule,
    CommonModule,
    BatteryComponent,
    FormsModule,
    ToggleSwitchModule,
    Direction1Component,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [GlobalConfig],
})
export class DashboardComponent implements OnInit {
  @Input() dir: boolean = false;
  expandedFolders: boolean[] = [];
  opened_file!: string;
  openedFolder!: number;
  selectedFiles: any[] = [];
  isMulti: boolean = true;
  main_table: any[] = [];
  current_hours_data: any[] = [];
  files_list: Files[] = [];
  selected_folder_name!: string;
  selected_data!: dashdata;
  before_data!: any[];
  after_data!: any[];
  isLive: boolean = true;
  bf_tide!: number;
  af_tide!: number;
  bf_c_speed!: number;
  af_c_speed!: number;
  bf_c_dir!: number;
  af_c_dir!: number;
  high_watel_level: any[] = [];
  isbefore: boolean = true;
  currentData!: any;
  @Input() enableDir: boolean = false;
  latutude!: string;
  longitude!: string;
  private baseUrl: string;
  dateFormat!: string;

  // High Water Times properties
  highWaterTimes: HighWaterTime[] = [];
  selectedHighWaterTime: HighWaterTime | null = null;


  // awac variables
  isAwac:boolean = false;


  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    private unitSerive: UnitService,
    private globe: BaseComponent,
    private globall: GlobalConfig,
    private cdr: ChangeDetectorRef
  ) {
    this.baseUrl = new GlobalConfig().baseUrl;
  }

  units: UnitSettings = {
    waterLevel: '',
    currentSpeed: '',
    currentDirection: '',
    battery: '',
    depth: '',
    latandlong: '',
    datetime: '',
  };

  truncate(value: string | number): number {
    return Math.floor(parseFloat(value as string));
  }
  parseFloat(value: any): number {
    return parseFloat(value);
  }

  /**
   * Find top 6 high water times from tide data
   * Ensures they are at least 6 hours apart
   */
  /**
 * Find top 6 high water times (local maxima)
 * from the full dataset across all dates
 */
  getTop3HighAndLowWaterTimes(): { high: HighWaterTime[]; low: HighWaterTime[] } {
    if (!this.main_table || this.main_table.length === 0) {
      return { high: [], low: [] };
    }
  
    const validData = this.main_table
      .map((d) => ({
        datetime: d.date,
        water_level: parseFloat(d.pressure),
      }))
      .filter((d) => !isNaN(d.water_level));
  
    if (validData.length < 3) {
      console.warn('Not enough valid tide data to find 3 highs and 3 lows');
      return { high: [], low: [] };
    }
  
    const highs: HighWaterTime[] = [];
    const lows: HighWaterTime[] = [];
    const neighborhood = 4; // check 4 points before and after
  
    for (let i = neighborhood; i < validData.length - neighborhood; i++) {
      const curr = validData[i].water_level;
  
      // Check if this is a high tide
      let isHigh = true;
      for (let j = i - neighborhood; j <= i + neighborhood; j++) {
        if (j === i) continue;
        if (validData[j].water_level >= curr) {
          isHigh = false;
          break;
        }
      }
      if (isHigh) {
        highs.push({
          rank: 0,
          datetime: validData[i].datetime,
          water_level: curr,
          dateFormatted: this.formatHighWaterTimeDisplay(validData[i].datetime),
        });
      }
  
      // Check if this is a low tide
      let isLow = true;
      for (let j = i - neighborhood; j <= i + neighborhood; j++) {
        if (j === i) continue;
        if (validData[j].water_level <= curr) {
          isLow = false;
          break;
        }
      }
      if (isLow) {
        lows.push({
          rank: 0,
          datetime: validData[i].datetime,
          water_level: curr,
          dateFormatted: this.formatHighWaterTimeDisplay(validData[i].datetime),
        });
      }
    }
  
    // Pick top 3 highs and lows by water level
    const topHighs = highs
      .sort((a, b) => b.water_level - a.water_level)
      .slice(0, 3)
      .map((d, i) => ({ ...d, rank: i + 1 }));
  
    const topLows = lows
      .sort((a, b) => a.water_level - b.water_level)
      .slice(0, 3)
      .map((d, i) => ({ ...d, rank: i + 1 }));
  
    return { high: topHighs, low: topLows };
  }
  
  
  

  /**
   * Format high water time for dropdown display
   */
  formatHighWaterTimeDisplay(datetime: string): string {
    const date = new Date(datetime);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${day} ${month} at ${time}`;
  }

  /**
   * Handle high water time selection change
   */
  onHighWaterTimeChange() {
    if (this.selectedHighWaterTime) {
      this.processHighWaterTimeData(this.selectedHighWaterTime);
    }
  }

  /**
   * Process data for selected high water time (±6 hours)
   */
  processHighWaterTimeData(highWaterTime: HighWaterTime) {
  console.log('Processing High Water Time:', highWaterTime);
  const targetDateTime = new Date(highWaterTime.datetime);
  let bf: any[] = [];
  let af: any[] = [];

  const matchingEntry = this.main_table.find(
    (item) => new Date(item.date).getTime() === new Date(highWaterTime.datetime).getTime()
  );

  if (matchingEntry) {
    this.currentData = matchingEntry;
    console.log('Matching Entry:', matchingEntry);

    for (let i = 1; i <= 6; i++) {
      const beforeHour = new Date(targetDateTime.getTime() - i * 60 * 60 * 1000);
      const afterHour = new Date(targetDateTime.getTime() + i * 60 * 60 * 1000);

      const beforeHourData = this.main_table.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === beforeHour.getFullYear() &&
          itemDate.getMonth() === beforeHour.getMonth() &&
          itemDate.getDate() === beforeHour.getDate() &&
          itemDate.getHours() === beforeHour.getHours()
        );
      });

      const afterHourData = this.main_table.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === afterHour.getFullYear() &&
          itemDate.getMonth() === afterHour.getMonth() &&
          itemDate.getDate() === afterHour.getDate() &&
          itemDate.getHours() === afterHour.getHours()
        );
      });

      bf.push([...beforeHourData]);
      af.push([...afterHourData]);
    }

    console.log('Before 6 hours:', bf);
    console.log('After 6 hours:', af);

    this.current_hours_data = [];
    this.current_hours_data.push(bf);
    this.current_hours_data.push(af);

    const data = {
      id: matchingEntry.station_id,
      tide: matchingEntry.pressure,
      dateTime: matchingEntry.date,
      battery: matchingEntry.battery,
      depth: matchingEntry.depth,
      current_speed: matchingEntry.speed,
      current_direction: matchingEntry.direction,
      lat: matchingEntry.lat,
      lon: matchingEntry.lon,
      current_speed_b_6: bf[0]?.[0]?.speed || '',
      current_dir_b_6: bf[0]?.[0]?.direction || '',
      current_speed_after_6: af[0]?.[0]?.speed || '',
      current_dir_after_6: af[0]?.[0]?.direction || '',
    };

    this.selected_data = data;
    this.before_data = bf.reverse();
    this.after_data = af;
    this.__assign();
    this.cdr.detectChanges();
  } else {
    console.error('No matching entry found for datetime:', highWaterTime.datetime);
    this.toast.error('No data found for the selected high water time.', 'Error');
  }
}

  toggle_tap() {
    // Find all high water times
    // this.highWaterTimes = this.getTop6HighWaterTimes();
    const { high, low } = this.getTop3HighAndLowWaterTimes();
    this.highWaterTimes = [...high, ...low];
    

    if (this.highWaterTimes.length === 0) {
      this.toast.error(
        'No high water level data found in this file.',
        'Error'
      );
      return;
    }

    // Select the first (highest) high water time by default
    this.selectedHighWaterTime = this.highWaterTimes[0];
    
    this.isLive = !this.isLive;
    
    if (this.isLive) {
      this.tap_date(this.main_table[0].date, this.main_table[0].time);
    } else {
      // Process the selected high water time
      this.processHighWaterTimeData(this.selectedHighWaterTime);
    }

    console.log('High Water Times:', this.highWaterTimes);
  }

  timee: number = 6;
  changeTime(index: number) {
    this.hours = index;
    console.log('Selected time:', this.timee);
    this.__assign();
  }
  
  hours: number = 6;
  
  __assign() {
    this.avgData = [];
    const baseDate = new Date(this.currentData.date);

    for (let i = 6; i >= 1; i--) {
      const entries = this.before_data[6 - i] || [];
      const avg = this.ccalculateAverage(entries);

      this.avgData.push({
        name: `${i} hour${i > 1 ? 's' : ''} before`,
        tide: avg.pressure.toFixed(2),
        speed: avg.speed.toFixed(2),
        direction: avg.direction.toFixed(2),
        date: new Date(baseDate.getTime() - i * 60 * 60 * 1000),
      });
    }

    this.avgData.push({
      name: 'Current',
      tide: this.currentData.pressure?.toString() || 'N/A',
      speed: this.currentData.speed?.toString() || 'N/A',
      direction: this.currentData.direction?.toString() || 'N/A',
      date: this.currentData.date,
    });

    for (let i = 1; i <= 6; i++) {
      const entries = this.after_data[i - 1] || [];
      const avg = this.ccalculateAverage(entries);
      this.avgData.push({
        name: `${i} hour${i > 1 ? 's' : ''} after`,
        tide: avg.pressure.toFixed(2),
        speed: avg.speed.toFixed(2),
        direction: avg.direction.toFixed(2),
        date: new Date(baseDate.getTime() + i * 60 * 60 * 1000),
      });
    }

    console.log('avg', this.avgData);
  }

  get dynamicHeight(): number {
    const items = this.filteredAvgData.length;
    return items > 0 ? 95 / items : 13;
  }
  
  get filteredAvgData() {
    const total = 6 + Number(this.hours) + 1;
    const data = this.isbefore
      ? this.avgData.slice(6 - this.hours, 7)
      : this.avgData.slice(6, total);

    return data;
  }

  get slicedAvgData() {
    return this.isbefore
      ? this.avgData.slice(0, this.hours + 1)
      : this.avgData.slice(6, 6 + this.hours + 1);
  }

  ccalculateAverage(entries: any[] = []): {
    pressure: number;
    speed: number;
    direction: number;
  } {
    if (!Array.isArray(entries)) {
      entries = [];
    }
    let totalPressure = 0,
      totalSpeed = 0,
      totalDirection = 0;
    let count = entries.length;

    for (let entry of entries) {
      totalPressure += parseFloat(entry?.pressure) ?? 0;
      totalSpeed += parseFloat(entry?.speed) ?? 0;
      totalDirection += parseFloat(entry?.direction) ?? 0;
    }

    return {
      pressure: count ? totalPressure / count : 0,
      speed: count ? totalSpeed / count : 0,
      direction: count ? totalDirection / count : 0,
    };
  }

  filterByHour(dataArray: any[]): any[] {
    const date = dataArray[0].date;
    const targetDate = new Date(date);

    return dataArray.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getFullYear() === targetDate.getFullYear() &&
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getDate() === targetDate.getDate() &&
        itemDate.getHours() === targetDate.getHours()
      );
    });
  }
current_bins:any[]=[]
  tap_date(date: string, time: string) {
    const filter = this.main_table.filter(
      (item) => item.date === date && item.time === time
    );
console.log(filter);

if (this.isAwac) {
  this.current_bins = []; // clear existing bins

  for (let i = 1; i <= 20; i++) {
    const speedKey = `speed_bin${i}`;
    const directionKey = `direction_bin${i}`;

    this.current_bins.push({
      [`speed_bin${i}`]: filter[0][speedKey],
      [`direction_bin${i}`]: filter[0][directionKey],
    });
  }
}

    const data = {
      id: filter[0].station_id,
      tide: filter[0].pressure,
      dateTime: filter[0].date,
      depth: filter[0].depth,
      battery: filter[0].battery,
      current_speed: filter[0].speed,
      current_direction: filter[0].direction,
      lat: filter[0].lat,
      lon: filter[0].lon,
      current_speed_b_6: '',
      current_dir_b_6: '',
      current_speed_after_6: '',
      current_dir_after_6: '',
    };
    this.selected_data = data;
    this.latutude = this.selected_data.lat;
    this.longitude = this.selected_data.lon;
    this.dir = false;
    this.directionTo = this.directionValue(
      parseFloat(this.selected_data.current_direction)
    );
    setTimeout(() => {
      this.dir = true;
    }, 100);
  }
  
  directionTo!: string;
  
  directionValue(degrees: number): string {
    degrees = degrees % 360;
    if (degrees < 0) degrees += 360;
    if (degrees >= 348.75 || degrees < 11.25) return 'N';
    else if (degrees >= 11.25 && degrees < 33.75) return 'NNE';
    else if (degrees >= 33.75 && degrees < 56.25) return 'NE';
    else if (degrees >= 56.25 && degrees < 78.75) return 'ENE';
    else if (degrees >= 78.75 && degrees < 101.25) return 'E';
    else if (degrees >= 101.25 && degrees < 123.75) return 'ESE';
    else if (degrees >= 123.75 && degrees < 146.25) return 'SE';
    else if (degrees >= 146.25 && degrees < 168.75) return 'SSE';
    else if (degrees >= 168.75 && degrees < 191.25) return 'S';
    else if (degrees >= 191.25 && degrees < 213.75) return 'SSW';
    else if (degrees >= 213.75 && degrees < 236.25) return 'SW';
    else if (degrees >= 236.25 && degrees < 258.75) return 'WSW';
    else if (degrees >= 258.75 && degrees < 281.25) return 'W';
    else if (degrees >= 281.25 && degrees < 303.75) return 'WNW';
    else if (degrees >= 303.75 && degrees < 326.25) return 'NW';
    else return 'NNW';
  }
  
  fileID: number | undefined;
  Array_item: number[] = [1, 2, 3, 4, 5, 3, 6, 7, 8, 8, 9, 9, 10];
  unitssTo!: UnitSettings;
  
  ngOnInit(): void {
    const datetimeValue = JSON.parse(
      localStorage.getItem('unitSettings') ?? '{}'
    ).datetime;
    if (datetimeValue == '30-03-2025 12:00:00') {
      this.dateFormat = 'dd-MM-Y HH:mm:ss';
    } else if (datetimeValue == '03-30-2025 12:00:00') {
      this.dateFormat = 'MM-dd-Y HH:mm:ss';
    } else {
      this.dateFormat = 'dd MMM yyyy HH:mm:ss';
    }

    this.http.get(`${this.baseUrl}files`).subscribe((response: any) => {
      this.files_list = response['data'];

      const folderWithFiles = this.files_list.find(
        (folder) => folder.files && folder.files.length > 0
      );

      this.fileID = this.globe.fileId;

      let folderIndex = -1;
      let selectedFile = null;
      let selectedFolder = null;

      if (this.fileID) {
        folderIndex = this.files_list.findIndex((folder) =>
          folder.files.some((file) => file.file_id === this.fileID)
        );
        if (folderIndex !== -1) {
          selectedFolder = this.files_list[folderIndex];
          selectedFile = selectedFolder.files.find(
            (file) => file.file_id === this.fileID
          );
        }
      }

      if (folderIndex === -1) {
        folderIndex = this.files_list.findIndex(
          (folder) => folder.files && folder.files.length > 0
        );
        if (folderIndex !== -1) {
          selectedFolder = this.files_list[folderIndex];
          selectedFile = selectedFolder.files[0];
        }
      }

      this.expandedFolders = this.files_list.map(
        (_, index) => index === folderIndex
      );

      if (selectedFolder && selectedFile) {
        this.openedFolder = selectedFolder.folder_id;
        this.selected_folder_name = selectedFolder.folder_name;

        this.selectedFiles = [
          {
            file_name: selectedFile.file_name,
            file_id: selectedFile.file_id,
          },
        ];
        this.opened_file = selectedFile.file_name;

        this.open_file(selectedFile.file_name, selectedFile.file_id);
      }
    });
  }

  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
  }
  
  toggleFileSelection(
    fileName: string,
    event: MouseEvent,
    file_id: number,
    folder_name: string, type:string
  ) {
    this.globe.fileId = file_id;
    this.selected_folder_name = folder_name;
    this.isLive = true;
    this.isMulti = false;
    this.selectedFiles = [
      {
        file_name: fileName,
        file_id: file_id,
      },
    ];

   this.isAwac = type === 'awac' ? true : false;
    this.open_file(fileName, file_id);
  }

  getFileImage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'csv':
        return '../../assets/csv.png';
      case 'xlsx':
        return '../../assets/xl.png';
      case 'nmea':
        return '../../assets/nmea.png';
      default:
        return 'assets/file.png';
    }
  }

  convertValue(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;

    const maxVolt = 12.4;

    const conversions: { [key: string]: (v: number) => number } = {
      'm-ft': (v) => v * 3.28084,
      'ft-m': (v) => v / 3.28084,
      'm-cm': (v) => v * 100,
      'cm-m': (v) => v / 100,
      'ft-cm': (v) => (v / 3.28084) * 100,
      'cm-ft': (v) => (v / 100) * 3.28084,
      'm/s-knots': (v) => v * 1.94384,
      'knots-m/s': (v) => v / 1.94384,
      'radians-°': (v) => v * (180 / Math.PI),
      '°-radians': (v) => v * (Math.PI / 180),
      'volts-%': (v) => (v / maxVolt) * 100,
      '%-volts': (v) => (v * maxVolt) / 100,
    };

    const key = `${fromUnit}-${toUnit}`;
    if (conversions[key]) {
      return this.parseFloat(conversions[key](value).toFixed(2));
    }

    return parseFloat(value.toFixed(2));
  }

  formatDms(coordinate: string | number): string {
    if (typeof coordinate === 'string' && coordinate.includes(',')) {
      const parts = coordinate.split(',').map(Number);
      return `${parts[0]}°${parts[1]}'${parts[2]}''`;
    }

    const value =
      typeof coordinate === 'string' ? parseFloat(coordinate) : coordinate;
    const deg = Math.floor(value);
    const minFloat = (value - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = (minFloat - min) * 60;

    return `${deg}°${min}'${sec.toFixed(2)}''`;
  }

  convertcoored(value: any, fromUnit: string, toUnit: string): any {
    if (fromUnit === toUnit) return value;
    const maxVolt = 4.2;

    const conversions: { [key: string]: (v: any) => any } = {
      'm-ft': (v) => v * 3.28084,
      'ft-m': (v) => v / 3.28084,
      'm-cm': (v) => v * 100,
      'cm-m': (v) => v / 100,
      'ft-cm': (v) => (v / 3.28084) * 100,
      'cm-ft': (v) => (v / 100) * 3.28084,
      'm/s-knots': (v) => v * 1.94384,
      'knots-m/s': (v) => v / 1.94384,
      'radians-°': (v) => v * (180 / Math.PI),
      '°-radians': (v) => v * (Math.PI / 180),
      'volts-%': (v) => (v / maxVolt) * 100,
      '%-volts': (v) => (v * maxVolt) / 100,

      'dd-dms': (v) => {
        const deg = Math.floor(v);
        const minFloat = (v - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = (minFloat - min) * 60;
        return `${deg}°${min}'${sec.toFixed(2)}"`;
      },

      'dms-dd': (v) => {
        const regex = /(\d+)°(\d+)'([\d.]+)(?:'|")/;
        const match = v.match(regex);
        if (!match) return 0;
        const deg = parseInt(match[1]);
        const min = parseInt(match[2]);
        const sec = parseFloat(match[3]);
        return parseFloat((deg + min / 60 + sec / 3600).toFixed(6));
      },
    };

    const key = `${fromUnit}-${toUnit}`;
    if (conversions[key]) {
      return conversions[key](value);
    }

    return value;
  }

  bet_unit!: string;
  wat_unit!: string;
  coor_unit!: string;
  depth_unit!: string;
  speed_unit!: string;
  directtion_unit!: string;
  awacData:AwacDataModel[]=[]
  open_file(file_name: string, file_id: number) {
    this.opened_file = file_name;
    const data = {
      folder_id: file_id,
      file_name: file_name,
    };
    let unitstts: UnitSettings;
    
    this.http
      .get(`${this.baseUrl}fetch_data_by_file/${file_id}`)
      .subscribe((response: any) => {
        console.log("response = ", response);
        if(response[0].type === 'awac'){
          this.awacData = response;       
          this.latutude = `${this.awacData[0].lat}`;
          this.longitude = `${this.awacData[0].lon}`;
  
          this.bet_unit = `${this.awacData[0].battery_unit}`;
          this.wat_unit = this.awacData[0].water_level_unit as string;
          this.coor_unit = this.awacData[0].coord_unit as string;
          this.depth_unit = this.awacData[0].depth_unit as string;
          this.speed_unit = this.awacData[0].current_speed_unit as string;
          this.directtion_unit = this.awacData[0].current_direction_unit as string;
  
          unitstts = {
            battery: this.awacData[0].battery_unit_to || '',
            currentDirection: this.awacData[0].current_direction_unit_to || '',
            currentSpeed: this.awacData[0].current_speed_unit_to || '',
            depth: this.awacData[0].depth_unit_to || '',
            latandlong: this.awacData[0].coord_unit_to || '',
            waterLevel: this.awacData[0].water_level_unit_to || '',
            datetime: this.dateFormat,
          };
          this.unitssTo = unitstts;
  
          if (this.isMulti) {
            let data = this.main_table;
            this.main_table = [];
            setTimeout(() => {
              this.main_table = data;
              for (let index = 0; index < this.awacData.length; index++) {
                this.main_table.push(this.awacData[index]);
              }
              this.tap_date(this.main_table[0].date, this.main_table[0].time);
            }, 100);
          } else {
            this.main_table = [];
            setTimeout(() => {
              this.main_table = this.awacData;
              this.tap_date(this.main_table[0].date, this.main_table[0].time);
            }, 100);
          }
        
        }else{
            this.latutude = response[0].lat;
            this.longitude = response[0].lon;
    
            this.bet_unit = response[0].battery_unit;
            this.wat_unit = response[0].water_level_unit;
            this.coor_unit = response[0].coord_unit;
            this.depth_unit = response[0].depth_unit;
            this.speed_unit = response[0].current_speed_unit;
            this.directtion_unit = response[0].current_direction_unit;
    
            unitstts = {
              battery: response[0].battery_unit_to || '',
              currentDirection: response[0].current_direction_unit_to || '',
              currentSpeed: response[0].current_speed_unit_to || '',
              depth: response[0].depth_unit_to || '',
              latandlong: response[0].coord_unit_to || '',
              waterLevel: response[0].water_level_unit_to || '',
              datetime: this.dateFormat,
            };
            this.unitssTo = unitstts;
    
            if (this.isMulti) {
              let data = this.main_table;
              this.main_table = [];
              setTimeout(() => {
                this.main_table = data;
                for (let index = 0; index < response.length; index++) {
                  this.main_table.push(response[index]);
                }
                this.tap_date(this.main_table[0].date, this.main_table[0].time);
              }, 100);
            } else {
              this.main_table = [];
              setTimeout(() => {
                this.main_table = response;
                this.tap_date(this.main_table[0].date, this.main_table[0].time);
              }, 100);
            }
          }
        
      });
  }
  
  getFileClass(fileName: string, file_id: number): string {
    const isSelected = this.selectedFiles.some(
      (file) => file.file_name === fileName && file.file_id === file_id
    );
    return isSelected ? 'file-item_active' : 'file-item';
  }

  avgData: any[] = [];
}