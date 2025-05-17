import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { GlobalConfig } from '../global/app.global';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LandingPageComponent } from "./landing-page/landing-page.component";

interface Files {
  id: number,
  files: string[],
  folder_name:string,
  timestamp: string
}

@Component({
  selector: 'app-importer',
  imports: [CommonModule, HttpClientModule, FormsModule, LandingPageComponent],
  templateUrl: './importer.component.html',
  styleUrl: './importer.component.css',
  providers:[DatePipe]
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
  files_list: Files[] = [];
  allowFolderUpload: boolean = false;
  uploaded_files:string[]=[]
  expandedFolders: boolean[] = [];
  opened_file!:string;
  openedFolder!:number;
  selectedFiles: any[] = [];  // Array to track selected files
  isMulti:boolean = false;
  main_table:any[] = [];


  lat:number | null = null;
  lon:number | null = null;
  high_water_level!:string;
  selectedRowIndex: number | null = null;
  selectedRowData: any = null;
  
  onRowClick(row: any, index: number) {
    this.selectedRowIndex = index;
    this.selectedRowData = row;
    console.log('Selected Row:', row);
    const date = new Date(row.date)
    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd');
    console.log(formattedDate);
    this.high_water_level = `${formattedDate} ${row.time}`

  }
  
  update_Values(){
    console.log(this.selectedFiles);
    const files = [];
    for (let index = 0; index < this.selectedFiles.length; index++) {
      files.push(this.selectedFiles[index].file_name);
    }
    // file_name, lat, lon, high_water_level
    const data ={
      file_name:files, lat:this.lat, lon:this.lon, high_water_level:this.high_water_level
    }
    console.log("sendingData", data);
    this.http.post('http://localhost:3000/api/update_values',data).subscribe(
      (response:any)=>{
        console.log(response);
        this.toast.success("Update successful", "Success");
      }
    )
  }

  constructor(private http: HttpClient, private toast:ToastrService,private datePipe: DatePipe) {}
  main_table_headers = ['STRING', 'date', 'time', 'speedms', 'direction', 'dept', 'battery', 'pressure_in_bar'];
  open_file(file_name:string, file_id:number){
    this.opened_file = file_name;
    const data ={
      folder_id:file_id,
      file_name:file_name
    }
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
  toggleFolder(index: number, folder_id: number) {
    this.openedFolder = folder_id;
    this.expandedFolders[index] = !this.expandedFolders[index];
  }


  toggleFileSelection(fileName: string, event: MouseEvent, file_id:number) {
    console.log(fileName, file_id);
    const isCtrlPressed = event.ctrlKey || event.metaKey; // Detect if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
    
    if (isCtrlPressed) {
      this.isMulti = true;
      // If Ctrl/Cmd is pressed, toggle file selection
      const index = this.selectedFiles.indexOf(fileName);
      if (index === -1) {
        this.selectedFiles.push({
          file_name: fileName,
          file_id:file_id
        });  // Add file to selection
        console.log(this.selectedFiles)
        this.open_file(fileName, file_id)
      } else {
        this.selectedFiles.splice(index, 1);  // Remove file from selection
      }
    } else {
      this.isMulti = false;
      // If Ctrl/Cmd is not pressed, select this file and deselect all others
      this.selectedFiles = [{
        file_name: fileName,
        file_id:file_id
      }];  // Only keep the clicked file selected
      this.open_file(fileName, file_id)
      
    }
  }

  // Get the class for a selected file to highlight it
  // getFileClass(fileName: string): string {
    getFileClass(fileName: string, file_id: number): string {
      // Check if file is selected based on both file_name and file_id
      const isSelected = this.selectedFiles.some(file => file.file_name === fileName && file.file_id === file_id);
      return isSelected ? 'file-item_active' : 'file-item';
    // }
  }
  ngOnInit(): void {
    this.files_list = [];
    this.http.get('http://localhost:3000/api/get_files').subscribe(
      (response: any) => {
        this.files_list = response['data'];
        console.log('files:', response, this.files_list);
        this.expandedFolders = this.files_list.map(() => false);

      }
    );
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
  on_openImport() {
    this.is_show_import = !this.is_show_import;
  }

  expectedHeaders = ['STRING', 'Date', 'Time', 'speedms', 'direction', 'bin_depth', 'battery', 'pressure_in_bar'];
  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
  
    this.errorMessage = '';
    this.tableData = [];
    const promises: Promise<any>[] = [];
    const validData: any[] = [];
  
    console.log(`Selected ${files.length} file(s)`);
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
  
      const maxSizeBytes = this.maxFileSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        console.error(`❌ File "${file.name}" exceeds ${this.maxFileSizeMB}MB`);
        this.toast.error(`❌ File "${file.name}" exceeds ${this.maxFileSizeMB}MB`,"Error")
        continue;
      }
  
      const promise = this.processFile(file)
        .then((data) => {
          validData.push(...data);
        })
        .catch((err) => {
          console.error(`❌ Skipping file "${file.name}" due to error: ${err}`);
          this.toast.warning(`❌ Skipping file "${file.name}" due to error: ${err}`,"Error")
        });
  
      promises.push(promise);
    }
  
    Promise.all(promises).then(() => {
      if (validData.length === 0) {
        this.errorMessage = 'No valid files processed.';
      } else {
        this.historyData = validData;
        this.tableData = [...validData];
        this.displayedColumns = this.expectedHeaders;
        console.log("✅ All valid files processed successfully.", this.displayedColumns);
        console.log("📄 Combined Data Ready for Table & DB Save:", this.historyData);
      }
    });
  }
  

  async processFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];

          console.log(`📄 Reading sheet "${sheetName}" from file: ${file.name}`);
          let sheetData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

          if (sheetData.length === 0) {
            return reject(`File "${file.name}" is empty.`);
          }

          // Trim all headers (remove extra spaces)
          const fileHeaders = Object.keys(sheetData[0]).map((h) => h.trim());
          const isHeaderValid = this.expectedHeaders.every((h) => fileHeaders.includes(h.trim()));

          if (!isHeaderValid) {
            console.warn(`❌ Invalid header format in file: ${file.name}`);
            return reject(`Invalid header format in file: ${file.name}`);
          }

          console.log(`✅ Header validated for file: ${file.name}`);
          this.uploaded_files.push(file.name);

          const formattedData = sheetData.map((row, index) => {
            const cleanedRow: any = {};
            
            // Trim all keys and handle missing data
            Object.keys(row).forEach(key => {
              const cleanedKey = key.trim(); // Remove extra spaces from headers
              cleanedRow[cleanedKey] = row[key];
            });

            // Check and validate each required field
            for (const key of this.expectedHeaders) {
              const value = cleanedRow[key];
              if (
                value === null ||
                value === undefined ||
                value === '' ||
                (typeof value === 'number' && isNaN(value))
              ) {
                console.warn(`Empty/NaN value in "${key}" at row ${index + 2} in file ${file.name}`);
                this.toast.warning(`Empty/NaN value in "${key}" at row ${index + 2} in file ${file.name}`,"Warning")
              }
            }

            const time = this.convertToTimeFormat(cleanedRow['Time']);
            const date = this.convertToDateFormat(cleanedRow['Date']);

            return {
              station_id: cleanedRow['STRING'],
              Date: date,
              Time: time,
              speed: cleanedRow['speedms'],
              direction: cleanedRow['direction'],
              depth: cleanedRow['bin_depth'],
              battery: cleanedRow['battery'],
              pressure: cleanedRow['pressure_in_bar'],
              file_name:file.name
            };
          });

          console.log(`✅ File "${file.name}" processed successfully with ${formattedData.length} row(s).`);
          console.log("formated",formattedData)
          this.historyData = formattedData;
          this.displayedColumns = this.expectedHeaders;
          resolve(formattedData);
        } catch (err: any) {
          console.error(`❌ Error processing file "${file.name}":`, err.message || err);
          reject(err.message || `Error processing file: ${file.name}`);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  excelSerialDateToJSDate(serial: number): string {
    const excelEpoch = new Date(1899, 11, 30); // Excel epoch starts from 1900-01-01 but needs an offset
    const days = Math.floor(serial);
    const msPerDay = 86400000; // 24 * 60 * 60 * 1000
    const date = new Date(excelEpoch.getTime() + days * msPerDay);

    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  deleteRow(index: number) {
    this.tableData.splice(index, 1); // Remove row from the array
    this.tableData = [...this.tableData]; // Update reference to trigger change detection
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
    const file = {
      data: this.historyData,
      folder_name:this.FileName,
      files: this.uploaded_files
    };
    if(!this.FileName){
      this.toast.warning("Please Enter Folder name","warning");
    }else{
      this.http.post(`http://localhost:3000/api/import`, file).subscribe(
        (response: any) => {
          console.log(response);
          this.toast.success(response.message, "Success");
          this.is_show_import = false;
          this.historyData = []
          this.FileName = '';
          this.uploaded_files = [];
          this.files_list = [];
          setTimeout(() => {
            this.http.get('http://localhost:3000/api/get_files').subscribe(
              (response: any) => {
                this.files_list = response['data'];
                console.log('files:', response, this.files_list);
                this.expandedFolders = this.files_list.map(() => false);
  
              });
          }, 100);
        }
      );
    }
  }
}
