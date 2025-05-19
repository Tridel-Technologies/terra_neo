import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Toast } from 'ngx-toastr';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputSwitchModule } from 'primeng/inputswitch';

interface Column {
  field: string;
  header: string;
  type: string;
  customExportHeader?: string;
}

interface Files {
  id: number;
  files: string[];
  folder_name: string;
  timestamp: string;
}

interface ApiData {
  id: number;
  battery: string;
  date: string;
  dept: string;
  direction: string;
  file_id: number;
  file_name: string;
  high_water_level: number;
  lat: string;
  lon: string;
  pressure: string;
  speed: string;
  station_id: string;
  time: string;
}

interface SelectedData {
  id: string;
  tide: string;
  dateTime: string;
  // time:string,
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

interface Folders {
  folder_id: number;
  folder_name: string;
  files: fileData[];
  timestamp: string;
}

interface fileData {
  file_id: number;
  file_name: string;
  is_processed: boolean;
}
@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    MultiSelectModule,
    ToggleSwitchModule,
    InputSwitchModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  providers: [Toast],
})
export class ReportsComponent implements OnInit {
  expandedFolders: boolean[] = [];
  opened_file!: string;
  openedFolder!: number;
  selectedFiles: any[] = []; // Array to track selected files
  isMulti: boolean = true;
  main_table: ApiData[] = [];
  files_list: Folders[] = [];
  selected_folder_name!: string;
  selected_data!: SelectedData;
  isLive: boolean = true;
  loading: boolean = false;
  totalRecords: number = 0;

  before_data: any[] = [];
  after_data: any[] = [];
  current_hours_data: any[] = [];

  showToggleTable: boolean = false;
  toggleTableData: any[] = [];

  last_row: ApiData | null = null;

  cols!: Column[];
  selectedColumns!: Column[];
  globalFilterFields!: string[];
  searchQuery: string = '';

  summaryColumns: Column[] = [
    { field: 'name', header: 'Time', type: 'text' },
    { field: 'tide', header: 'Tide', type: 'text' },
    { field: 'speed', header: 'Speed', type: 'text' },
    { field: 'direction', header: 'Direction', type: 'text' },
  ];

  constructor(private http: HttpClient, private toast: ToastrService) {}

  ngOnInit(): void {
    this.files_list = [];
    this.http
      .get('http://localhost:3000/api/files')
      .subscribe((response: any) => {
        this.files_list = response['data'];
        console.log('files:', response, this.files_list);
        this.expandedFolders = this.files_list.map(() => false);
      });

    this.cols = [
      // { field: 'id', header: 'ID', type: 'text' },
      { field: 'station_id', header: 'Station ID', type: 'text' },
      { field: 'date', header: 'Time Stamp', type: 'shortDate' },
      { field: 'lat', header: 'LAT', type: 'text' },
      { field: 'lon', header: 'LON', type: 'text' },
      { field: 'dept', header: 'Depth', type: 'text' },
      { field: 'pressure', header: 'Water Level', type: 'text' },
      { field: 'speed', header: 'Current Speed', type: 'text' },
      { field: 'direction', header: 'Current Direction', type: 'text' },
    ];
    this.selectedColumns = this.cols;
    this.globalFilterFields = this.cols.map((col) => col.field);
  }

  onSearch(query: string, dt: any): void {
    this.searchQuery = query;
    dt.filterGlobal(query, 'contains');
  }

  highlightSearchText(value: any): string {
    if (!this.searchQuery) return value;

    // Ensure the value is treated as a string
    const stringValue =
      value !== null && value !== undefined ? String(value) : '';
    const escapedSearchQuery = this.searchQuery.replace(
      /[-\/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    );
    const regex = new RegExp(`(${escapedSearchQuery})`, 'gi');
    return stringValue.replace(regex, '<span class="highlight">$1</span>');
  }

  rowMatchesSearch(rowData: any, columns: any[]): boolean {
    if (!this.searchQuery) return false;

    const search = this.searchQuery.toLowerCase();

    return columns.some((col) => {
      const value = rowData[col.field];
      return (
        value !== null &&
        value !== undefined &&
        String(value).toLowerCase().includes(search)
      );
    });
  }

  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
  }

