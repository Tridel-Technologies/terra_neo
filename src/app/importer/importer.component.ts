import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { GlobalConfig } from '../global/app.global';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LandingComponent } from './landing/landing.component';
import { BaseComponent } from '../base/base.component';
import { UnitService, UnitSettings } from '../settings/unit.service';

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
  selector: 'app-importer',
  imports: [CommonModule, HttpClientModule, FormsModule, LandingComponent],
  templateUrl: './importer.component.html',
  styleUrl: './importer.component.css',
  providers: [DatePipe, GlobalConfig],
})
export class ImporterComponent {
  showImport: boolean = false;
  errorMessage: string = '';
  maxFileSizeMB = 5;
  tableData: any[] = [];
  displayedColumns: string[] = [];
  historyData: any = [];
  FileName!: string;
  is_show_import: boolean = false;
  files_list: Folders[] = [];
  allowFolderUpload: boolean = false;
  uploaded_files: string[] = [];
  expandedFolders: boolean[] = [];
  opened_file!: string;
  openedFolder!: number;
  selectedFiles: any[] = []; // Array to track selected files
  isMulti: boolean = false;
  main_table: any[] = [];
  fileWiseUploadData: { [fileName: string]: any[] } = {};
  isFilesLoading: boolean = false;
  latitude: number | string | null = null;
  lon: number | string | null = null;
  high_water_level!: string;
  selectedRowIndex: number | null = null;
  selectedRowData: any = null;
  lonDeg!: number | null;
  lonMin!: number | null;
  lonSec!: number | null;
  latDeg!: number | null;
  latMin!: number | null;
  latSec!: number | null;
  row_isempty: boolean = false;
  dateFormat!: string;

  latlongType: 'dd' | 'dms' = 'dd';

  unitSettings = [
    {
      key: 'waterLevel',
      label: 'Water Level',
      iconClass: 'fas fa-water', // or use another icon library
      units: ['m', 'ft', 'cm'],
      unitslabels: ['m', 'ft', 'cm'],
    },
    {
      key: 'currentSpeed',
      label: 'Current Speed',
      iconClass: 'fas fa-tachometer-alt',
      units: ['m/s', 'knots'],
      unitslabels: ['m/s', 'kn'],
    },
    {
      key: 'currentDirection',
      label: 'Current Direction',
      iconClass: 'fas fa-compass',
      units: ['°', 'radians'],
      unitslabels: ['deg', 'rad'],
    },
    {
      key: 'battery',
      label: 'Battery',
      iconClass: 'fas fa-battery-full',
      units: ['volts', '%'],
      unitslabels: ['volt', 'per'],
    },
    {
      key: 'depth',
      label: 'Depth',
      iconClass: 'fas fa-arrows-down-to-line',
      units: ['m', 'ft'],
      unitslabels: ['m', 'ft'],
    },
    // {
    //   key: 'temperature',
    //   label: 'Temperature',
    //   iconClass: 'fas fa-temperature-half',
    //   units: ['°C', '°F'],
    //   unitslabels: ['°C', '°F'],
    // },
    // {
    //   key: 'latandlong',
    //   label: 'Latitude and Longitude',
    //   iconClass: 'fas fa-map-marker-alt',
    //   units: ['DD', 'DMS'],
    // },
  ];

  main_table_headers_spc = [
    { name: 'Station', unit: '' },
    { name: 'Date', unit: '' },
    { name: 'Speed', unit: '' },
    { name: 'Direction', unit: '' },
    { name: 'Depth', unit: '' },
    { name: 'Pressure', unit: '' },
    { name: 'Battery', unit: '' },
  ];

  main_table_headers_awac = [
    { name: 'Date', unit: '' },
    { name: 'Battery', unit: '' },
    { name: 'Pressure', unit: '' },
    // { name: 'Temperature', unit: '' },
    { name: 'Pitch', unit: '' },
    { name: 'Roll', unit: '' },
    { name: 'Heading', unit: '' },
    { name: 'Speed Bin1', unit: '' },
    { name: 'Direction Bin1', unit: '' },
    { name: 'Speed Bin2', unit: '' },
    { name: 'Direction Bin2', unit: '' },
    { name: 'Speed Bin3', unit: '' },
    { name: 'Direction Bin3', unit: '' },
    { name: 'Speed Bin4', unit: '' },
    { name: 'Direction Bin4', unit: '' },
    { name: 'Speed Bin5', unit: '' },
    { name: 'Direction Bin5', unit: '' },
    { name: 'Speed Bin6', unit: '' },
    { name: 'Direction Bin6', unit: '' },
    { name: 'Speed Bin7', unit: '' },
    { name: 'Direction Bin7', unit: '' },
    { name: 'Speed Bin8', unit: '' },
    { name: 'Direction Bin8', unit: '' },
    { name: 'Speed Bin9', unit: '' },
    { name: 'Direction Bin9', unit: '' },
    { name: 'Speed Bin10', unit: '' },
    { name: 'Direction Bin10', unit: '' },
    { name: 'Speed Bin11', unit: '' },
    { name: 'Direction Bin11', unit: '' },
    { name: 'Speed Bin12', unit: '' },
    { name: 'Direction Bin12', unit: '' },
    { name: 'Speed Bin13', unit: '' },
    { name: 'Direction Bin13', unit: '' },
    { name: 'Speed Bin14', unit: '' },
    { name: 'Direction Bin14', unit: '' },
    { name: 'Speed Bin15', unit: '' },
    { name: 'Direction Bin15', unit: '' },
    { name: 'Speed Bin16', unit: '' },
    { name: 'Direction Bin16', unit: '' },
    { name: 'Speed Bin17', unit: '' },
    { name: 'Direction Bin17', unit: '' },
    { name: 'Speed Bin18', unit: '' },
    { name: 'Direction Bin18', unit: '' },
    { name: 'Speed Bin19', unit: '' },
    { name: 'Direction Bin19', unit: '' },
    { name: 'Speed Bin20', unit: '' },
    { name: 'Direction Bin20', unit: '' },
  ];

