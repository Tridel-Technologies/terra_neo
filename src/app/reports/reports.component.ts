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
import { DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GlobalConfig } from '../global/app.global';
import { UnitService, UnitSettings } from '../settings/unit.service';
import { array } from '@amcharts/amcharts5';
import { BaseComponent } from '../base/base.component';

interface Column {
  field: string;
  header: string;
  type: string;
  // customExportHeader?: string;
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
  depth: string;
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
  water_level_unit: string;
  current_speed_unit: string;
  current_direction_unit: string;
  battery_unit: string;
  depth_unit: string;
  [key: string]: any;
}
 
interface SelectedData {
  id: string;
  pressure: string;
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
    DropdownModule,
    SelectModule,
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
  unitSettings: { key: string }[] = [];
 
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

  private baseUrl: string;
  private convertValues;

  units: UnitSettings = {
    waterLevel: '',
    currentSpeed: '',
    currentDirection: '',
    battery: '',
    depth: '',
    latandlong: '',
  };

  summaryColumns!: Column[];

  constructor(private http: HttpClient, private toast: ToastrService, private unitSerive: UnitService) {
    this.baseUrl = new GlobalConfig().baseUrl;
    this.convertValues = new GlobalConfig().convertValue;
  }

  ngOnInit(): void {
    this.unitSerive.units$.subscribe((u) => {
      this.units = u;
      this.setupColumns();
    });
    console.log('units', this.units);

    this.files_list = [];
    this.http.get(`${this.baseUrl}files`).subscribe((response: any) => {
      this.files_list = response['data'];
      console.log('files:', response, this.files_list);
      this.expandedFolders = this.files_list.map(() => false);
    });
 
    this.setupColumns();
  }
 
  setupColumns() {
    if (!this.showToggleTable) {
      this.cols = [
        { field: 'station_id', header: 'Station ID', type: 'text' },
        { field: 'date', header: 'Time Stamp', type: 'shortDate' },
        { field: 'lat', header: 'LAT', type: 'text' },
        { field: 'lon', header: 'LON', type: 'text' },
        { field: 'depth', header: `Depth (${this.units.depth})`, type: 'text' },
        { field: 'pressure', header: `Water Level (${this.units.waterLevel})`, type: 'text' },
        { field: 'speed', header: `Current Speed (${this.units.currentSpeed})`, type: 'text' },
        { field: 'direction', header: `Current Direction (${this.units.currentDirection})`, type: 'text' },
      ];
    } else {
      this.cols = [
        { field: 'timestamp', header: 'Date', type: 'text' },
        { field: 'name', header: 'Time', type: 'text' },
        { field: 'pressure', header: `Water Level (${this.units.waterLevel})`, type: 'text' },
        { field: 'speed', header: `Speed (${this.units.currentSpeed})`, type: 'text' },
        { field: 'direction', header: `Direction (${this.units.currentDirection})`, type: 'text' },
      ];
    }
    this.summaryColumns = [
      { field: 'timestamp', header: 'DateTime', type: 'text' },
      { field: 'name', header: 'Sequence', type: 'text' },
      { field: 'pressure', header: `Water Level (${this.units.waterLevel})`, type: 'text' },
      { field: 'speed', header: `Speed (${this.units.currentSpeed})`, type: 'text' },
      { field: 'direction', header: `Direction (${this.units.currentDirection})`, type: 'text' },
    ];
    this.selectedColumns = this.cols;
    this.globalFilterFields = (!this.showToggleTable ? this.cols : this.summaryColumns).map(col => col.field);
  }
 
  selectedData: { name: string; value: string } = {
    name: 'Raw Data',
    value: 'raw',
  };
  dataTypeOptions = [
    { name: 'Raw Data', value: 'raw' },
    { name: 'Processed Data', value: 'processed' },
  ];
 
  exportOptions = [
    { label: 'Export to CSV', value: 'csv' },
    { label: 'Export to Excel', value: 'excel' },
    { label: 'Export to PDF', value: 'pdf' },
  ];
  nameOffile!: string;

  fileID!:number