  toggleFileSelection(file_id: number) {
    this.isMulti = false;
    // If Ctrl/Cmd is not pressed, select this file and deselect all others
    this.selectedFiles = [
      {
        file_id: file_id,
      },
    ]; // Only keep the clicked file selected
    this.open_file(file_id);
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
  open_file(file_id: number) {
    const data = {
      folder_id: file_id,
    };
    console.log(data);
    this.http
      .get(`http://localhost:3000/api/fetch_data_by_file/${file_id}`)
      .subscribe((response: any) => {
        console.log('response', response);

        this.last_row =
          response.length > 0 ? response[response.length - 1] : null;
        console.log('Last row:', this.last_row);
        if (this.isMulti) {
          let data = this.main_table;
          this.main_table = [];
          setTimeout(() => {
            this.main_table = data;
            for (let index = 0; index < response.length; index++) {
              this.main_table.push(response[index]);
            }
            console.log('Main table data ', this.main_table);
            // this.tap_date(this.main_table[0].date, this.main_table[0].time);
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

  get_value_for_widget(index: number, param: string, period: string): number {
    const bfMatches =
      period === 'after'
        ? this.filterByHour(this.after_data[index])
        : this.filterByHour(this.before_data[index]);
    return this.getAverageSpeed(bfMatches, param);
  }
  getAverageSpeed(dataArray: any[], key: string): number {
    if (!dataArray.length) return 0;

    const speeds = dataArray.map((item) => parseFloat(item[key]));
    const total = speeds.reduce((acc, val) => acc + val, 0);
    const average = total / speeds.length;

    return parseFloat(average.toFixed(3)); // Rounded to 3 decimal places
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

  toggle_tap() {
    console.log('main_table sample:', this.main_table.slice(0, 5)); // Show first 5 records

    const filter = this.main_table.filter(
      (item) => item.high_water_level === 1
    );
    console.log('Filtered high_water_level === 1:', filter);

    if (filter.length === 0) {
      console.error('No records where high_water_level === 1 found.');
      throw new Error('No high_water_level data');
    }

    try {
      const filter = this.main_table.filter(
        (item) => item.high_water_level === 1
      );
      if (filter.length === 0) {
        throw new Error('No high_water_level data');
      }

      const targetDateTime = new Date(filter[0].date);

      // We'll collect arrays of data per hour for before and after 6 hours
      const bf: any[][] = [];
      const af: any[][] = [];

      for (let i = 6; i >= 1; i--) {
        const beforeHour = new Date(targetDateTime);
        beforeHour.setHours(beforeHour.getHours() - i, 0, 0, 0);

        // Filter all data for that hour
        const beforeDataArray = this.main_table.filter((item) => {
          const d = new Date(item.date);
          return (
            d.getFullYear() === beforeHour.getFullYear() &&
            d.getMonth() === beforeHour.getMonth() &&
            d.getDate() === beforeHour.getDate() &&
            d.getHours() === beforeHour.getHours()
          );
        });
        bf.push(beforeDataArray);
      }

      for (let i = 1; i <= 6; i++) {
        const afterHour = new Date(targetDateTime);
        afterHour.setHours(afterHour.getHours() + i, 0, 0, 0);

        // Filter all data for that hour
        const afterDataArray = this.main_table.filter((item) => {
          const d = new Date(item.date);
          return (
            d.getFullYear() === afterHour.getFullYear() &&
            d.getMonth() === afterHour.getMonth() &&
            d.getDate() === afterHour.getDate() &&
            d.getHours() === afterHour.getHours()
          );
        });
        af.push(afterDataArray);
      }

      // Current data as before
      const currentData = filter[0];

      // Prepare toggleTableData with averaged values
      this.toggleTableData = [];

      // Before hours — average pressure, speed, direction
      for (let i = 0; i < 6; i++) {
        this.toggleTableData.push({
          name: `${6 - i} hour${6 - i > 1 ? 's' : ''} before`,
          tide: bf[i].length ? this.getAverageSpeed(bf[i], 'pressure') : NaN,
          speed: bf[i].length ? this.getAverageSpeed(bf[i], 'speed') : NaN,
          direction: bf[i].length
            ? this.getAverageSpeed(bf[i], 'direction')
            : NaN,
        });
      }

      // Current hour — single data point
      this.toggleTableData.push({
        name: 'High Water Time',
        tide: currentData.pressure ?? NaN,
        speed: currentData.speed ?? NaN,
        direction: currentData.direction ?? NaN,
      });

      // After hours — average pressure, speed, direction
      for (let i = 0; i < 6; i++) {
        this.toggleTableData.push({
          name: `${i + 1} hour${i + 1 > 1 ? 's' : ''} after`,
          tide: af[i].length ? this.getAverageSpeed(af[i], 'pressure') : NaN,
          speed: af[i].length ? this.getAverageSpeed(af[i], 'speed') : NaN,
          direction: af[i].length
            ? this.getAverageSpeed(af[i], 'direction')
            : NaN,
        });
      }

      // this.showToggleTable = !this.showToggleTable;
    } catch (error) {
      this.toast.error(
        'This file has no high_water_level data. Please edit in the process page.',
        'Error'
      );
    }
  }

  avgData: any[] = [
    { name: '6 hours before', tide: '1.2', speed: '3.4', direction: '234' },
    { name: '5 hours before', tide: '1.4', speed: '3.1', direction: '240' },
    { name: '4 hours before', tide: '1.6', speed: '3.6', direction: '245' },
    { name: '3 hours before', tide: '1.8', speed: '3.2', direction: '250' },
    { name: '2 hours before', tide: '2.0', speed: '3.0', direction: '255' },
    { name: '1 hour before', tide: '2.2', speed: '3.5', direction: '260' },
    { name: 'Current', tide: '2.5', speed: '3.8', direction: '265' },
    { name: '1 hour after', tide: '2.4', speed: '3.7', direction: '270' },
    { name: '2 hours after', tide: '2.1', speed: '3.3', direction: '275' },
    { name: '3 hours after', tide: '1.9', speed: '3.1', direction: '280' },
    { name: '4 hours after', tide: '1.7', speed: '3.2', direction: '285' },
    { name: '5 hours after', tide: '1.5', speed: '3.0', direction: '290' },
    { name: '6 hours after', tide: 'N/A', speed: 'N/A', direction: 'N/A' },
  ];
}