  active_headers = this.main_table_headers_spc;

  // Upload table headers (used in import popup)
  upload_active_headers = this.main_table_headers_spc;

  getTooltip(paramKey: string, unit: string): string {
    const isNmea =
      this.active_headers === this.main_table_headers_awac ||
      this.upload_active_headers === this.main_table_headers_awac;

    // For .nmea (AWAC), there is no Depth; suppress its tooltip
    if (isNmea && paramKey === 'depth') return '';

    const tooltips: any = {
      waterLevel: {
        m: 'Meter',
        ft: 'Feet',
        cm: 'Centimeter',
      },
      currentSpeed: {
        'm/s': 'Meters per second',
        knots: 'Knots',
      },
      currentDirection: {
        '°': 'Degree',
        radians: 'Radian',
      },
      battery: {
        volts: 'Volt',
        '%': 'Percentage',
      },
      depth: {
        m: 'Meters',
        ft: 'Feet',
      },
      // Temperature tooltip (relevant for .nmea/AWAC)
      // temperature: {
      //   '°C': 'Celsius',
      //   C: 'Celsius',
      //   '°F': 'Fahrenheit',
      //   F: 'Fahrenheit',
      // },
      latandlong: {
        DD: 'Decimal Degree',
        DMS: 'Degree, Minute, Second',
      },
    };

    // If not .nmea, hide temperature tooltip by default
    if (!isNmea && paramKey === 'temperature') return '';

    return tooltips[paramKey]?.[unit] || '';
  }

  // Tab logic for unit selection
  activeUnitTab: 'from' | 'to' = 'from';
  selectedUnitsFrom: any = {};
  selectedUnitsTo: any = {};

  // Update selectUnit to work with tabs
  selectUnit(paramKey: string, unit: string, type: 'from' | 'to') {
    if (type === 'from') {
      this.selectedUnitsFrom[paramKey] = unit;
    } else {
      this.selectedUnitsTo[paramKey] = unit;
    }
  }

  // Helper for template to get selected unit for current tab
  getSelectedUnit(paramKey: string): string {
    if (this.activeUnitTab === 'from') {
      return this.selectedUnitsFrom[paramKey];
    } else {
      return this.selectedUnitsTo[paramKey];
    }
  }

  // Computed unit settings for UI: for AWAC (.nmea) hide Depth and show Temperature
  get activeUnitSettings() {
    const isNmea =
      this.active_headers === this.main_table_headers_awac ||
      this.upload_active_headers === this.main_table_headers_awac;
    if (!isNmea) return this.unitSettings;

    const filtered = this.unitSettings.filter((p) => p.key !== 'depth');
    // const hasTemperature = filtered.some((p) => p.key === 'temperature');
    // if (!hasTemperature) {
    //   filtered.push({
    //     key: 'temperature',
    //     label: 'Temperature',
    //     iconClass: 'fas fa-temperature-half',
    //     units: ['°C', '°F'],
    //     unitslabels: ['°C', '°F'],
    //   });
    // }
    return filtered;
  }

  onRowClick(row: any, index: number) {
    this.selectedRowIndex = index;
    this.selectedRowData = row;
    const date = new Date(row.date);
    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
    this.high_water_level = `${formattedDate}`;
  }

  showCoordinates = true;

  toggleCoordinates() {
    this.showCoordinates = !this.showCoordinates;
  }

  update_Values() {
    if (this.latlongType === 'dd') {
      if (this.latitude === null && this.lon === null) {
        this.toast.warning('Please enter coordinates', 'Error', {
          timeOut: 1000,
        });
        return;
      }
    } else {
      if (
        this.latDeg === null ||
        this.latMin === null ||
        this.latSec === null ||
        this.lonDeg === null ||
        this.lonMin === null ||
        this.lonSec === null
      ) {
        this.toast.warning('Please enter coordinates', 'Error', {
          timeOut: 1000,
        });
        return;
      }
    }
    const files = [];
    for (let index = 0; index < this.selectedFiles.length; index++) {
      files.push(this.selectedFiles[index]);
    }
    // file_name, lat, lon, high_water_level

    let data = {};
    if (this.latlongType === 'dd') {
      data = {
        file_name: files,
        lat: this.latitude,
        lon: this.lon,
        high_water_level: this.high_water_level,
        unit: this.latlongType,
      };
    } else {
      const lat = `${this.latDeg},${this.latMin},${this.latSec}`;
      const lon = `${this.lonDeg},${this.lonMin},${this.lonSec}`;
      data = {
        file_name: files,
        lat: lat,
        lon: lon,
        high_water_level: this.high_water_level,
        unit: this.latlongType,
      };
    }
    this.update(data);
  }
  showoption: boolean = false;
  update(data: any) {
    this.http
      .post(`${this.baseUrl}update_values`, data)
      .subscribe((response: any) => {
        this.toast.success('Update successful', 'Success');
        this.showoption = true;
        this.showoption = true;
      });
  }
  FileID!: number;
  // this.globe.fileId=this.FileID
  onCancel() {
    this.showoption = false;
  }
  onYes() {
    this.globe.fileId = this.FileID;
    setTimeout(() => {
      this.globe.index = 1;
    }, 100);
  }