  onSearch(query: string, dt: any): void {
    this.searchQuery = query;
    // Remove the global filter since we're using custom filtering
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
 
    const search = this.searchQuery.toLowerCase().trim();
 
    if (rowData.name && rowData.name.toLowerCase().includes(search)) {
      return true;
    }
 
    return columns.some((col) => {
      const value = rowData[col.field];
      if (value === null || value === undefined) return false;
 
      const stringValue = String(value).toLowerCase().trim();
      return stringValue.includes(search);
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
    // this.dir = false;
    console.log(fileName, file_id);
    this.selected_folder_name = folder_name;
    this.nameOffile = fileName;
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
    this.open_file(file_id);
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
  open_file(file_id: number) {
    const data = {
      folder_id: file_id,
    };
    console.log('dd', this.selectedData);
    this.http
      .get(
        `${this.baseUrl}${
          this.selectedData.value === 'processed'
            ? 'get_processed_data'
            : 'fetch_data_by_file'
        }/${file_id}`
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
          }, 100);
        } else {
          this.main_table = [];
          setTimeout(() => {
            this.main_table = response;
            this.checkForConversion();
          }, 100);
        }
      });
  }

  checkForConversion(){
    console.log('here', this.main_table[0]);
    const sourceUnits: { [key: string]: string } = {
      waterLevel: this.main_table[0].water_level_unit,
      currentSpeed: this.main_table[0].current_speed_unit,
      currentDirection: this.main_table[0].current_direction_unit,
      battery: this.main_table[0].battery_unit,
      depth: this.main_table[0].depth_unit,
    };
  
    const unitsMatch = Object.keys(this.units).every(
      key => this.units[key] === sourceUnits[key]
    );
    console.log('match', unitsMatch);
    
    if(!unitsMatch){
      this.main_table = this.main_table.map((item, index) => {
        const newItem = { ...item } as ApiData;
  
        // if waterLevel unit mismatches → convert pressure
        if (sourceUnits['waterLevel'] !== this.units['waterLevel']) {
          if (newItem.pressure !== null && newItem.pressure !== undefined) {
            const converted = this.convertValues(+item.pressure, sourceUnits['waterLevel'], this.units['waterLevel']);
            newItem.pressure = converted.toString();
            this.main_table[index].pressure = converted.toString();
          }
        }
  
        // if currentSpeed unit mismatches → convert speed
        if (sourceUnits['currentSpeed'] !== this.units['currentSpeed']) {
          if (newItem.speed !== null && newItem.speed !== undefined) {
            const converted = this.convertValues(+item.speed, sourceUnits['currentSpeed'], this.units['currentSpeed']);
            newItem.speed = converted.toString();
            this.main_table[index].speed = converted.toString();
          }
        }
  
        // if currentDirection unit mismatches → convert direction
        if (sourceUnits['currentDirection'] !== this.units['currentDirection']) {
          if (newItem.direction !== null && newItem.direction !== undefined) {
            const converted = this.convertValues(+item.direction, sourceUnits['currentDirection'], this.units['currentDirection']);
            newItem.direction = converted.toString();
            this.main_table[index].direction = converted.toString();
          }
        }

        // depth
        if (sourceUnits['depth'] !== this.units['depth']) {
          if (newItem.depth !== null && newItem.depth !== undefined) {
            const converted = this.convertValues(+item.depth, sourceUnits['depth'], this.units['depth']);
            newItem.depth = converted.toString();
            this.main_table[index].depth = converted.toString();
          }
        }
  
        return newItem;
      });
    }
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
 
  getOrdinalSuffix(n: number): string {
    if (n % 100 >= 11 && n % 100 <= 13) {
      return 'th';
    }
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
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
      const targetMinutes = targetDateTime.getMinutes();
      console.log('targetDateTime', targetDateTime);
      console.log('targetMinutes', targetMinutes);
 
      // We'll collect arrays of data per hour for before and after 6 hours
      const bf: any[][] = [];
      const af: any[][] = [];
 
      // Calculate before times
      for (let i = 6; i >= 1; i--) {
        const beforeHour = new Date(targetDateTime);
        beforeHour.setHours(beforeHour.getHours() - i);
        const windowStart = new Date(beforeHour);
        windowStart.setMinutes(windowStart.getMinutes() - 30);
        const windowEnd = new Date(beforeHour);
        windowEnd.setMinutes(windowEnd.getMinutes() + 30);
 
        // Filter all data for that hour window
        const beforeDataArray = this.main_table.filter((item) => {
          const d = new Date(item.date);
          return d >= windowStart && d <= windowEnd;
        });
        bf.push(beforeDataArray);
      }
 
      // Calculate after times
      for (let i = 1; i <= 6; i++) {
        const afterHour = new Date(targetDateTime);
        afterHour.setHours(afterHour.getHours() + i);
        const windowStart = new Date(afterHour);
        windowStart.setMinutes(windowStart.getMinutes() - 30);
        const windowEnd = new Date(afterHour);
        windowEnd.setMinutes(windowEnd.getMinutes() + 30);
 
        // Filter all data for that hour window
        const afterDataArray = this.main_table.filter((item) => {
          const d = new Date(item.date);
          return d >= windowStart && d <= windowEnd;
        });
        af.push(afterDataArray);
      }
 
      // Current data as before
      const currentData = filter[0];
 
      // Prepare toggleTableData with averaged values
      this.toggleTableData = [];
 
      for (let i = 0; i < 6; i++) {
        const timestamp = new Date(targetDateTime);
        timestamp.setHours(timestamp.getHours() - (6 - i));
        const formattedDate = `${timestamp.toLocaleDateString()} ${String(
          timestamp.getHours()
        ).padStart(2, '0')}:${String(targetMinutes).padStart(2, '0')}`;
 
        const suffix = this.getOrdinalSuffix(i + 1);
        this.toggleTableData.push({
          // name: `${i + 1}${suffix} hr${i + 1 > 1 ? 's' : ''} before`,
          name: `${i + 1}${suffix}`,
          timestamp: formattedDate,
          pressure: bf[i].length
            ? this.getAverageSpeed(bf[i], 'pressure')
            : NaN,
          speed: bf[i].length ? this.getAverageSpeed(bf[i], 'speed') : NaN,
          direction: bf[i].length
            ? this.getAverageSpeed(bf[i], 'direction')
            : NaN,
        });
      }
 
      const currentTimestamp = new Date(currentData.date);
      const currentFormattedDate = `${currentTimestamp.toLocaleDateString()} ${String(
        currentTimestamp.getHours()
      ).padStart(2, '0')}:${String(currentTimestamp.getMinutes()).padStart(
        2,
        '0'
      )}`;
      this.toggleTableData.push({
        name: 'High Water Time',
        timestamp: currentFormattedDate,
        pressure: currentData.pressure ?? NaN,
        speed: currentData.speed ?? NaN,
        direction: currentData.direction ?? NaN,
        highlight: true,
      });
 
      // After hours — average pressure, speed, direction
      for (let i = 0; i < 6; i++) {
        const timestamp = new Date(targetDateTime);
        timestamp.setHours(timestamp.getHours() + (i + 1));
        const formattedDate = `${timestamp.toLocaleDateString()} ${String(
          timestamp.getHours()
        ).padStart(2, '0')}:${String(targetMinutes).padStart(2, '0')}`;
 
        const suffix = this.getOrdinalSuffix(i + 1);
        this.toggleTableData.push({
          // name: `${i + 1}${suffix} hr${i + 1 > 1 ? 's' : ''} before`,
          name: `${i + 1}${suffix}`,
          timestamp: formattedDate,
          pressure: af[i].length
            ? this.getAverageSpeed(af[i], 'pressure')
            : NaN,
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
 
  onDataTypeChange() {
    if (this.selectedFiles.length > 0) {
      const fileId = this.selectedFiles[0].file_id;
      this.open_file(fileId);
    }
  }
 
  getRowStyle(row: any): { [key: string]: string } {
    if (row.highlight) {
      return { 'background-color': '#ffeb3b' }; // Highlight color for high water level
    }
 
    // Check if it's a 'before' or 'after' row by position or content
    if (typeof row.name === 'string') {
      if (row.name.includes('High Water')) {
        return { 'background-color': '#c5e1ff' }; // Special color for peak
      }
 
      const match = row.name.match(/^(\d+)(?:st|nd|rd|th)$/);
      if (match) {
        const hour = +match[1];
        // Your toggleTableData is in order: [6 before ... 1 before, HighWater, 1 after ... 6 after]
        const highIndex = this.toggleTableData.findIndex(
          (r) => r.name === 'High Water Time'
        );
 
        const index = this.toggleTableData.findIndex((r) => r === row);
        if (index < highIndex) {
          return { 'background-color': '#e0f7fa' }; // Light blue for before
        } else if (index > highIndex) {
          return { 'background-color': '#fff3e0' }; // Light orange for after
        }
      }
    }
 
    return {}; // Default
  }
 
  onExportOptionSelect(event: any, dt2: any) {
    const selectedOption = event.value;
    switch (selectedOption) {
      case 'csv':
        this.exportCSV(dt2);
        break;
      case 'excel':
        this.exportExcel(dt2);
        break;
      case 'pdf':
        this.exportPDF(dt2);
        break;
      default:
        break;
    }
  }
 
  exportCSV(dt: any) {
    const filteredData = dt.filteredValue || dt.value;
 
    if (filteredData && filteredData.length > 0) {
      const csv = this.convertToCSV(filteredData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      FileSaver.saveAs(blob, `${this.nameOffile}_download.csv`);
    } else {
      // Handle case where no data is available
      //console.warn('No data available for CSV export');
    }
  }
 
  // Helper method to convert JSON to CSV format
  convertToCSV(data: any[]): string {
    const fixedHeaders = ['S No'];
    const fixedFields: string[] = [];
 
    // 🔁 Dynamically pick the correct columns
    const activeColumns = this.showToggleTable
      ? this.summaryColumns
      : this.selectedColumns;
 
    const dynamicHeaders = activeColumns.map((col) => col.header);
    const dynamicFields = activeColumns.map((col) => col.field);
 
    const headers = [...fixedHeaders, ...dynamicHeaders];
    const fields = [...fixedFields, ...dynamicFields];
 
    const csvRows = [
      headers.join(','), // Header row
      ...data.map((row, index) => {
        const values = [
          index + 1,
          ...fields.map((field) => {
            const value = row[field];
            if (
              typeof value === 'string' &&
              value.match(/^\d{4}-\d{2}-\d{2}T/)
            ) {
              const date = new Date(value);
              const formattedDate =
                date.getFullYear() +
                '-' +
                String(date.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(date.getDate()).padStart(2, '0') +
                ' ' +
                String(date.getHours()).padStart(2, '0') +
                ':' +
                String(date.getMinutes()).padStart(2, '0') +
                ':' +
                String(date.getSeconds()).padStart(2, '0');
              return formattedDate;
            }
            return value ?? '';
          }),
        ];
        return values.map((cell) => `"${cell}"`).join(',');
      }),
    ];
 
    return csvRows.join('\r\n');
  }
 
  exportExcel(dt: any) {
    const filteredData = dt.value;
 
    if (filteredData && filteredData.length > 0) {
      const activeColumns = this.showToggleTable
        ? this.summaryColumns
        : this.selectedColumns;
 
      const fixedHeaders = ['S No'];
      const dynamicHeaders = activeColumns.map((col) => col.header);
      const dynamicFields = activeColumns.map((col) => col.field);
      const headers = [...fixedHeaders, ...dynamicHeaders];
 
      const dataToExport = filteredData.map((row: any, index: number) => {
        const selectedRow: any = {};
        selectedRow['S No'] = index + 1;
 
        dynamicFields.forEach((field) => {
          const value = row[field];
 
          // Check if value is an ISO date string and format it
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
            const date = new Date(value);
            const formattedDate =
              date.getFullYear() +
              '-' +
              String(date.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date.getDate()).padStart(2, '0') +
              ' ' +
              String(date.getHours()).padStart(2, '0') +
              ':' +
              String(date.getMinutes()).padStart(2, '0') +
              ':' +
              String(date.getSeconds()).padStart(2, '0');
            selectedRow[field] = formattedDate;
          } else {
            selectedRow[field] = value;
          }
        });
 
        return selectedRow;
      });
 
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook: XLSX.WorkBook = {
        Sheets: { data: worksheet },
        SheetNames: ['data'],
      };
      const excelBuffer: any = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.saveAsExcelFile(excelBuffer, `${this.nameOffile}_download`);
    }
  }
 
  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, `${this.nameOffile}_download.xlsx`);
  }
 
  exportPDF(dt: any) {
    const filteredData: any[] = dt.value;
 
    if (filteredData && filteredData.length > 0) {
      const activeColumns = this.showToggleTable
        ? this.summaryColumns
        : this.selectedColumns;
 
      const fixedHeaders = ['S No'];
      const fixedFields: string[] = [];
 
      const dynamicHeaders = activeColumns.map((col) => col.header);
      const dynamicFields = activeColumns.map((col) => col.field);
 
      const headers = [...fixedHeaders, ...dynamicHeaders];
      const fields = [...fixedFields, ...dynamicFields];
 
      const data = filteredData.map((row: any, index: number) => {
        const rowData: (string | number)[] = [index + 1];
 
        fields.forEach((field) => {
          const value = row[field];
 
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
            // Parse the ISO string and format as 'YYYY-MM-DD HH:mm:ss'
            const date = new Date(value);
            const formattedDate =
              date.getFullYear() +
              '-' +
              String(date.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date.getDate()).padStart(2, '0') +
              ' ' +
              String(date.getHours()).padStart(2, '0') +
              ':' +
              String(date.getMinutes()).padStart(2, '0') +
              ':' +
              String(date.getSeconds()).padStart(2, '0');
            rowData.push(formattedDate);
          } else {
            rowData.push(value || '');
          }
        });
 
        return rowData;
      });
 
      const doc = new jsPDF('landscape');
      autoTable(doc, {
        head: [headers],
        body: data,
        styles: {
          fontSize: 8,
          cellPadding: 1,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          halign: 'center',
          fontSize: 9,
        },
        bodyStyles: {
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 20 },
        },
        pageBreak: 'auto',
        showHead: 'everyPage',
      });
 
      doc.save(`${this.nameOffile}.pdf`);
    } else {
      console.warn('No data available for PDF export');
    }
  }
}