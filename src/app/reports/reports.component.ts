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
import { UnitSettings } from '../settings/unit.service';
import { formatDate } from '@angular/common';
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
  coord_unit: string;
  water_level_unit_to: string;
  current_speed_unit_to: string;
  current_direction_unit_to: string;
  battery_unit_to: string;
  depth_unit_to: string;
  coord_unit_to: string;
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

export interface HighWaterTime {
  rank: number;
  datetime: string;
  water_level: number;
  dateFormatted: string;
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
  dateFormat!: string;

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
  exportSelectedOption: any = null;

  private baseUrl: string;
  private convertValues;

  units: UnitSettings = {
    waterLevel: '',
    currentSpeed: '',
    currentDirection: '',
    battery: '',
    depth: '',
    latandlong: '',
    datetime: '',
  };

  summaryColumns!: Column[];

  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    private base: BaseComponent
  ) {
    this.baseUrl = new GlobalConfig().baseUrl;
    this.convertValues = new GlobalConfig().convertValue;
  }

  unitssTo!: UnitSettings;

  ngOnInit(): void {
    this.files_list = [];
    this.http.get(`${this.baseUrl}files`).subscribe((response: any) => {
      this.files_list = response['data'];
      this.expandedFolders = this.files_list.map(() => false);
      this.fileID = this.base.fileId!;

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

      // If no matching file found, fallback to first folder with files
      if (folderIndex === -1) {
        folderIndex = this.files_list.findIndex(
          (folder) => folder.files && folder.files.length > 0
        );
        if (folderIndex !== -1) {
          selectedFolder = this.files_list[folderIndex];
          selectedFile = selectedFolder.files[0];
        }
      }
      this.nameOffile = selectedFolder?.files[0].file_name ?? '';

      // Expand the matched folder
      this.expandedFolders = this.files_list.map(
        (_, index) => index === folderIndex
      );

      // Set folder and file details if found
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

        // Fetch data for the file
        this.open_file(selectedFile.file_id);
      }
    });

    this.setupColumns();

    // check date format from settings
    const unitss: any =
      localStorage.getItem('unitSettings') ??
      '{"datetime": "01-Jan-2025 12:00:00"}';
    this.unitssTo = JSON.parse(unitss);

    if (this.unitssTo.datetime === '30-03-2025 12:00:00') {
      this.dateFormat = 'dd-MM-Y HH:mm:ss';
    } else if (this.unitssTo.datetime === '03-30-2025 12:00:00') {
      this.dateFormat = 'MM-dd-Y HH:mm:ss';
    } else {
      this.dateFormat = 'dd MMM yyyy HH:mm:ss';
    }
  }

  setupColumns() {
    if (!this.showToggleTable) {
      this.cols = [
        { field: 'station_id', header: 'Station ID', type: 'text' },
        { field: 'date', header: 'Time Stamp', type: 'text' },
        {
          field: 'lat',
          header: `Lat (${this.units.latandlong})`,
          type: 'text',
        },
        {
          field: 'lon',
          header: `Long (${this.units.latandlong})`,
          type: 'text',
        },
        { field: 'depth', header: `Depth (${this.units.depth})`, type: 'text' },
        {
          field: 'pressure',
          header: `Water Level (${this.units.waterLevel})`,
          type: 'text',
        },
        {
          field: 'speed',
          header: `Current Speed (${this.units.currentSpeed})`,
          type: 'text',
        },
        {
          field: 'direction',
          header: `Current Direction (${this.units.currentDirection})`,
          type: 'text',
        },
      ];
    } else {
      this.cols = [
        { field: 'timestamp', header: 'Date', type: 'text' },
        { field: 'name', header: 'Time', type: 'text' },
        {
          field: 'pressure',
          header: `Water Level (${this.units.waterLevel})`,
          type: 'text',
        },
        {
          field: 'speed',
          header: `Speed (${this.units.currentSpeed})`,
          type: 'text',
        },
        {
          field: 'direction',
          header: `Direction (${this.units.currentDirection})`,
          type: 'text',
        },
      ];
    }
    this.summaryColumns = [
      { field: 'timestamp', header: 'Time Stamp', type: 'text' },
      { field: 'name', header: 'Sequence', type: 'text' },
      {
        field: 'pressure',
        header: `Water Level (${this.units.waterLevel})`,
        type: 'text',
      },
    ];

    if (this.selectedHighWaterLevel?.value !== '0') {
      this.summaryColumns.push(
        {
          field: 'speed',
          header: `Speed (${this.units.currentSpeed})`,
          type: 'text',
        },
        {
          field: 'direction',
          header: `Direction (${this.units.currentDirection})`,
          type: 'text',
        }
      );
    }
    this.selectedColumns = this.cols;
    this.globalFilterFields = (
      !this.showToggleTable ? this.cols : this.summaryColumns
    ).map((col) => col.field);
  }

  selectedData: { name: string; value: string } = {
    name: 'Raw Data',
    value: 'raw',
  };
  dataTypeOptions = [
    { name: 'Raw Data', value: 'raw' },
    { name: 'Processed Data', value: 'processed' },
  ];
  selectedHighWaterLevel: { name: string; value: string } = {
    name: 'High & Low Water Level',
    value: '0',
  };
  highWaterLevelOptions = [
    { name: 'High & Low Water Level', value: '0' },
    { name: '1st High Water Level', value: '1' },
    { name: '2nd High Water Level', value: '2' },
    { name: '3rd High Water Level', value: '3' },
  ];

  exportOptions = [
    { label: 'Export to CSV', value: 'csv' },
    { label: 'Export to Excel', value: 'excel' },
    { label: 'Export to PDF', value: 'pdf' },
  ];
  nameOffile!: string;

  fileID!: number;

  // Decimal conversion
  formatValue(value: any): string {
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toFixed(4);
  }

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
    this.base.fileId = file_id;
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

    this.http
      .get(
        `${this.baseUrl}${
          this.selectedData.value === 'processed'
            ? 'get_processed_data'
            : 'fetch_data_by_file'
        }/${file_id}`
      )
      .subscribe((response: any) => {
        this.last_row =
          response.length > 0 ? response[response.length - 1] : null;
        this.main_table = [];
        setTimeout(() => {
          for (let index = 0; index < response.length; index++) {
            const row = { ...response[index] };

            if (row.date) {
              const date = new Date(row.date);
              row.date = formatDate(date, this.dateFormat, 'en-US');
            }

            // Decimal conversion
            ['pressure', 'speed', 'direction', 'depth'].forEach((key) => {
              if (row[key] != null) {
                row[key] = this.formatValue(row[key]);
              }
            });

            this.main_table.push(row);
          }
          this.checkForConversion();

          // Annotate rows with top 6 high/low tide information
          const { high, low } = this.getTop6HighAndLowWaterTimes();
          const tideMap = new Map<
            string,
            { rank: number; type: 'high' | 'low' }
          >();
          high.forEach((h) =>
            tideMap.set(h.datetime, { rank: h.rank, type: 'high' })
          );
          low.forEach((l) =>
            tideMap.set(l.datetime, { rank: l.rank, type: 'low' })
          );

          this.main_table = this.main_table.map((r) => {
            const ann = tideMap.get(r.date);
            if (ann) {
              return { ...r, tide_rank: ann.rank, tide_type: ann.type };
            }
            return r;
          });
        }, 100);
      });
  }

  checkForConversion() {
    this.units.battery = this.main_table[0].battery_unit_to;
    this.units.currentDirection = this.main_table[0].current_direction_unit_to;
    this.units.currentSpeed = this.main_table[0].current_speed_unit_to;
    this.units.depth = this.main_table[0].depth_unit_to;
    this.units.waterLevel = this.main_table[0].water_level_unit_to;
    this.units.latandlong = this.main_table[0].coord_unit_to;

    this.setupColumns();

    const sourceUnits: { [key: string]: string } = {
      waterLevel: this.main_table[0].water_level_unit,
      currentSpeed: this.main_table[0].current_speed_unit,
      currentDirection: this.main_table[0].current_direction_unit,
      battery: this.main_table[0].battery_unit,
      depth: this.main_table[0].depth_unit,
      latandlong: this.main_table[0].coord_unit,
    };

    const unitsMatch = Object.keys(this.units).every((key) => {
      if (key == 'datetime') {
        return true;
      }
      return this.units[key] == sourceUnits[key];
    });

    if (!unitsMatch) {
      this.main_table = this.main_table.map((item, index) => {
        const newItem = { ...item } as ApiData;

        // if waterLevel unit mismatches → convert pressure
        if (sourceUnits['waterLevel'] !== this.units['waterLevel']) {
          if (newItem.pressure !== null && newItem.pressure !== undefined) {
            const converted = this.convertValues(
              +item.pressure,
              sourceUnits['waterLevel'],
              this.units['waterLevel']
            );
            newItem.pressure = converted.toString();
            this.main_table[index].pressure = converted.toString();
          }
        }

        // if currentSpeed unit mismatches → convert speed
        if (sourceUnits['currentSpeed'] !== this.units['currentSpeed']) {
          if (newItem.speed !== null && newItem.speed !== undefined) {
            const converted = this.convertValues(
              +item.speed,
              sourceUnits['currentSpeed'],
              this.units['currentSpeed']
            );
            newItem.speed = converted.toString();
            this.main_table[index].speed = converted.toString();
          }
        }

        // if currentDirection unit mismatches → convert direction
        if (
          sourceUnits['currentDirection'] !== this.units['currentDirection']
        ) {
          if (newItem.direction !== null && newItem.direction !== undefined) {
            const converted = this.convertValues(
              +item.direction,
              sourceUnits['currentDirection'],
              this.units['currentDirection']
            );
            newItem.direction = converted.toString();
            this.main_table[index].direction = converted.toString();
          }
        }

        // depth
        if (sourceUnits['depth'] !== this.units['depth']) {
          if (newItem.depth !== null && newItem.depth !== undefined) {
            const converted = this.convertValues(
              +item.depth,
              sourceUnits['depth'],
              this.units['depth']
            );
            newItem.depth = converted.toString();
            this.main_table[index].depth = converted.toString();
          }
        }

        // lat conversion
        if (sourceUnits['latandlong'] !== this.units['latandlong']) {
          if (newItem.lat !== null && newItem.lat !== undefined) {
            let lat: number | string;
            if (this.units['latandlong'] == 'dd') {
              const latDms = item.lat.split(',').map(Number);
              lat = `${latDms[0]}°${latDms[1]}'${latDms[2]}''`;
            } else {
              lat = +item.lat;
            }

            const converted = this.convertValues(
              lat,
              sourceUnits['latandlong'],
              this.units['latandlong']
            );
            newItem.lat = converted.toString();
            this.main_table[index].lat = converted.toString();
          }
        }

        // long conversion
        if (sourceUnits['latandlong'] !== this.units['latandlong']) {
          if (newItem.lon !== null && newItem.lon !== undefined) {
            let lon: number | string;
            if (this.units['latandlong'] == 'dd') {
              const lonDms = item.lon.split(',').map(Number);
              lon = `${lonDms[0]}°${lonDms[1]}'${lonDms[2]}''`;
            } else {
              lon = +item.lon;
            }
            const converted = this.convertValues(
              lon,
              sourceUnits['latandlong'],
              this.units['latandlong']
            );
            newItem.lon = converted.toString();
            this.main_table[index].lon = converted.toString();
          }
        }

        return newItem;
      });
    } else {
      this.main_table = this.main_table.map((item, index) => {
        const newItem = { ...item } as ApiData;

        // lat conversion
        if (sourceUnits['latandlong'] == this.units['latandlong']) {
          if (newItem.lat !== null && newItem.lat !== undefined) {
            if (sourceUnits['latandlong'] == 'dms') {
              const latDms = item.lat.split(',').map(Number);
              const lonDms = item.lon.split(',').map(Number);

              newItem.lat = `${latDms[0]}°${latDms[1]}'${latDms[2]}''`;
              newItem.lon = `${lonDms[0]}°${lonDms[1]}'${lonDms[2]}''`;
            }
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

  getTop6HighAndLowWaterTimes(): {
    high: HighWaterTime[];
    low: HighWaterTime[];
  } {
    if (!this.main_table || this.main_table.length === 0) {
      return { high: [], low: [] };
    }

    const validData = this.main_table
      .map((d) => ({
        datetime: d.date,
        water_level: parseFloat(d.pressure),
      }))
      .filter((d) => !isNaN(d.water_level));

    if (validData.length < 6) {
      console.warn('Not enough valid tide data to find 6 highs and 6 lows');
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

    // Pick top 6 highs and lows by water level
    const topHighs = highs
      .sort((a, b) => b.water_level - a.water_level)
      .slice(0, 6)
      .map((d, i) => ({ ...d, rank: i + 1 }));

    const topLows = lows
      .sort((a, b) => a.water_level - b.water_level)
      .slice(0, 6)
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

  toggle_tap(highWaterLevelNumber: string | number) {
    highWaterLevelNumber = Number(highWaterLevelNumber);
    this.setupColumns();

    // Use pre-annotated ranks/types from main_table
    const topHighs: HighWaterTime[] = this.main_table
      .filter(
        (r: any) => r.tide_type === 'high' && typeof r.tide_rank === 'number'
      )
      .map((r: any) => ({
        rank: r.tide_rank,
        datetime: r.date,
        water_level: parseFloat(r.pressure),
        dateFormatted: this.formatHighWaterTimeDisplay(r.date),
      }))
      .filter((h) => !isNaN(h.water_level))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6);

    const topLows: HighWaterTime[] = this.main_table
      .filter(
        (r: any) => r.tide_type === 'low' && typeof r.tide_rank === 'number'
      )
      .map((r: any) => ({
        rank: r.tide_rank,
        datetime: r.date,
        water_level: parseFloat(r.pressure),
        dateFormatted: this.formatHighWaterTimeDisplay(r.date),
      }))
      .filter((l) => !isNaN(l.water_level))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6);

    // If input is 0, return all 6 highs and 6 lows with value and timestamp
    if (highWaterLevelNumber === 0) {
      this.toggleTableData = [];

      topHighs.forEach((h) => {
        const ts = formatDate(new Date(h.datetime), this.dateFormat, 'en-US');
        const suffix = this.getOrdinalSuffix(h.rank);
        this.toggleTableData.push({
          name: `${h.rank}${suffix} High`,
          timestamp: ts,
          pressure: h.water_level,
          speed: NaN,
          direction: NaN,
        });
      });

      topLows.forEach((l) => {
        const ts = formatDate(new Date(l.datetime), this.dateFormat, 'en-US');
        const suffix = this.getOrdinalSuffix(l.rank);
        this.toggleTableData.push({
          name: `${l.rank}${suffix} Low`,
          timestamp: ts,
          pressure: l.water_level,
          speed: NaN,
          direction: NaN,
        });
      });

      return;
    }

    if (topHighs.length < highWaterLevelNumber) {
      console.error(
        `No ${highWaterLevelNumber}${this.getOrdinalSuffix(
          highWaterLevelNumber
        )} high water level found. Only ${topHighs.length} available.`
      );
      throw new Error(`Insufficient high water level data`);
    }

    // Find the high water level with the specified rank
    const targetHighWater = topHighs.find(
      (h) => h.rank === highWaterLevelNumber
    );

    if (!targetHighWater) {
      console.error(
        `High water level with rank ${highWaterLevelNumber} not found`
      );
      throw new Error(`High water level ${highWaterLevelNumber} not found`);
    }

    try {
      const targetDateTime = new Date(targetHighWater.datetime);

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

      // Find the exact record in main_table for the target high water time
      const currentData = this.main_table.find(
        (item) => new Date(item.date).getTime() === targetDateTime.getTime()
      );

      if (!currentData) {
        throw new Error('Could not find exact record for high water time');
      }

      // Prepare toggleTableData with averaged values
      this.toggleTableData = [];

      for (let i = 0; i < 6; i++) {
        const timestamp = new Date(targetDateTime);
        timestamp.setHours(timestamp.getHours() - (6 - i));
        const formattedDate = formatDate(timestamp, this.dateFormat, 'en-US');

        const suffix = this.getOrdinalSuffix(i + 1);
        this.toggleTableData.push({
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
      const currentFormattedDate = formatDate(
        currentTimestamp,
        this.dateFormat,
        'en-US'
      );

      // Create appropriate label based on high water level number and rank
      const highWaterLabel = this.getHighWaterLevelLabel(highWaterLevelNumber);

      this.toggleTableData.push({
        name: highWaterLabel,
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
        const formattedDate = formatDate(timestamp, this.dateFormat, 'en-US');

        const suffix = this.getOrdinalSuffix(i + 1);
        this.toggleTableData.push({
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
    } catch (error) {
      this.toast.error(
        `Error processing ${highWaterLevelNumber}${this.getOrdinalSuffix(
          highWaterLevelNumber
        )} high water level data. Please check the data.`,
        'Error'
      );
    }
  }

  // Updated helper method to support up to 6 high water levels
  getHighWaterLevelLabel(level: number): string {
    switch (level) {
      case 1:
        return '1st High Water Time';
      case 2:
        return '2nd High Water Time';
      case 3:
        return '3rd High Water Time';
      case 4:
        return '4th High Water Time';
      case 5:
        return '5th High Water Time';
      case 6:
        return '6th High Water Time';
      default:
        return 'High Water Time';
    }
  }

  onDataTypeChange() {
    if (this.selectedFiles.length > 0) {
      const fileId = this.selectedFiles[0].file_id;
      this.open_file(fileId);
    }
  }

  onHighWaterLevelChange(highWaterLevelNumber: string | number) {
    this.setupColumns();
    this.toggle_tap(highWaterLevelNumber);
  }

  getRowStyle(row: any): { [key: string]: string } {
    if (row.highlight) {
      return { 'background-color': '#ffeb3b' }; // Highlight color for high water level
    }

    // Fallback styling when tide_type is provided on raw data rows
    if (row.tide_type === 'high') {
      return { 'background-color': '#c5e1ff' };
    }
    if (row.tide_type === 'low') {
      return { 'background-color': '#ffe0c5' };
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
          (r) =>
            typeof r.name === 'string' && r.name.includes('High Water Time')
        );

        const index = this.toggleTableData.findIndex((r) => r === row);
        if (index < highIndex) {
          return { 'background-color': '#c5e1ff' }; // Light blue for before
        } else if (index > highIndex) {
          return { 'background-color': '#ffe0c5' }; // Light orange for after
        }
      }
    }

    return {}; // Default
  }

  getRowClass(row: any): string {
    if (row.highlight) {
      return 'highlight-row';
    }

    // Apply classes based on tide_type when available on raw data rows
    if (row.tide_type === 'high') {
      return 'peak-row';
    }
    if (row.tide_type === 'low') {
      return 'before-row';
    }

    if (typeof row.name === 'string') {
      if (row.name.includes('High Water')) {
        return 'peak-row';
      }

      const match = row.name.match(/^(\d+)(?:st|nd|rd|th)$/);
      if (match) {
        const hour = +match[1];
        const highIndex = this.toggleTableData.findIndex(
          (r) =>
            typeof r.name === 'string' && r.name.includes('High Water Time')
        );
        const index = this.toggleTableData.findIndex((r) => r === row);

        if (index < highIndex) return 'before-row';
        if (index > highIndex) return 'after-row';
      }
    }

    return '';
  }

  onExportOptionSelect(selectedOption: string, dt2: any) {
    // const selectedOption = event.value;
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

    setTimeout(() => {
      this.exportSelectedOption = null;
    });
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

  convertToCSV(data: any[]): string {
    const fixedHeaders = ['S No'];
    const fixedFields: string[] = [];

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
            let value = row[field] ?? '';
            if (field === 'date') {
              return `'${value}`;
            }
            return value;
          }),
        ];
        return values
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',');
      }),
    ];

    // Add UTF-8 BOM
    return '\uFEFF' + csvRows.join('\r\n');
  }

  exportExcel(dt: any) {
    const filteredData = dt.filteredValue || dt.value;

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

      // ⛳ Use array of arrays instead of CSV rows for Excel
      const dataToExport: (string | number)[][] = [
        headers, // header row as an array
        ...filteredData.map((row: any, index: number) => {
          const values = [
            index + 1,
            ...fields.map((field: string) => {
              const value = row[field];
              // if (
              //   typeof value === 'string' &&
              //   value.match(/^\d{4}-\d{2}-\d{2}T/)
              // ) {
              //   const date = new Date(value);
              //   const formattedDate = formatDate(date, this.dateFormat, 'en-US');
              //   return formattedDate;
              // }
              return value ?? '';
            }),
          ];
          return values;
        }),
      ];

      const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(dataToExport);
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
    const hexToRgb = (hex: string): [number, number, number] => {
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((c) => c + c)
          .join('');
      }
      const bigint = parseInt(hex, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const filteredData = dt.filteredValue || dt.value;

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
            // const date = new Date(value);
            // const formattedDate = formatDate(date, this.dateFormat, 'en-US');
            rowData.push(value);
          } else {
            rowData.push(value || '');
          }
        });
        return rowData;
      });

      // Get theme-based CSS variable values
      const tableBgColor =
        this.getCSSVariableValue('--tablebgcolor') || '#ffffff';
      const rowStripeColor =
        this.getCSSVariableValue('--row-stripe-color') || '#f9f9f9';
      const fontColor = this.getCSSVariableValue('--font-color') || '#000000';

      const highlightRowColor =
        this.getCSSVariableValue('--highlight-row-color') || '#ffeb3b';
      const highlightFontColor =
        this.getCSSVariableValue('--highlight-font-color') || '#212529';

      const peakRowColor =
        this.getCSSVariableValue('--peak-row-color') || '#c5e1ff';
      const peakFontColor =
        this.getCSSVariableValue('--peak-font-color') || '#212529';

      const beforeRowColor =
        this.getCSSVariableValue('--before-row-color') || '#e0f7fa';
      const beforeFontColor =
        this.getCSSVariableValue('--before-font-color') || '#212529';

      const afterRowColor =
        this.getCSSVariableValue('--after-row-color') || '#fff3e0';
      const afterFontColor =
        this.getCSSVariableValue('--after-font-color') || '#212529';

      const doc = new jsPDF('landscape');
      autoTable(doc, {
        head: [headers],
        body: data,
        styles: {
          fontSize: 8,
          cellPadding: 1,
          overflow: 'linebreak',
          valign: 'middle',
          textColor: hexToRgb(fontColor),
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
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const rowData = filteredData[rowIndex];
            const rowClass = this.getRowClass(rowData);

            switch (rowClass) {
              case 'highlight-row':
                data.cell.styles.fillColor = hexToRgb(highlightRowColor);
                data.cell.styles.textColor = hexToRgb(highlightFontColor);
                break;
              case 'peak-row':
                data.cell.styles.fillColor = hexToRgb(peakRowColor);
                data.cell.styles.textColor = hexToRgb(peakFontColor);
                break;
              case 'before-row':
                data.cell.styles.fillColor = hexToRgb(beforeRowColor);
                data.cell.styles.textColor = hexToRgb(beforeFontColor);
                break;
              case 'after-row':
                data.cell.styles.fillColor = hexToRgb(afterRowColor);
                data.cell.styles.textColor = hexToRgb(afterFontColor);
                break;
              default:
                data.cell.styles.fillColor =
                  rowIndex % 2 === 0
                    ? hexToRgb(rowStripeColor)
                    : hexToRgb(tableBgColor);
                data.cell.styles.textColor = hexToRgb(fontColor);
                break;
            }
          }
        },
        pageBreak: 'auto',
        showHead: 'everyPage',
      });

      doc.save(`${this.nameOffile}.pdf`);
    } else {
      console.warn('No data available for PDF export');
    }
  }

  getCSSVariableValue(variableName: string): string {
    return getComputedStyle(document.body)
      .getPropertyValue(variableName)
      .trim();
  }
}
