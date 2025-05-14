import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
  id: number;
  tide: string;
  datetime: string;
  current_speed: string;
  current_direction: string;
}

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    MultiSelectModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  expandedFolders: boolean[] = [];
  opened_file!: string;
  openedFolder!: number;
  selectedFiles: any[] = []; // Array to track selected files
  isMulti: boolean = true;
  main_table: ApiData[] = [];
  files_list: Files[] = [];
  selected_folder_name!: string;
  selected_data!: SelectedData;
  isLive: boolean = true;
  loading: boolean = false;
  totalRecords: number = 0;

  private fullData: ApiData[] = [];
  last_row: ApiData | null = null;

  cols!: Column[];
  selectedColumns!: Column[];
  globalFilterFields!: string[];
  searchQuery: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.files_list = [];
    this.http
      .get('http://localhost:3000/api/get_files')
      .subscribe((response: any) => {
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
          this.selectedFiles = [
            {
              file_name: firstFile,
              file_id: firstFolder.id,
            },
          ];
          this.opened_file = firstFile;

          // Fetch data for the file
          this.open_file(firstFile, firstFolder.id);
        }
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

  toggleFileSelection(
    fileName: string,
    event: MouseEvent,
    file_id: number,
    folder_name: string
  ) {
    console.log(fileName, file_id);
    this.selected_folder_name = folder_name;
    this.isMulti = false;
    // If Ctrl/Cmd is not pressed, select this file and deselect all others
    this.selectedFiles = [
      {
        file_name: fileName,
        file_id: file_id,
      },
    ]; // Only keep the clicked file selected
    this.open_file(fileName, file_id);
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
  open_file(file_name: string, file_id: number) {
    this.opened_file = file_name;
    const data = {
      folder_id: file_id,
      file_name: file_name,
    };
    console.log(data);
    this.http
      .get(
        `http://localhost:3000/api/fetch_data_by_file/${this.openedFolder}/${file_name}`
      )
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

  // tap_date(date: string, time: string) {
  //   console.log('started ', date, time);
  //   const filter = this.main_table.filter(
  //     (item) => item.date === date && item.time === time
  //   );
  //   console.log(filter);
  //   const data = {
  //     id: filter[0].station_id,
  //     tide: filter[0].pressure,
  //     date: filter[0].date,
  //     time: filter[0].time,
  //     battery: filter[0].battery,
  //     current_speed: filter[0].speed,
  //     current_direction: filter[0].direction,
  //     lat: filter[0].lat,
  //     lon: filter[0].lon,
  //     current_speed_b_6: '',
  //     current_dir_b_6: '',
  //     current_speed_after_6: '',
  //     current_dir_after_6: '',
  //   };
  //   this.selected_data = data;
  //   console.log('selected', this.selected_data);
  // }
}