  private baseUrl: string;
  private convertValues;

  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    private datePipe: DatePipe,
    private globe: BaseComponent,
    private unitService: UnitService
  ) {
    this.baseUrl = new GlobalConfig().baseUrl;
    this.convertValues = new GlobalConfig().convertValue;
    this.selectedUnitsFrom = { ...this.unitService.getCurrentUnits() };
    this.selectedUnitsTo = { ...this.unitService.getCurrentUnits() };
  }

  main_table_headers = [
    { name: 'Station', unit: '' },
    { name: 'Date', unit: '' },
    { name: 'Speed', unit: '' },
    { name: 'Direction', unit: '' },
    { name: 'Depth', unit: '' },
    { name: 'Water Level', unit: '' },
    { name: 'Battery', unit: '' },
  ];

  open_file(file_name: string, file_id: number) {
    this.opened_file = file_name;
    const data = {
      folder_id: file_id,
      file_name: file_name,
    };
    // Switch headers based on file extension
    const ext = (this.opened_file?.split('.').pop() || '').toLowerCase();
    this.active_headers =
      ext === 'nmea'
        ? this.main_table_headers_awac
        : this.main_table_headers_spc;
    this.http
      .get(`${this.baseUrl}fetch_data_by_file/${file_id}`)
      .subscribe((response: any) => {
        // Prefer explicit type from API when present
        try {
          const first =
            Array.isArray(response) && response.length ? response[0] : {};
          if (first && typeof first.type === 'string') {
            const t = String(first.type).toLowerCase();
            if (t === 'awac') {
              this.active_headers = this.main_table_headers_awac;
            } else if (t === 'spc') {
              this.active_headers = this.main_table_headers_spc;
            }
          }
        } catch {}
        // Auto-detect AWAC style based on response keys as a fallback to extension-based detection
        try {
          const first =
            Array.isArray(response) && response.length ? response[0] : {};
          const hasAwacKeys =
            first &&
            ('datetime' in first ||
              'bin_1_speed' in first ||
              'bin_1_direction' in first ||
              'speed_bin1' in first ||
              'direction_bin1' in first);
          if (hasAwacKeys) {
            this.active_headers = this.main_table_headers_awac;
          }
        } catch {}
        if (this.isMulti) {
          let data = this.main_table;
          this.main_table = [];
          setTimeout(() => {
            this.main_table = data;
            let maxPressureRow = this.main_table.reduce((max, item) => {
              return parseFloat(item.pressure) > parseFloat(max.pressure)
                ? item
                : max;
            });

            // Set units to header
            this.active_headers.forEach((header) => {
              switch (header.name.toLowerCase()) {
                case 'speed':
                  header.unit = this.main_table[0].current_speed_unit || '';
                  break;
                case 'direction':
                  header.unit = this.main_table[0].current_direction_unit || '';
                  break;
                case 'depth':
                  header.unit = this.main_table[0].depth_unit || '';
                  break;
                case 'battery':
                  header.unit = this.main_table[0].battery_unit || '';
                  break;
                case 'water level':
                  header.unit = this.main_table[0].water_level_unit || '';
                  break;
                default:
                  break;
              }
            });

            const { coord_unit, coord_unit_to, lat, lon } = this.main_table[0];
            // Set default latlongType
            this.latlongType = coord_unit_to?.length ? coord_unit_to : 'dd';

            // Handle coordinate conversion if units differ
            if (coord_unit != null && coord_unit_to != null) {
              if (coord_unit !== coord_unit_to) {
                const convert = (value: any) =>
                  this.ddtoDms(parseFloat(value), coord_unit, coord_unit_to);

                if (coord_unit_to === 'dd') {
                  const latDms = lat.split(',').map(Number);
                  const lonDms = lon.split(',').map(Number);

                  const latDms1 = `${latDms[0]}°${latDms[1]}'${latDms[2]}''`;
                  const lonDms1 = `${lonDms[0]}°${lonDms[1]}'${lonDms[2]}''`;
                  this.latitude = this.ddtoDms(
                    latDms1,
                    coord_unit,
                    coord_unit_to
                  );
                  this.lon = this.ddtoDms(lonDms1, coord_unit, coord_unit_to);
                } else {
                  const latDms = convert(lat);
                  const lonDms = convert(lon);

                  Object.assign(this, {
                    latDeg: latDms.deg,
                    latMin: latDms.min,
                    latSec: latDms.sec,
                    lonDeg: lonDms.deg,
                    lonMin: lonDms.min,
                    lonSec: lonDms.sec,
                  });
                }
              } else {
                if (coord_unit_to === 'dd') {
                  this.latitude = lat;
                  this.lon = lon;
                } else {
                  const latDms = lat.split(',').map(Number);
                  const lonDms = lon.split(',').map(Number);

                  Object.assign(this, {
                    latDeg: latDms[0],
                    latMin: latDms[1],
                    latSec: latDms[2],
                    lonDeg: lonDms[0],
                    lonMin: lonDms[1],
                    lonSec: lonDms[2],
                  });
                }
              }
            }
          }, 100);
        } else {
          this.main_table = [];
          setTimeout(() => {
            this.main_table = response;
            let maxPressureIndex = 0;
            let maxPressureValue = parseFloat(this.main_table[0].pressure);

            for (let i = 1; i < this.main_table.length; i++) {
              let currentPressure = parseFloat(this.main_table[i].pressure);
              if (currentPressure > maxPressureValue) {
                maxPressureValue = currentPressure;
                maxPressureIndex = i;
              }
            }

            let maxPressureRow = this.main_table[maxPressureIndex];
            this.selectedRowIndex = maxPressureIndex;

            // Scroll to that row
            setTimeout(() => {
              const rowElement = document.getElementById(
                `row-${this.selectedRowIndex}`
              );
              if (rowElement) {
                rowElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            }, 100);
            const date = new Date(
              maxPressureRow.date || maxPressureRow.datetime
            );
            const formattedDate = this.datePipe.transform(
              date,
              'yyyy-MM-dd HH:mm:ss'
            );

            const high = this.main_table.filter(
              (item) => item.high_water_level === 1
            );
            this.high_water_level = high[0].date;

            // Set units to header
            this.active_headers.forEach((header) => {
              switch (header.name.toLowerCase()) {
                case 'speed':
                  header.unit = this.main_table[0].current_speed_unit || '';
                  break;
                case 'direction':
                  header.unit = this.main_table[0].current_direction_unit || '';
                  break;
                case 'depth':
                  header.unit = this.main_table[0].depth_unit || '';
                  break;
                case 'battery':
                  header.unit = this.main_table[0].battery_unit || '';
                  break;
                case 'water level':
                  header.unit = this.main_table[0].water_level_unit || '';
                  break;
                default:
                  break;
              }
            });

            const { coord_unit, coord_unit_to, lat, lon } = this.main_table[0];
            // Set default latlongType
            this.latlongType = coord_unit_to?.length ? coord_unit_to : 'dd';

            // Handle coordinate conversion if units differ
            if (coord_unit != null && coord_unit_to != null) {
              if (coord_unit !== coord_unit_to) {
                const convert = (value: any) =>
                  this.ddtoDms(parseFloat(value), coord_unit, coord_unit_to);

                if (coord_unit_to === 'dd') {
                  const latDms = lat.split(',').map(Number);
                  const lonDms = lon.split(',').map(Number);

                  const latDms1 = `${latDms[0]}°${latDms[1]}'${latDms[2]}''`;
                  const lonDms1 = `${lonDms[0]}°${lonDms[1]}'${lonDms[2]}''`;

                  this.latitude = this.ddtoDms(
                    latDms1,
                    coord_unit,
                    coord_unit_to
                  );
                  this.lon = this.ddtoDms(lonDms1, coord_unit, coord_unit_to);
                } else {
                  const latDms = convert(lat);
                  const lonDms = convert(lon);

                  Object.assign(this, {
                    latDeg: latDms.deg,
                    latMin: latDms.min,
                    latSec: latDms.sec,
                    lonDeg: lonDms.deg,
                    lonMin: lonDms.min,
                    lonSec: lonDms.sec,
                  });
                }
              } else {
                if (coord_unit_to === 'dd') {
                  this.latitude = lat;
                  this.lon = lon;
                } else {
                  const latDms = lat.split(',').map(Number);
                  const lonDms = lon.split(',').map(Number);

                  Object.assign(this, {
                    latDeg: latDms[0],
                    latMin: latDms[1],
                    latSec: latDms[2],
                    lonDeg: lonDms[0],
                    lonMin: lonDms[1],
                    lonSec: lonDms[2],
                  });
                }
              }
            }
          }, 100);
        }
      });
  }

  // Map a row value to a column header name for the main table (supports SPC and AWAC)
  formatMainCell(row: any, headerName: string): any {
    if (!row || !headerName) return '';

    const name = headerName.toLowerCase();
    switch (name) {
      case 'station':
        return row.station_id ?? '';
      case 'date': {
        const dt = row.date || row.datetime;
        if (!dt) return '';
        const d = new Date(dt);
        if (isNaN(d.getTime())) return '';
        return this.datePipe.transform(d, this.dateFormat) ?? '';
      }

      case 'pitch':
        return row.pitch ?? '';
      case 'roll':
        return row.roll ?? '';
      case 'heading':
        return row.heading ?? '';
      case 'speed':
        return row.speed ?? '';
      case 'direction':
        return row.direction ?? '';
      case 'depth':
        return row.depth ?? '';
      case 'battery':
        return row.battery ?? '';
      case 'pressure':
        return row.pressure ?? '';
      default: {
        // AWAC dynamic bins: support both key styles
        // Header forms: "Speed BinX" or "Direction BinX"
        const m = headerName.match(/(Speed|Direction)\s+Bin(\d+)/i);
        if (m) {
          const kind = m[1].toLowerCase(); // speed or direction
          const idx = m[2];
          // Possible backend key styles
          const candidates =
            kind === 'speed'
              ? [`bin_${idx}_speed`, `speed_bin${idx}`]
              : [`bin_${idx}_direction`, `direction_bin${idx}`];
          for (const k of candidates) {
            if (k in row) return row[k];
          }
          return '';
        }
        return '';
      }
    }
  }

  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
  }
  ddtoDms(value: any, fromUnit: string, toUnit: string): any {
    if (fromUnit === toUnit) return value;

    const conversions: { [key: string]: (v: any) => any } = {
      'dd-dms': (v: number) => {
        const deg = Math.floor(v);
        const minFloat = (v - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = parseFloat(((minFloat - min) * 60).toFixed(3));
        return { deg, min, sec };
      },
      'dms-dd': (v: string) => {
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

  toggleFileSelection(fileName: string, event: MouseEvent, file_id: number) {
    // Clear DD and DMS fields
    this.latitude = null;
    this.lon = null;
    this.latDeg = null;
    this.latMin = null;
    this.latSec = null;
    this.lonDeg = null;
    this.lonMin = null;
    this.lonSec = null;
    this.FileID = file_id;
    this.FileID = file_id;

    this.globe.fileId = file_id;
    const isCtrlPressed = event.ctrlKey || event.metaKey; // Detect if Ctrl (Windows/Linux) or Cmd (Mac) is pressed

    if (isCtrlPressed) {
      this.isMulti = true;
      // If Ctrl/Cmd is pressed, toggle file selection
      const index = this.selectedFiles.indexOf(fileName);
      if (index === -1) {
        this.selectedFiles.push({
          file_name: fileName,
          file_id: file_id,
        }); // Add file to selection
        this.open_file(fileName, file_id);
      } else {
        this.selectedFiles.splice(index, 1); // Remove file from selection
      }
    } else {
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
  }

  // Get the class for a selected file to highlight it
  // getFileClass(fileName: string): string {
  getFileClass(fileName: string, file_id: number): string {
    // Check if file is selected based on both file_name and file_id
    const isSelected = this.selectedFiles.some(
      (file) => file.file_name === fileName && file.file_id === file_id
    );
    return isSelected ? 'file-item_active' : 'file-item';
    // }
  }

  ngOnInit(): void {
    const lastFolder = localStorage.getItem('lastUploadFolder');
    if (lastFolder) {
      this.FileName = lastFolder;
    }

    this.isFilesLoading = true;
    window.addEventListener('storage', (e) => {});
    this.files_list = [];
    this.http.get(`${this.baseUrl}files`).subscribe((response: any) => {
      this.files_list = response['data'];
      this.isFilesLoading = false;
      this.expandedFolders = [false, false, false, false, false, false, false];
    });

    // Initialize both unit selections with defaults if needed
    this.unitSettings.forEach((param) => {
      this.selectedUnitsFrom[param.key] = param.units[0];
      this.selectedUnitsTo[param.key] = param.units[0];
    });

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
  }

  getFileImage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return '../../assets/csv.png';
      case 'xlsx':
        return '../../assets/xl.png';
      case 'nmea':
      case 'txt':
        return '../../assets/txt.png';
      default:
        return 'assets/file.png';
    }
  }

  on_openImport() {
    this.is_show_import = !this.is_show_import;
    this.historyData = [];
    this.FileName = '';
    this.uploaded_files = [];
  }

  expectedHeaders = [
    'STRING',
    'Date',
    'Time',
    'speedms',
    'direction',
    'bin_depth',
    'pressure_in_bar',
    'battery',
  ];
  tableHeaders = [
    'String',
    'Date',
    'Speed',
    'Direction',
    'Bin_depth',
    'Pressure_in_bar',
    'Battery',
  ];

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;

    this.errorMessage = '';
    this.tableData = [];
    const promises: Promise<any>[] = [];
    const fileWiseData: { [key: string]: any[] } = {};
    this.toast.warning(
      'The rows will be skipped if there are any null, empty, or non-numeric string values.',
      'Warning',
      {
        timeOut: 3500,
      }
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const maxSizeBytes = this.maxFileSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        this.toast.error(
          `❌ File "${file.name}" exceeds ${this.maxFileSizeMB}MB`,
          'Error'
        );
        continue;
      }

      const promise = this.processFile(file)
        .then(({ fileName, data }) => {
          fileWiseData[fileName] = data;
        })
        .catch((err) => {
          this.toast.warning(
            `❌ Skipping file "${file.name}" due to error: ${err}`,
            'Error'
          );
        });

      promises.push(promise);
    }

    Promise.all(promises).then(() => {
      const allRows = Object.values(fileWiseData).flat();
      if (allRows.length === 0) {
        this.errorMessage = 'No valid files processed.';
      } else {
        this.historyData = allRows;
        this.tableData = [...allRows];
        this.displayedColumns = this.expectedHeaders;
        this.fileWiseUploadData = fileWiseData; // <- store for import step
        this.uploaded_files.forEach((fileName) => {
          this.getHighWaterLevel(fileName);
        });
        this.onFileClick(this.uploaded_files[0]);
      }
    });
  }

  filterhistorydata: any[] = [];
  selected_filelist: String = '';

  onFileClick(file_Name: string): void {
    // Guard against undefined file name
    if (!file_Name) {
      console.warn('onFileClick called without a file name');
      return;
    }
    this.filterhistorydata = [];
    this.selected_filelist = file_Name;

    setTimeout(() => {
      this.filterhistorydata = this.historyData.filter(
        (item: any) => item.fileName === file_Name
      );

      // Decide upload table headers based on selected file
      const isNmea = (file_Name || '').toLowerCase().endsWith('.nmea');
      const firstUploadRow = this.filterhistorydata[0] || {};
      const typeStr = (firstUploadRow.type || '').toString().toLowerCase();
      const hasAwacKeys =
        this.filterhistorydata.length > 0 &&
        ('datetime' in firstUploadRow ||
          'bin_1_speed' in firstUploadRow ||
          'bin_1_direction' in firstUploadRow ||
          'speed_bin1' in firstUploadRow ||
          'direction_bin1' in firstUploadRow);
      if (typeStr === 'awac') {
        this.upload_active_headers = this.main_table_headers_awac;
      } else if (typeStr === 'spc') {
        this.upload_active_headers = this.main_table_headers_spc;
      } else {
        this.upload_active_headers =
          isNmea || hasAwacKeys
            ? this.main_table_headers_awac
            : this.main_table_headers_spc;
      }

      // ✅ No data found for the file
      if (!this.filterhistorydata.length) {
        console.warn(`No data found for file: ${file_Name}`);
        this.toast.warning(`No data found for file: ${file_Name}`, 'Warning', {
          timeOut: 1500,
        });
        return;
      }

      // ✅ Find row with max pressure
      let maxPressureIndex = 0;
      let maxPressureValue = parseFloat(
        this.filterhistorydata[0]?.pressure ?? 0
      );

      for (let i = 1; i < this.filterhistorydata.length; i++) {
        let currentPressure = parseFloat(
          this.filterhistorydata[i]?.pressure ?? 0
        );
        if (currentPressure > maxPressureValue) {
          maxPressureValue = currentPressure;
          maxPressureIndex = i;
        }
      }

      const maxPressureRow = this.filterhistorydata[maxPressureIndex];
      if (
        !maxPressureRow ||
        (!maxPressureRow.date && !maxPressureRow.datetime)
      ) {
        console.warn(`Invalid pressure row for file: ${file_Name}`);
        return;
      }

      this.selectedRowIndex = maxPressureIndex;

      // ✅ Scroll to that row
      setTimeout(() => {
        const rowElement = document.getElementById(
          `row-${this.selectedRowIndex}`
        );
        if (rowElement) {
          rowElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);

      const date = new Date(maxPressureRow.date || maxPressureRow.datetime);
      const formattedDate = this.datePipe.transform(
        date,
        'yyyy-MM-dd HH:mm:ss'
      );
      this.high_water_level = `${formattedDate}`;
    }, 50);
  }

  async processFile(file: File): Promise<{ fileName: string; data: any[] }> {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // ✅ Handle NMEA files separately
      if (fileExtension === 'nmea') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter((l) => l.startsWith('$PNORS') || l.startsWith('$PNORC'));

            const grouped: Record<string, any[]> = {};
            let groupIndex = 0;
            // Parse each line and group by date+time
            lines.forEach((line) => {
              const parts = line.split(',');
              const type = parts[0];
              const date = parts[1];
              const time = parts[2];

              if (type.startsWith('$PNORS')) groupIndex++;
              const key = `${date}_${time}_${groupIndex}`;

              if (!grouped[key]) grouped[key] = [];

              if (type.startsWith('$PNORS')) {
                grouped[key].push({
                  type: 'status',
                  date,
                  time,
                  pressure: parseFloat(parts[7]) || null,
                  battery: parseFloat(parts[5]) || null,
                  temperature: parseFloat(parts[11]) || null,
                  heading: parseFloat(parts[10]) || null,
                  pitch: parseFloat(parts[8]) || null,
                  roll: parseFloat(parts[9]) || null,
                });
              } else if (type.startsWith('$PNORC')) {
                grouped[key].push({
                  type: 'current',
                  date,
                  time,
                  speed: parseFloat(parts[7]) || null,
                  direction: parseFloat(parts[8]) || null,
                });
              }
            });

            // Combine grouped data into final structured format
            const finalData: any[] = [];

            Object.keys(grouped).forEach((key) => {
              const entries = grouped[key];
              const first = entries.find((e) => e.type === 'status');
              const currents = entries.filter((e) => e.type === 'current');

              // Convert mmddyy + hhmmss to ISO timestamp
              const rawDate = first?.date || key.split('_')[0];
              const rawTime = first?.time || key.split('_')[1];
              const isoDate = `20${rawDate.slice(4, 6)}-${rawDate.slice(
                0,
                2
              )}-${rawDate.slice(2, 4)}`;
              const isoTime = `${rawTime.slice(0, 2)}:${rawTime.slice(
                2,
                4
              )}:${rawTime.slice(4, 6)}`;
              const isoTimestamp = `${isoDate}T${isoTime}Z`;

              const combined: any = {
                fileName: file.name,
                datetime: isoTimestamp,
                pressure: first?.pressure ?? null,
                battery: first?.battery ?? null,
                // temperature: first?.temperature ?? null,
                heading: first?.heading ?? null,
                pitch: first?.pitch ?? null,
                roll: first?.roll ?? null,
              };

              currents.forEach((cur, i) => {
                combined[`bin_${i + 1}_speed`] = cur.speed ?? null;
                combined[`bin_${i + 1}_direction`] = cur.direction ?? null;
              });

              finalData.push(combined);
            });

            // Ensure NMEA file is tracked for selection
            if (!this.uploaded_files.includes(file.name)) {
              this.uploaded_files.push(file.name);
            }
            resolve({ fileName: file.name, data: finalData });
          } catch (err: any) {
            reject(err.message || `Error parsing NMEA file: ${file.name}`);
          }
        };
        reader.readAsText(file);
        return;
      }

      // ✅ Existing Excel/CSV logic (unchanged)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];

          const rawData: any[][] = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName],
            { header: 1 }
          );

          if (rawData.length === 0) {
            return reject(`File "${file.name}" is empty.`);
          }

          this.uploaded_files.push(file.name);

          const formattedData = rawData
            .map((row, index) => {
              const cleanedRow: any = {};
              this.expectedHeaders.forEach((key, i) => {
                cleanedRow[key] = row[i];
              });

              // Skip header row if detected
              if (index === 0 && Object.values(cleanedRow).includes('Date')) {
                return null;
              }

              // ✅ Skip row if it contains a string in numeric fields
              const numericFields = [
                'speedms',
                'direction',
                'bin_depth',
                'battery',
                'pressure_in_bar',
              ];

              const hasStringValue = numericFields.some((key) => {
                const val = cleanedRow[key];
                if (val === null || val === undefined || val === '')
                  return false;
                return typeof val === 'string' && isNaN(Number(val));
              });

              if (hasStringValue) {
                console.warn(
                  `Skipping row ${index + 1} in ${
                    file.name
                  } — contains string in numeric field`
                );
                return null; // skip this row
              }

              // Convert time/date
              const time = this.convertToTimeFormat(cleanedRow['Time']);
              const date = this.convertToDateFormat(cleanedRow['Date']);
              const dateTime = `${date}T${time}Z`;

              return {
                fileName: file.name,
                station_id: cleanedRow['STRING'],
                date: dateTime,
                speed: parseFloat(cleanedRow['speedms']),
                direction: parseFloat(cleanedRow['direction']),
                depth: parseFloat(cleanedRow['bin_depth']),
                battery: parseFloat(cleanedRow['battery']),
                pressure: parseFloat(cleanedRow['pressure_in_bar']),
                lat: '',
                lon: '',
                high_water_level: 0,
              };
            })
            // ✅ Filter out null (skipped) rows
            .filter((row) => row !== null);

          if (formattedData.length === 0) {
            return reject(`No valid rows found in file "${file.name}".`);
          }

          // Find max pressure row
          let maxPressureIndex = 0;
          let maxPressureValue = formattedData[0].pressure;

          for (let i = 1; i < formattedData.length; i++) {
            const currentPressure = formattedData[i].pressure;
            if (currentPressure > maxPressureValue) {
              maxPressureValue = currentPressure;
              maxPressureIndex = i;
            }
          }

          // Mark high water level
          formattedData[maxPressureIndex].high_water_level = 1;

          resolve({ fileName: file.name, data: formattedData });
        } catch (err: any) {
          reject(err.message || `Error processing file: ${file.name}`);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  fileHighWaterLevels: { [key: string]: any } = {};

  getHighWaterLevel(fileName: string): void {
    const filteredData = this.historyData.filter(
      (item: any) => item.fileName === fileName
    );

    if (filteredData.length === 0) {
      console.warn(`No data found for file: ${fileName}`);
      return;
    }

    let maxPressureIndex = 0;
    let maxPressureValue = filteredData[0].pressure;

    for (let i = 1; i < filteredData.length; i++) {
      let currentPressure = filteredData[i].pressure;
      if (currentPressure > maxPressureValue) {
        maxPressureValue = currentPressure;
        maxPressureIndex = i;
      }
    }

    const maxPressureRow = filteredData[maxPressureIndex];
    const rawDt: any = maxPressureRow.date || maxPressureRow.datetime;
    const parsedDate = rawDt ? new Date(rawDt) : null;
    const formattedDate =
      parsedDate && !isNaN(parsedDate.getTime())
        ? this.datePipe.transform(parsedDate, 'yyyy-MM-dd HH:mm:ss')
        : '';

    // Store per file's high water level
    this.fileHighWaterLevels[fileName] = {
      index: maxPressureIndex,
      date: formattedDate,
      row: maxPressureRow,
    };
  }

  convertcoored(value: any, fromUnit: string, toUnit: string): any {
    if (fromUnit === toUnit) return value;

    const maxVolt = 4.2; // for battery conversion

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

      // DD to DMS
      'dd-dms': (v) => {
        const deg = Math.floor(v);
        const minFloat = (v - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = (minFloat - min) * 60;
        return `${deg}°${min}'${sec.toFixed(2)}"`;
      },

      // DMS to DD
      'dms-dd': (v) => {
        const regex = /(\d+)°(\d+)'([\d.]+)"/;
        const match = v.match(regex);
        if (!match) return 0;
        const deg = parseInt(match[1]);
        const min = parseInt(match[2]);
        const sec = parseFloat(match[3]);
        return parseFloat((deg + min / 60 + sec / 3600).toFixed(6));
      },
    };
  }
  excelSerialDateToJSDate(serial: number): string {
    const excelEpoch = new Date(1899, 11, 30); // Excel epoch starts from 1900-01-01 but needs an offset
    const days = Math.floor(serial);
    const msPerDay = 86400000; // 24 * 60 * 60 * 1000
    const date = new Date(excelEpoch.getTime() + days * msPerDay);

    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  deleteRow(index: number) {
    // Get all items related to selected file
    const filtered = this.historyData.filter(
      (item: any) => item.fileName === this.selected_filelist
    );

    // Get the actual item to delete using the index from filtered list
    const itemToDelete = filtered[index];

    if (itemToDelete) {
      // Find index of this item in original historyData
      const originalIndex = this.historyData.findIndex(
        (item: any) =>
          item.fileName === itemToDelete.fileName &&
          JSON.stringify(item) === JSON.stringify(itemToDelete)
      );

      if (originalIndex > -1) {
        this.historyData.splice(originalIndex, 1);
      }

      // Remove from fileWiseUploadData as well
      const fileKey = this.selected_filelist.toString();
      if (
        this.fileWiseUploadData[fileKey] &&
        Array.isArray(this.fileWiseUploadData[fileKey])
      ) {
        const fileArray = this.fileWiseUploadData[fileKey];
        const fileArrayIndex = fileArray.findIndex(
          (item: any) => JSON.stringify(item) === JSON.stringify(itemToDelete)
        );
        if (fileArrayIndex > -1) {
          fileArray.splice(fileArrayIndex, 1);
        }
      }

      // Now update the filtered list
      this.filterhistorydata = this.historyData.filter(
        (item: any) => item.fileName === this.selected_filelist
      );
    }
  }

  convertToTimeFormat(value: number): string {
    const intPart = Math.floor(value); // 155323
    const decimalPart = value - intPart; // 0.99

    const hours = Math.floor(intPart / 10000); // 15
    const minutes = Math.floor((intPart % 10000) / 100); // 53
    const seconds = Math.floor(intPart % 100); // 23

    // Optionally round seconds using the decimal part
    const roundedSeconds = Math.round(seconds + decimalPart);

    // Handle overflow (e.g., 60 seconds)
    const finalSeconds = roundedSeconds % 60;
    const extraMinute = Math.floor(roundedSeconds / 60);

    const finalMinutes = (minutes + extraMinute) % 60;
    const extraHour = Math.floor((minutes + extraMinute) / 60);

    const finalHours = (hours + extraHour) % 24;

    // Format with leading zeros
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(finalHours)}:${pad(finalMinutes)}:${pad(finalSeconds)}`;
  }

  convertToDateFormat(value: number | string | undefined): string {
    if (!value) {
      console.warn('Invalid date value:', value);
      return ''; // or return a fallback like 'Invalid Date'
    }

    const str = value.toString();
    if (str.length !== 8) {
      console.warn('Date string must be 8 characters:', str);
      return '';
    }

    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);

    return `${year}-${month}-${day}`;
  }

  import() {
    this.isFilesLoading = true;
    if (!this.FileName) {
      this.toast.warning('Please Enter Folder name', 'Warning');
      this.isFilesLoading = false;
      return;
    }
    this.files_list = [];
    const file = {
      folder_name: this.FileName,
      file_name: Object.keys(this.fileWiseUploadData),
      data: this.fileWiseUploadData,
      unitsFrom: this.selectedUnitsFrom,
      unitsTo: this.selectedUnitsTo,
    };

    // Conversion logic before API call
    const unitFieldMap = {
      pressure: 'waterLevel',
      speed: 'currentSpeed',
      direction: 'currentDirection',
      battery: 'battery',
      depth: 'depth',
    };
    Object.keys(this.fileWiseUploadData).forEach((fileName) => {
      const rows = this.fileWiseUploadData[fileName];
      rows.forEach((row: any) => {
        Object.entries(unitFieldMap).forEach(([field, unitKey]) => {
          // Skip if either unit is missing
          if (
            this.selectedUnitsFrom[unitKey] !== undefined &&
            this.selectedUnitsTo[unitKey] !== undefined &&
            this.selectedUnitsFrom[unitKey] !== this.selectedUnitsTo[unitKey]
          ) {
            // Only convert if value is not null/undefined/empty
            if (
              row[field] !== null &&
              row[field] !== undefined &&
              row[field] !== ''
            ) {
              row[field] = this.convertValues(
                Number(row[field]),
                this.selectedUnitsFrom[unitKey],
                this.selectedUnitsTo[unitKey]
              );
            }
          }
        });
      });
    });

    this.http.post(`${this.baseUrl}createFile`, file).subscribe(
      (response: any) => {
        this.toast.success(response.message, 'Success');

        this.historyData = [];
        this.FileName = '';
        this.uploaded_files = [];
        this.fileWiseUploadData = {};

        setTimeout(() => {
          this.http.get(`${this.baseUrl}files`).subscribe((response: any) => {
            this.files_list = response['data'];
            this.expandedFolders = this.files_list.map(() => false);
            setTimeout(() => {
              this.isFilesLoading = false;
              this.is_show_import = false;
            }, 200);
          });
        }, 900);
      },
      (error) => {
        this.isFilesLoading = false;
      }
    );
  }
}
