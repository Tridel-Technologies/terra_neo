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
  latitude: number | null = null;
  lon: number | null = null;
  high_water_level!: string;
  selectedRowIndex: number | null = null;
  selectedRowData: any = null;
  lonDeg!:number;
  lonMin!:number;
  lonSec!:number;
  latDeg!:number;
  latMin!:number;
  latSec!:number;

  unitSettings = [
    {
      key: 'waterLevel',
      label: 'Water Level',
      iconClass: 'fas fa-water', // or use another icon library
      units: ['m', 'ft', 'cm'],
    },
    {
      key: 'currentSpeed',
      label: 'Current Speed',
      iconClass: 'fas fa-tachometer-alt',
      units: ['m/s', 'knots'],
    },
    {
      key: 'currentDirection',
      label: 'Current Direction',
      iconClass: 'fas fa-compass',
      units: ['°', 'radians'],
    },
    {
      key: 'battery',
      label: 'Battery',
      iconClass: 'fas fa-battery-full',
      units: ['%', 'volts'],
    },
    {
      key: 'depth',
      label: 'Depth',
      iconClass: 'fas fa-arrows-down-to-line',
      units: ['m', 'ft'],
    },
    // {
    //   key: 'latandlong',
    //   label: 'Latitude and Longitude',
    //   iconClass: 'fas fa-map-marker-alt',
    //   units: ['DD', 'DMS'],
    // },
  ];

  getTooltip(paramKey: string, unit: string): string {
    const tooltips: any = {
      waterLevel: {
        m: 'Meters',
        ft: 'Feet',
        cm: 'Centimeters',
      },
      currentSpeed: {
        'm/s': 'Meters per second',
        knots: 'Knots',
      },
      currentDirection: {
        '°': 'Degrees',
        radians: 'Radians',
      },
      battery: {
        '%': 'Percentage',
        volts: 'Volts',
      },
      depth: {
        m: 'Meters',
        ft: 'Feet',
      },
      latandlong: {
        DD: 'Decimal Degrees',
        DMS: 'Degrees, Minutes, Seconds',
      },
    };

    return tooltips[paramKey]?.[unit] || '';
  }

  selectedUnits: any = {};

  selectUnit(paramKey: string, unit: string) {
    this.selectedUnits[paramKey] = unit;
    console.log("units", this.selectedUnits);
  }

  onRowClick(row: any, index: number) {
    this.selectedRowIndex = index;
    this.selectedRowData = row;
    console.log('Selected Row:', row);
    const date = new Date(row.date);
    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
    console.log(formattedDate);
    this.high_water_level = `${formattedDate}`;
  }

  showCoordinates = true;

  toggleCoordinates() {
    this.showCoordinates = !this.showCoordinates;
  }

  update_Values() {
    if(this.unitssTo.latandlong ==='dd'){
      if (this.latitude === null && this.lon === null) {
        this.toast.warning('Please enter coordinates', 'Error', {
          timeOut: 1000,
        });
        return;
      }
    }else{
      if(this.latDeg ===null || this.latMin===null ||this.latSec===null ||this.lonDeg===null||this.lonMin===null||this.lonSec===null){
         this.toast.warning('Please enter coordinates', 'Error', {
          timeOut: 1000,
        });
        return;
      }
    }
    console.log(this.selectedFiles);
    const files = [];
    for (let index = 0; index < this.selectedFiles.length; index++) {
      files.push(this.selectedFiles[index]);
    }
    // file_name, lat, lon, high_water_level
    let data = {}
    if(this.unitssTo.latandlong ==='dd'){
       data = {
        file_name: files,
        lat: this.latitude,
        lon: this.lon,
        high_water_level: this.high_water_level,
      };
    }else{
      const lat = `${this.latDeg}° ${this.latMin}' ${this.latSec}''`;
      const lon = `${this.lonDeg}° ${this.lonMin}' ${this.lonSec}''`;
      data = {
        file_name: files,
        lat: this.convertcoored(parseFloat(lat), 'dms', this.unitssTo.latandlong),
        lon: this.convertcoored(parseFloat(lon), 'dms', this.unitssTo.latandlong),
        high_water_level: this.high_water_level,
      };
    }
    console.log('sendingData', data);
    this.update(data);
  }
  showoption: boolean = false;
  update(data: any) {
    this.http
      .post(`${this.baseUrl}update_values`, data)
      .subscribe((response: any) => {
        console.log(response);
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

  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    private datePipe: DatePipe,
    private globe: BaseComponent,
    private unitService: UnitService
  ) {
    this.baseUrl = new GlobalConfig().baseUrl;
    this.selectedUnits = this.unitService.getCurrentUnits();
  }

  main_table_headers = [
    'STRING',
    'date',
    'speedms',
    'direction',
    'dept',
    'battery',
    'pressure_in_bar',
  ];
  open_file(file_name: string, file_id: number) {
    this.opened_file = file_name;
    const data = {
      folder_id: file_id,
      file_name: file_name,
    };
    this.http
      .get(`${this.baseUrl}fetch_data_by_file/${file_id}`)
      .subscribe((response: any) => {
        console.log('response', response);
        if (this.isMulti) {
          let data = this.main_table;
          this.main_table = [];
          setTimeout(() => {
            this.main_table = data;
            let maxPressureRow = this.main_table.reduce((max, item) => {
              return parseFloat(item.pressure) > parseFloat(max.pressure) ? item : max;
            });

            console.log("Row with Max Pressure:", maxPressureRow);
            if (this.unitssTo.latandlong ==='dd') {
              this.latitude = this.main_table[0].lat;
              this.lon = this.main_table[0].lon;
            }else{
             const latDms = this.ddtoDms(parseFloat(this.main_table[0].lat), 'dd', 'dms');
  this.latDeg = latDms.deg;
  this.latMin = latDms.min;
  this.latSec = latDms.sec;

  // Convert Longitude DD to DMS
  const lonDms = this.ddtoDms(parseFloat(this.main_table[0].lon), 'dd', 'dms');
  this.lonDeg = lonDms.deg;
  this.lonMin = lonDms.min;
  this.lonSec = lonDms.sec;
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
              const date = new Date(maxPressureRow.date);
    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
    console.log(formattedDate);
    this.high_water_level = `${formattedDate}`;
              console.log("Row with Max Pressure:", maxPressureRow);
              console.log("Index of Max Pressure Row:", maxPressureIndex);

             if (this.unitssTo.latandlong ==='dd') {
              this.latitude = this.main_table[0].lat;
              this.lon = this.main_table[0].lon;
            }else{
             const latDms = this.ddtoDms(parseFloat(this.main_table[0].lat), 'dd', 'dms');
  this.latDeg = latDms.deg;
  this.latMin = latDms.min;
  this.latSec = latDms.sec;

  // Convert Longitude DD to DMS
  const lonDms = this.ddtoDms(parseFloat(this.main_table[0].lon), 'dd', 'dms');
  this.lonDeg = lonDms.deg;
  this.lonMin = lonDms.min;
  this.lonSec = lonDms.sec;
            }

            const high = this.main_table.filter(
              (item) => item.high_water_level === 1
            );
            console.log(high);
            console.log();
            this.high_water_level = high[0].date;
          }, 100);
        }
      });
  }
  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
    console.log(this.expandedFolders);
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
      const regex = /(\d+)°(\d+)'([\d.]+)"/;
      const match = v.match(regex);
      if (!match) return 0;
      const deg = parseInt(match[1]);
      const min = parseInt(match[2]);
      const sec = parseFloat(match[3]);
      return parseFloat((deg + (min / 60) + (sec / 3600)).toFixed(6));
    }
  };

  const key = `${fromUnit}-${toUnit}`;
  if (conversions[key]) {
    return conversions[key](value);
  }

  return value;
}

  changinglat() {
    console.log(this.latitude);
  }
  toggleFileSelection(fileName: string, event: MouseEvent, file_id: number) {
    this.FileID = file_id;
    this.FileID = file_id;
    console.log(fileName, file_id);
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
        console.log(this.selectedFiles);
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
  unitssTo!:UnitSettings;
  ngOnInit(): void {
    const unitss:any = localStorage.getItem('unitSettings');
    this.unitssTo = JSON.parse(unitss);
    console.log("Unitsss", this.unitssTo)
    this.isFilesLoading = true;
    window.addEventListener('storage', (e) => {
      console.log('Storage event fired!', e);
    });
    this.files_list = [];
    this.http
      .get(`${this.baseUrl}files`)
      .subscribe((response: any) => {
        this.files_list = response['data'];
        console.log('files:', response, this.files_list);
        this.isFilesLoading=false;
        this.expandedFolders = [false, false, false, false, false, false, true];
      });
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
  on_openImport() {
    this.is_show_import = !this.is_show_import;
    this.historyData =[];
    this.FileName =''
    this.uploaded_files =[]
  }

  expectedHeaders = [
    'STRING',
    'Date',
    'Time',
    'speedms',
    'direction',
    'bin_depth',
    'battery',
    'pressure_in_bar',
  ];
  tableHeaders = [
    'STRING',
    'Date',
    'speedms',
    'direction',
    'bin_depth',
    'battery',
    'pressure_in_bar',
  ];
  onFilesSelected(event: any) {
    const files: FileList = event.target.files;

    this.errorMessage = '';
    this.tableData = [];
    const promises: Promise<any>[] = [];
    const fileWiseData: { [key: string]: any[] } = {};

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
      }
    });
  }

  async processFile(file: File): Promise<{ fileName: string; data: any[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];

          let sheetData: any[] = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName]
          );
          if (sheetData.length === 0)
            return reject(`File "${file.name}" is empty.`);

          const fileHeaders = Object.keys(sheetData[0]).map((h) => h.trim());
          const isHeaderValid = this.expectedHeaders.every((h) =>
            fileHeaders.includes(h.trim())
          );
          if (!isHeaderValid)
            return reject(`Invalid header format in file: ${file.name}`);

          this.uploaded_files.push(file.name);

          const formattedData = sheetData.map((row, index) => {
            const cleanedRow: any = {};
            Object.keys(row).forEach((key) => {
              cleanedRow[key.trim()] = row[key];
            });

            for (const key of this.expectedHeaders) {
              const value = cleanedRow[key];
              if (!value || (typeof value === 'number' && isNaN(value))) {
                this.toast.warning(
                  `Empty/NaN value in "${key}" at row ${index + 2} in file ${
                    file.name
                  }`,
                  'Warning'
                );
              }
            }

            const time = this.convertToTimeFormat(cleanedRow['Time']);
            const date = this.convertToDateFormat(cleanedRow['Date']);
            const dateTime = `${date}T${time}Z`;

            return {
              station_id: cleanedRow['STRING'],
              date: dateTime,
              speed: cleanedRow['speedms'],
              direction: cleanedRow['direction'],
              depth: cleanedRow['bin_depth'],
              battery: cleanedRow['battery'],
              pressure: cleanedRow['pressure_in_bar'],
              lat: '18.3', // Replace with dynamic value if available
              lon: '52.3', // Replace with dynamic value if available
            };
          });

          resolve({ fileName: file.name, data: formattedData });
        } catch (err: any) {
          reject(err.message || `Error processing file: ${file.name}`);
        }
      };

      reader.readAsArrayBuffer(file);
    });
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
      return parseFloat((deg + (min / 60) + (sec / 3600)).toFixed(6));
    }
  }};
  excelSerialDateToJSDate(serial: number): string {
    const excelEpoch = new Date(1899, 11, 30); // Excel epoch starts from 1900-01-01 but needs an offset
    const days = Math.floor(serial);
    const msPerDay = 86400000; // 24 * 60 * 60 * 1000
    const date = new Date(excelEpoch.getTime() + days * msPerDay);

    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  deleteRow(index: number) {
    this.historyData.splice(index, 1); // Remove row from the array
    this.historyData = [...this.historyData]; // Update reference to trigger change detection
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
      return;
    }
    this.files_list = [];
    const file = {
      folder_name: this.FileName,
      file_name: Object.keys(this.fileWiseUploadData),
      data: this.fileWiseUploadData,
      units: this.selectedUnits
    };

    console.log(file);
    this.http
      .post(`${this.baseUrl}createFile`, file)
      .subscribe((response: any) => {
        this.toast.success(response.message, 'Success');

        this.historyData = [];
        this.FileName = '';
        this.uploaded_files = [];
        this.fileWiseUploadData = {};

        setTimeout(() => {
          this.http
            .get(`${this.baseUrl}files`)
            .subscribe((response: any) => {
              this.files_list = response['data'];
              console.log('files', response, this.files_list);
              this.expandedFolders = this.files_list.map(() => false);
              setTimeout(() => {
                this.isFilesLoading = false;
                this.is_show_import = false;
              }, 200);
            });
        }, 900);
      });
  }
}
