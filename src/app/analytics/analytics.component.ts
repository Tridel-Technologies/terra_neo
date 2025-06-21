import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostBinding,
  ChangeDetectorRef,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { EChartsOption, EChartsType } from 'echarts';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { trigger, transition, style, animate } from '@angular/animations';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { SelectModule } from 'primeng/select';
import { ColorPickerModule } from 'primeng/colorpicker';
import { CalendarModule } from 'primeng/calendar';
import { DatePickerModule } from 'primeng/datepicker';
import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from '../base/base.component';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { ThemeService } from '../theme_service/theme.service';
import { UnitService, UnitSettings } from '../settings/unit.service';
import { GlobalConfig } from '../global/app.global';

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
  isNewRow?: boolean;
  water_level_unit: string;
  current_speed_unit: string;
  current_direction_unit: string;
  battery_unit: string;
  depth_unit: string;
  [key: string]: any;
}

interface SelectedData {
  id: number;
  tide: string;
  datetime: string;
  current_speed: string;
  current_direction: string;
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
  selector: 'app-analytics',
  imports: [
    CommonModule,
    FormsModule,
    ToggleSwitchModule,
    DialogModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    HttpClientModule,
    SelectModule,
    ColorPickerModule,
    CalendarModule,
    CascadeSelectModule,
    DatePickerModule,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css',
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  expandedFolders: boolean[] = [];
  opened_file!: string;
  openedFolder!: number;
  selectedFiles: any[] = [];
  isMulti: boolean = true;
  main_table: ApiData[] = [];
  files_list: Folders[] = [];
  selected_folder_name!: string;
  selected_data!: SelectedData;
  isLive: boolean = true;
  changedRows: Set<number> = new Set();
  isProcessedData: boolean = false;
  unitSettings: { key: string }[] = [];

  @ViewChild('table') table: any;
  @ViewChild('tableWrapper') tableWrapper!: ElementRef;
  @ViewChild('tideChart') tideChart!: ElementRef;
  @ViewChild('midChart') midChart!: ElementRef;
  @HostBinding('class.modal-open') get isModalOpen() {
    return this.visible;
  }
  number: number = 4;
  loading: boolean = false;
  // chartOption: any;
  // isCompareView: boolean = false;

  visible: boolean = false;
  selectedPointId: number | null = null;
  private tideChartInstance?: EChartsType;
  private midChartInstance?: EChartsType;

  selectedChart: string = 'line';
  PolarSelectedInterVal: number | 'all' = 60;

  selectedPolarDateRange: Date[] = []; // Changed from single date to date range
  maxDate: Date = new Date(); // restrict future dates

  // Optional: disable unavailable dates
  disabledPolarDates: Date[] = []; // populate if needed

  plot: any;
  viewModes: any;

  totalRecords: number = 0;
  lazyParams: any = {
    first: 0,
    rows: 20,
  };
  private fullData: ApiData[] = [];

  tideChartColor: string = localStorage.getItem('tideChartColor') ?? '#4900ff';
  currentSpeedColor: string =
    localStorage.getItem('currentSpeedColor') ?? '#ff00c1';
  currentDirectionColor: string =
    localStorage.getItem('currentDirectionColor') ?? '#02f557';

  units: UnitSettings = {
    waterLevel: '',
    currentSpeed: '',
    currentDirection: '',
    battery: '',
    depth: '',
    latandlong: '',
  };

  onColorChange(color: string, type: string): void {
    if (type === 'tideChartColor') {
      this.tideChartColor = color;
      this.Tide();
    } else if (type === 'currentSpeedColor') {
      this.currentSpeedColor = color;
      this.currentSpeed();
    } else if (type === 'currentDirectionColor') {
      this.currentDirectionColor = color;
      this.currentDirection();
    }

    localStorage.setItem(type, color);
  }

  onDataTypeChange(): void {
    localStorage.setItem('isProcessedData', this.isProcessedData.toString());
    this.open_file(this.selectedFiles[0].file_id);
    this.loadChart();
  }

  private themeSubscription: any;
  private themeChange$ = new BehaviorSubject<string>('light');
  private baseUrl: string;
  private convertValues;

  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private base: BaseComponent,
    private themeService: ThemeService,
    private unitSerive: UnitService
  ) {
    this.baseUrl = new GlobalConfig().baseUrl;
    this.convertValues = new GlobalConfig().convertValue;
  }

  ngOnInit(): void {
    // Load saved data type preference
    const savedDataType = localStorage.getItem('isProcessedData');

    if (savedDataType !== null) {
      this.isProcessedData = savedDataType === 'true';
    }

    this.files_list = [];
    this.http
      .get(`${this.baseUrl}files`)
      .subscribe((response: any) => {
        this.files_list = response['data'];
        console.log('files:', response, this.files_list);
        this.expandedFolders = this.files_list.map(() => false);
      });
    this.viewModes = [
      {
        name: 'Line Plot',
        code: 'AU',
        states: [
          {
            cname: 'Single Axis',
            code: 'A-SY',
          },
          {
            cname: 'Dual Axis',
            code: 'A-BR',
          },
          {
            cname: 'Tri Axis',
            code: 'A-TO',
          },
        ],
      },
      {
        cname: 'Rose Plot',
        code: 'CA',
      },
    ];
    this.plot = this.viewModes[0].states[0];
    if (this.viewModes.length !== 0) {
      this.show = true;
    }
    this.subscribeToThemeChanges();

    this.unitSerive.units$.subscribe((u) => {
      this.units = u;
    });
    console.log('units', this.units);
  }

  show: boolean = false;
  updateField(item: any, field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    setTimeout(() => {
      item[field] = value;
      this.changedRows.add(item.id);
      this.cdr.markForCheck();
    });
  }

  private chartInstances: EChartsType[] = [];
  private resizeObservers: ResizeObserver[] = [];
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
    this.loading = true;

    this.fullData = [];
    this.main_table = [];
    this.cleanupCharts();

    // Reset chart instances
    this.tideChartInstance = undefined;
    this.midChartInstance = undefined;

    this.http
      .get(
        `${this.baseUrl}${
          this.isProcessedData ? 'get_processed_data' : 'fetch_data_by_file'
        }/${file_id}`
      )
      .subscribe({
        next: (response: any) => {
          if (this.isMulti) {
            let data = this.fullData;
            this.fullData = [];
            setTimeout(() => {
              this.fullData = data;
              for (let index = 0; index < response.length; index++) {
                this.fullData.push(response[index]);
              }
              // Sort the data by date in ascending order
              this.fullData.sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              this.totalRecords = this.fullData.length;
              // Load initial page of data
              this.loadData({ first: 0, rows: 20 });
              if (this.fullData.length > 0) {
                // Set default date range to 1 day from the first data point
                const firstDate = new Date(this.fullData[0].date);
                const endDate = new Date(firstDate);
                endDate.setDate(endDate.getDate() + 1);
                this.selectedPolarDateRange = [firstDate, endDate];
                this.ngZone.runOutsideAngular(() => {
                  this.loadChart();
                });
              }
            }, 100);
          } else {
            this.fullData = [];
            setTimeout(() => {
              this.fullData = response;
              // Sort the data by date in ascending order
              this.fullData.sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              this.totalRecords = this.fullData.length;
              // Load initial page of data
              this.loadData({ first: 0, rows: 20 });
              if (this.fullData.length > 0) {
                // Set default date range to 1 day from the first data point
                const firstDate = new Date(this.fullData[0].date);
                const endDate = new Date(firstDate);
                endDate.setDate(endDate.getDate() + 1);
                this.selectedPolarDateRange = [firstDate, endDate];
                this.ngZone.runOutsideAngular(() => {
                  this.loadChart();
                });
              }
            }, 100);
          }
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.toast.error('Failed to load data');
          this.loading = false;
        },
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

  ngAfterViewInit(): void {
    this.loadChart();
  }

  loadChart() {
    // Ensure cleanup of existing charts
    this.cleanupCharts();
    // Wait for DOM to be ready
    setTimeout(() => {
      switch (this.plot.cname) {
        case 'Single Axis':
          this.Tide();
          this.currentSpeed();
          this.currentDirection();
          break;
        case 'Dual Axis':
          this.currentSpeedAndDirection();
          break;
        case 'Tri Axis':
          this.midSpeedDirection();
          break;
        case 'Rose Plot':
          this.midpolar();
          break;
      }
      this.loading = false;
    }, 100);
  }

  subscribeToThemeChanges(): void {
    this.themeService.currentTheme$.subscribe(() => {
      this.Tide();
      this.currentSpeed();
      this.currentDirection();
      this.currentSpeedAndDirection();
      this.midSpeedDirection();
      this.midpolar();
    });
  }

  private cleanupCharts() {
    // Dispose of all chart instances
    this.chartInstances.forEach((chart) => {
      if (chart && !chart.isDisposed()) {
        chart.dispose();
      }
    });
    this.chartInstances = [];

    // Dispose of specific chart instances
    if (this.tideChartInstance && !this.tideChartInstance.isDisposed()) {
      this.tideChartInstance.dispose();
    }
    if (this.midChartInstance && !this.midChartInstance.isDisposed()) {
      this.midChartInstance.dispose();
    }

    // Disconnect all resize observers
    this.resizeObservers.forEach((observer) => observer.disconnect());
    this.resizeObservers = [];
  }

  private setupResizeObserver(element: HTMLElement, chart: EChartsType) {
    const observer = new ResizeObserver(() => {
      if (!chart.isDisposed()) {
        chart.resize();
      }
    });
    observer.observe(element);
    this.resizeObservers.push(observer);
  }

  private addChartInstance(chart: EChartsType, element: HTMLElement) {
    this.chartInstances.push(chart);
    this.setupResizeObserver(element, chart);
    return chart;
  }

  updateValue(item: any, field: string, value: string) {
    item[field] = value;
  }

  formatValue(value: any): string {
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toFixed(4);
  }  

  onUpdateClick() {
    // Check for empty values
    const emptyRows = this.main_table.filter(
      (row) => row.speed === '' || row.direction === '' || row.pressure === ''
    );

    if (emptyRows.length > 0) {
      this.toast.error('Please fill all fields before updating');
      return;
    }

    this.loading = true;

    // Find all newly added rows using the isNewRow flag
    const newRows = this.main_table.filter((row) => row.isNewRow);
    const changedRows = this.main_table.filter(
      (row) => this.changedRows.has(row.id) && !row.isNewRow
    );

    const sourceUnits: { [key: string]: string } = {
      waterLevel: this.main_table[0].water_level_unit,
      currentSpeed: this.main_table[0].current_speed_unit,
      currentDirection: this.main_table[0].current_direction_unit,
      battery: this.main_table[0].battery_unit,
      depth: this.main_table[0].depth_unit,
    };

    // Create the payload
    let promises: Promise<any>[] = [];

    // Handle new rows
    if (newRows.length > 0) {
      // Check for units conversion
      const unitsMatch = Object.keys(this.units).every(
        key => this.units[key] === sourceUnits[key]
      );
      console.log('units', unitsMatch);
      const newRowsPromises = newRows.map((newRow) => {
        // Parse the date string to get hours and minutes
        const date = new Date(newRow.date);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        let newRowPayload: any;

        if(unitsMatch){
          newRowPayload = {
            id: newRow.id,
            file_id: newRow.file_id,
            timestamp: newRow.date,
            speed: parseFloat(newRow.speed),
            direction: parseFloat(newRow.direction),
            tide: parseFloat(newRow.pressure),
            time: timeString,
          };
        } else {
          newRowPayload = {
            id: newRow.id,
            file_id: newRow.file_id,
            timestamp: newRow.date,
            time: timeString,
          };
          
          // Convert speed if units don't match
          if (sourceUnits['currentSpeed'] !== this.units['currentSpeed']) {
            if (newRow.speed !== null && newRow.speed !== undefined) {
              newRowPayload.speed = this.convertValues(
                parseFloat(newRow.speed),
                this.units['currentSpeed'],
                sourceUnits['currentSpeed']
              );
            }
          } else {
            newRowPayload.speed = parseFloat(newRow.speed);
          }
          
          // Convert direction if units don't match
          if (sourceUnits['currentDirection'] !== this.units['currentDirection']) {
            if (newRow.direction !== null && newRow.direction !== undefined) {
              newRowPayload.direction = this.convertValues(
                parseFloat(newRow.direction),
                this.units['currentDirection'],
                sourceUnits['currentDirection']
              );
            }
          } else {
            newRowPayload.direction = parseFloat(newRow.direction);
          }
          
          // Convert pressure (tide) if units don't match
          if (sourceUnits['waterLevel'] !== this.units['waterLevel']) {
            if (newRow.pressure !== null && newRow.pressure !== undefined) {
              newRowPayload.tide = this.convertValues(
                parseFloat(newRow.pressure),
                this.units['waterLevel'],
                sourceUnits['waterLevel']
              );
            }
          } else {
            newRowPayload.tide = parseFloat(newRow.pressure);
          }
        }

        console.log(newRowPayload);
        return this.http
          .post(`${this.baseUrl}addNewRow`, newRowPayload)
          .toPromise();
      });
      promises.push(...newRowsPromises);
    }

    // Handle updated rows
    if (changedRows.length > 0) {
      // Check for units conversion
      const unitsMatch = Object.keys(this.units).every(
        key => this.units[key] === sourceUnits[key]
      );
      console.log('units', unitsMatch);

      const updatePayload = changedRows.map((row) => {
        let rowPayload: any;

        if (unitsMatch) {
          rowPayload = {
            id: row.id,
            file_id: row.file_id,
            speed: parseFloat(row.speed),
            direction: parseFloat(row.direction),
            pressure: parseFloat(row.pressure)
          };
        } else {
          rowPayload = {
            id: row.id,
            file_id: row.file_id
          };

          // Convert speed if units don't match
          if (sourceUnits['currentSpeed'] !== this.units['currentSpeed']) {
            if (row.speed !== null && row.speed !== undefined) {
              rowPayload.speed = this.convertValues(
                parseFloat(row.speed),
                this.units['currentSpeed'],
                sourceUnits['currentSpeed']
              );
            }
          } else {
            rowPayload.speed = parseFloat(row.speed);
          }

          // Convert direction if units don't match
          if (sourceUnits['currentDirection'] !== this.units['currentDirection']) {
            if (row.direction !== null && row.direction !== undefined) {
              rowPayload.direction = this.convertValues(
                parseFloat(row.direction),
                this.units['currentDirection'],
                sourceUnits['currentDirection']
              );
            }
          } else {
            rowPayload.direction = parseFloat(row.direction);
          }

          // Convert pressure if units don't match
          if (sourceUnits['waterLevel'] !== this.units['waterLevel']) {
            if (row.pressure !== null && row.pressure !== undefined) {
              rowPayload.pressure = this.convertValues(
                parseFloat(row.pressure),
                this.units['waterLevel'],
                sourceUnits['waterLevel']
              );
            }
          } else {
            rowPayload.pressure = parseFloat(row.pressure);
          }
        }

        console.log(rowPayload);
        return rowPayload;
      });

      const updatePromise = this.http
        .put(`${this.baseUrl}updateData`, updatePayload)
        .toPromise()
        .catch(error => {
          console.error('Failed to update rows:', error);
          throw error;
        });
        
      promises.push(updatePromise);
    }

    // Process all promises
    if (promises.length > 0) {
      Promise.all(promises)
        .then(() => {
          this.toast.success('Data updated successfully');
          this.changedRows.clear(); // Reset tracked changes
          // Refresh the data
          this.open_file(this.selectedFiles[0].file_id);
          this.visible = false;
        })
        .catch((error) => {
          console.error('Error updating data:', error);
          this.toast.error('Failed to update data');
        })
        .finally(() => {
          this.loading = false;
        });
    } else {
      this.toast.info('No changes to update');
      this.loading = false;
    }
  }

  addRowBelow(item: any) {
    const currentIndex = this.main_table.findIndex((row) => row.id === item.id);
    if (currentIndex !== -1) {
      // Parse the current date string directly
      const currentDateStr = item.date;
      const currentDate = new Date(currentDateStr);

      // Calculate the new timestamp
      let newDate: Date;
      if (currentIndex < this.main_table.length - 1) {
        // If there's a next row, calculate midpoint between current and next row
        const nextDateStr = this.main_table[currentIndex + 1].date;
        const nextDate = new Date(nextDateStr);
        newDate = new Date((currentDate.getTime() + nextDate.getTime()) / 2);
      } else {
        // If it's the last row, add 1 hour to the current timestamp
        newDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
      }

      // Keep the ISO format with UTC timezone
      const formattedDate = newDate.toISOString();

      // Generate a unique ID for the new row
      const maxId = Math.max(...this.main_table.map((row) => row.id));
      const newId = maxId + 1;

      const newRow: ApiData = {
        id: newId,
        date: formattedDate,
        speed: '',
        direction: '',
        pressure: '',
        file_id: item.file_id,
        file_name: item.file_name,
        battery: '',
        dept: '',
        high_water_level: 0,
        lat: '',
        lon: '',
        station_id: '',
        time: formattedDate.split('T')[1].split('.')[0],
        isNewRow: true,
        water_level_unit: item.water_level_unit,
        current_speed_unit: item.current_speed_unit,
        current_direction_unit: item.current_direction_unit,
        battery_unit: item.battery_unit,
        depth_unit: item.depth_unit
      };
      this.main_table.splice(currentIndex + 1, 0, newRow);
      this.fullData = [...this.main_table];

      // Sort the arrays by date in ascending order
      this.main_table.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      this.fullData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      this.cdr.detectChanges();
    }
  }

  removeRow(item: ApiData) {
    if (this.main_table.length > 1) {
      const index = this.main_table.findIndex((row) => row.id === item.id);
      if (index !== -1) {
        this.main_table.splice(index, 1);
        this.fullData = [...this.main_table];
        this.main_table.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.fullData.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.cdr.detectChanges();
      }
    } else {
      this.toast.warning('Cannot remove the last row');
    }
  }

  ngOnDestroy() {
    this.cleanupCharts();
    if (this.themeSubscription) {
      this.themeSubscription.disconnect();
    }
    this.themeChange$.complete();
  }

   
onDialogShow() {
  if (this.main_table.length === 0 && this.fullData.length > 0) {
    this.main_table = this.fullData;
  }
 
  const indexToHighlight = this.main_table.findIndex(item => item.id === this.selectedPointId);
 
  if (
    indexToHighlight !== null &&
    indexToHighlight >= 0 &&
    indexToHighlight < this.main_table.length
  ) {
    this.selectedPointId = this.main_table[indexToHighlight].id;
 
    const rowHeight = 46; // should match your virtualScrollItemSize
    const tableWrapper = this.tableWrapper?.nativeElement;
 
    if (this.table?.scrollToVirtualIndex) {
      this.table.scrollToVirtualIndex(indexToHighlight);
    } else if (tableWrapper) {
      // Center the row manually
      const visibleHeight = tableWrapper.clientHeight;
      const targetScrollTop = (indexToHighlight * rowHeight) - (visibleHeight / 2) + (rowHeight / 2);
      const maxScroll = tableWrapper.scrollHeight - visibleHeight;
 
      const scrollTop = Math.min(Math.max(targetScrollTop, 0), maxScroll);
 
      tableWrapper.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
 
    // Delay highlight to allow scroll to settle
    setTimeout(() => {
      const tableWrapper = this.tableWrapper?.nativeElement;
      if (tableWrapper) {
        const rows = tableWrapper.querySelectorAll('tr');
        const selectedRow = Array.from(rows).find((r: any) =>
          r.getAttribute('data-id') === String(this.selectedPointId)
        ) as HTMLElement;
 
        if (selectedRow) {
          selectedRow.classList.add('temp-highlight');
 
          // Remove highlight after 1.5 seconds
          setTimeout(() => {
            selectedRow.classList.remove('temp-highlight');
          }, 1500);
        }
      }
    }, 400); // Adjusted delay for scroll + render
 
    // Resize charts (safe placement)
    setTimeout(() => {
      this.chartInstances.forEach((chart) => {
        if (!chart.isDisposed()) {
          chart.resize();
        }
      });
    }, 500);
  }
}

  closeDialog() {
    this.visible = false;
    this.selectedPointId = null;
  }

  loadData(event: any) {
    this.loading = true;
  
    if (this.fullData.length === 0) {
      this.main_table = [];
      this.loading = false;
      return;
    }
  
    const sourceUnits: { [key: string]: string } = {
      waterLevel: this.fullData[0].water_level_unit,
      currentSpeed: this.fullData[0].current_speed_unit,
      currentDirection: this.fullData[0].current_direction_unit,
      battery: this.fullData[0].battery_unit,
      depth: this.fullData[0].depth_unit,
    };
  
    const unitsMatch = Object.keys(this.units).every(
      key => this.units[key] === sourceUnits[key]
    );
    console.log('match', unitsMatch);
  
    if (unitsMatch) {
      this.main_table = this.fullData;
    } else {
      this.main_table = this.fullData.map((item, index) => {
        const newItem = { ...item } as ApiData;
  
        // if waterLevel unit mismatches → convert pressure
        if (sourceUnits['waterLevel'] !== this.units['waterLevel']) {
          if (newItem.pressure !== null && newItem.pressure !== undefined) {
            const converted = this.convertValues(+item.pressure, sourceUnits['waterLevel'], this.units['waterLevel']);
            newItem.pressure = converted.toString();
            this.fullData[index].pressure = converted.toString();
          }
        }
  
        // if currentSpeed unit mismatches → convert speed
        if (sourceUnits['currentSpeed'] !== this.units['currentSpeed']) {
          if (newItem.speed !== null && newItem.speed !== undefined) {
            const converted = this.convertValues(+item.speed, sourceUnits['currentSpeed'], this.units['currentSpeed']);
            newItem.speed = converted.toString();
            this.fullData[index].speed = converted.toString();
          }
        }
  
        // if currentDirection unit mismatches → convert direction
        if (sourceUnits['currentDirection'] !== this.units['currentDirection']) {
          if (newItem.direction !== null && newItem.direction !== undefined) {
            const converted = this.convertValues(+item.direction, sourceUnits['currentDirection'], this.units['currentDirection']);
            newItem.direction = converted.toString();
            this.fullData[index].direction = converted.toString();
          }
        }
  
        return newItem;
      });
    }
  
    console.log('converted', this.fullData);
    this.loading = false;
    this.cdr.detectChanges();
  }

  private updateXAxisLabel(
    chart: EChartsType,
    startValue: number,
    endValue: number
  ) {
    const option = chart.getOption() as EChartsOption;

    // Calculate time difference in days
    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Set x-axis label based on time range
    let xAxisLabel = 'Hour';
    if (diffDays <= 1) {
      xAxisLabel = 'Hour';
    } else if (diffDays <= 31) {
      xAxisLabel = 'Day';
    } else if (diffDays <= 365) {
      xAxisLabel = 'Month';
    } else {
      xAxisLabel = 'Year';
    }

    (option.xAxis as any[])[0].name = xAxisLabel;
    chart.setOption(option);
  }

  Tide(): void {
    const chartType = this.selectedChart;
    this.loading = true;
    const tide = document.getElementById('tide');

    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const mainText = computedStyle.getPropertyValue('--text-color').trim();
    const subText = computedStyle.getPropertyValue('--font-secondary-color').trim();
    // const text = computedStyle.getPropertyValue('--circuit-color-pulse').trim();

    // Load saved color from localStorage or use default
    // const savedColor = localStorage.getItem('tideChartColor');
    // if (savedColor) {
    //   this.tideChartColor = savedColor;
    // }

    if (tide) {
      const existingInstance = echarts.getInstanceByDom(tide);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const tideLevel = echarts.init(tide);

      const option = {
        title: {
          text: 'Water Level',
          left: '2%',
          textStyle: {
            // color:
            //   localStorage.getItem('theme') === 'light' ? 'black' : 'white',
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: {
          trigger: 'axis',
        },
        xAxis: [
          {
            type: 'time',
            name: 'Day',
            nameLocation: 'middle',
            nameGap: 12,
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: mainText,
              rotate: 0,
            },
            axisLine: {
              show: true,
            },
          },
          {
            type: 'time',
            position: 'top',
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            name: `Water Level (${this.units.waterLevel})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.tideChartColor, // Use selected color
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: mainText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: subText,
                type: 'dotted',
              },
            },
          },
          {
            type: 'value',
            position: 'right',
            axisLine: {
              show: true,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
        ],
        legend: {
          orient: 'vertical',
          right: '15%',
          textStyle: {
            color: this.tideChartColor, // Use selected color
            fontSize: 14,
          },
        },
        toolbox: {
          feature: {
            // dataZoom: {
            //   yAxisIndex: 'none',
            //   title: {
            //     zoom: 'Zoom',
            //     back: 'Reset Zoom',
            //   },
            // },
            restore: {},
            saveAsImage: {
              backgroundColor: bgColor,
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: mainText,
          },
        },
        dataZoom: [
          {
            type: 'slider',
            bottom: 20,
            height: 15,
            start: 90,
            end: 100,
          },
          {
            type: 'inside',
            start: 90,
            end: 100,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],
        series: [
          {
            name: 'Water Level',
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.pressure)];
            }),
            type: chartType === 'bar' ? 'bar' : chartType,
            barWidth: chartType === 'bar' ? '50%' : undefined,
            itemStyle: {
              color: this.tideChartColor, // Use selected color
            },
            showSymbol: false,
            label: {
              show: false,
              fontSize: 12,
            },
          },
          {
            name: 'High Water Time',
            data: this.fullData
              .filter((item) => item.high_water_level === 1)
              .map((item) => [item.date, this.formatValue(item.pressure)]),
            type: 'scatter',
            symbolSize: 20,
            itemStyle: {
              color: '#ff0000',
              borderColor: this.base.chartFont === 'light' ? 'black' : 'white',
              // borderWidth: 2,
            },
            label: {
              show: true,
              position: 'top',
              formatter: 'High Water Time',
              fontSize: 12,
              color: '#ff0000',
            },
          },
          {
            type: 'line',
            xAxisIndex: 1,
            data: [],
            lineStyle: {
              opacity: 0,
            },
            showSymbol: true,
            tooltip: {
              show: false,
            },
          },
        ],
      };

      tideLevel.setOption(option);

      tideLevel.on('dataZoom', (params) => {
        const option = tideLevel.getOption() as EChartsOption;
        const startValue = (option.dataZoom as any[])[0].startValue;
        const endValue = (option.dataZoom as any[])[0].endValue;
        this.updateXAxisLabel(tideLevel, startValue, endValue);
      });

      tideLevel.off('click');
      tideLevel.on('click', (params: any) => {
        if (params.data && params.data[0] && this.isProcessedData) {
          const clickedDate = params.data[0];
          const clickedItem = this.fullData.find(
            (item) => item.date === clickedDate
          );
          if (clickedItem) {
            this.ngZone.run(() => {
              this.selectedPointId = clickedItem.id;
              this.visible = true;
              this.cdr.detectChanges();
            });
          }
        }
      });
      window.addEventListener('resize', () => {
        tideLevel.resize();
      });
    }
  }

  currentSpeed(): void {
    const chartType = this.selectedChart;
    // this.loading = true;
    const speed = document.getElementById('currentSpeed');

    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const mainText = computedStyle.getPropertyValue('--text-color').trim();
    const subText = computedStyle.getPropertyValue('--font-secondary-color').trim();

    if (speed) {
      const existingInstance = echarts.getInstanceByDom(speed);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const currentSpeed = echarts.init(speed);

      const option = {
        title: {
          text: 'Current Speed',
          left: '2%',
          textStyle: {
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: { trigger: 'axis' },
        // grid: { left: '7%', right: '5%' },
        xAxis: [
          {
            type: 'time',
            name: 'Day',
            nameLocation: 'middle',
            nameGap: 12,
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: mainText,
              rotate: 0,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            // splitLine: {
            //   show: true,
            // },
          },
          {
            type: 'time',
            position: 'top',
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
        ],

        yAxis: [
          {
            type: 'value',
            name: `Current speed (${this.units.currentSpeed})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentSpeedColor,
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: mainText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: subText,
                type: 'dotted',
              },
            },
          },
          {
            type: 'value',
            position: 'right',
            axisLine: {
              show: true,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
        ],

        legend: {
          // data: ['Current Speed'],
          orient: 'vertical',
          right: '15%',
          top: '2%',
          textStyle: {
            color: this.currentSpeedColor,
            fontSize: 14,
          },
        },
        toolbox: {
          feature: {
            // dataZoom: { yAxisIndex: 'none' },
            restore: {},
            saveAsImage: {
              backgroundColor: bgColor,
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: mainText,
          },
        },

        dataZoom: [
          {
            type: 'slider',
            bottom: 20,
            height: 15,
            start: 98, // You can adjust to define how much of the chart is visible initially
            end: 100, // Set the percentage of the range initially visible
          },
          {
            type: 'inside',
            start: 98,
            end: 100, // Can be modified based on your dataset's initial view preference
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],

        series: [
          {
            name: 'Current Speed',
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.speed)];
            }),
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_speed,
            // ]),
            type: chartType,
            // smooth: 'line',
            // lineStyle: { color: '#00ff00' },
            itemStyle: { color: this.currentSpeedColor },
            showSymbol: false,
            label: { show: true, fontSize: 12 },
            // yAxisIndex: 0,
          },
        ],
      };

      currentSpeed.setOption(option);
      currentSpeed.off('click');
      currentSpeed.on('click', (params: any) => {
        if (params.data && params.data[0] && this.isProcessedData) {
          const clickedDate = params.data[0];
          const clickedItem = this.fullData.find(
            (item) => item.date === clickedDate
          );
          if (clickedItem) {
            this.ngZone.run(() => {
              this.selectedPointId = clickedItem.id;
              this.visible = true;
              this.cdr.detectChanges();
            });
          }
        }
      });
      // this.loading = false;
      window.addEventListener('resize', () => {
        currentSpeed.resize();
      });
      currentSpeed.on('dataZoom', (params) => {
        const option = currentSpeed.getOption() as EChartsOption;
        const startValue = (option.dataZoom as any[])[0].startValue;
        const endValue = (option.dataZoom as any[])[0].endValue;
        this.updateXAxisLabel(currentSpeed, startValue, endValue);
      });
    } else {
      this.loading = false;
    }
  }

  currentDirection(): void {
    const chartType = this.selectedChart;
    const direction = document.getElementById('currentDirection');

    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const mainText = computedStyle.getPropertyValue('--text-color').trim();
    const subText = computedStyle.getPropertyValue('--font-secondary-color').trim();

    if (direction) {
      const existingInstance = echarts.getInstanceByDom(direction);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const currentDirection = echarts.init(direction);

      const option = {
        title: {
          text: 'Current Direction',
          left: '2%',
          textStyle: {
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: { trigger: 'axis' },
        // grid: { left: '7%', right: '5%' },

        xAxis: [
          {
            type: 'time',
            name: 'Day',
            nameLocation: 'middle',
            nameGap: 12,
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: mainText,
              rotate: 0,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            // splitLine: {
            //   show: true,
            // },
          },
          {
            type: 'time',
            position: 'top',
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
        ],

        yAxis: [
          {
            type: 'value',
            name: `Current Direction (${this.units.currentDirection})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentDirectionColor,
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: this.base.chartFont === 'light' ? 'black' : 'white',
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: subText,
                type: 'dotted',
              },
            },
          },
          {
            type: 'value',
            position: 'right',
            axisLine: {
              show: true,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
        ],

        legend: {
          data: ['Current Direction'],
          // selected: {
          //   'Current Direction': true,
          // },
          orient: 'vertical',
          right: '15%',
          top: '2%',
          textStyle: {
            color: this.currentDirectionColor,
            fontSize: 14,
          },
        },
        toolbox: {
          feature: {
            // dataZoom: { yAxisIndex: 'none' },
            restore: {},
            saveAsImage: {
              backgroundColor: bgColor,
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: mainText,
          },
        },

        dataZoom: [
          {
            type: 'slider',
            bottom: 20,
            height: 15,
            start: 98, // You can adjust to define how much of the chart is visible initially
            end: 100, // Set the percentage of the range initially visible
          },
          {
            type: 'inside',
            start: 98,
            end: 100, // Can be modified based on your dataset's initial view preference
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],

        series: [
          {
            name: 'Current Direction',
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_direction,
            // ]),
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.direction)];
            }),
            type: chartType,
            // smooth: 'line',
            // lineStyle: { color: '#00ff00' },
            itemStyle: { color: this.currentDirectionColor },
            // showSymbol: false,
            // symbol:
            //   'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
            // symbolSize: 14,
            // symbolOffset: [0, -7],
            // symbolRotate: (value: any) => value[1],
            // label: { show: false, fontSize: 12 },
            yAxisIndex: 0,
          },

          {
            data: this.fullData.map((item) => [item.date, 0]), // fix Y at bottom
            type: 'scatter', // use scatter so it doesn't draw a line
            // itemStyle: { color: '#1f77b4' },
            itemStyle: { color: mainText },
            symbol:
              'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
            symbolSize: 14,
            symbolOffset: [0, -7],
            symbolRotate: (value: any, params: any) =>
              parseFloat(this.fullData[params.dataIndex].direction),
            label: { show: false },
            yAxisIndex: 0,
            // name: '',
            // showLegendSymbol: false,
            // legendHoverLink: false,
            // emphasis: {
            //   disabled: true,
            // },
            tooltip: {
              show: false, // prevent tooltips too
            },
          },
        ],
      };

      currentDirection.setOption(option);
      currentDirection.off('click');
      currentDirection.on('click', (params: any) => {
        if (params.data && params.data[0] && this.isProcessedData) {
          const clickedDate = params.data[0];
          const clickedItem = this.fullData.find(
            (item) => item.date === clickedDate
          );
          if (clickedItem) {
            this.ngZone.run(() => {
              this.selectedPointId = clickedItem.id;
              this.visible = true;
              this.cdr.detectChanges();
            });
          }
        }
      });
      this.loading = false;
      window.addEventListener('resize', () => {
        currentDirection.resize();
      });
      currentDirection.on('dataZoom', (params) => {
        const option = currentDirection.getOption() as EChartsOption;
        const startValue = (option.dataZoom as any[])[0].startValue;
        const endValue = (option.dataZoom as any[])[0].endValue;
        this.updateXAxisLabel(currentDirection, startValue, endValue);
      });
    } else {
      this.loading = false;
    }
  }

  currentSpeedAndDirection(): void {
    const chartType = this.selectedChart;
    const chartContainer = document.getElementById('currentSpeedDirection');

    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const mainText = computedStyle.getPropertyValue('--text-color').trim();
    const subText = computedStyle.getPropertyValue('--font-secondary-color').trim();

    if (chartContainer) {
      const existingInstance = echarts.getInstanceByDom(chartContainer);
      if (existingInstance) {
        existingInstance.dispose();
      }

      const chart = echarts.init(chartContainer);

      const option = {
        title: {
          text: 'Dual Axis',
          left: '2%',
          textStyle: {
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        },
        // grid: { left: '7%', right: '7%' },
        // legend: {
        //   data: ['Current Speed', 'Current Direction'],
        //   top: '5%',
        //   right: '5%',
        //   textStyle: {
        //     color: subText,
        //   },
        // },

        xAxis: {
          type: 'time',
          name: 'Day',
          nameLocation: 'middle',
          nameGap: 12,
          nameTextStyle: {
            color: mainText,
            padding: [44, 0, 0, 0],
            fontSize: 14,
            fontWeight: 'bold',
          },
          axisLabel: {
            color: mainText,
            rotate: 0,
          },
          axisLine: { 
            show: true,
            lineStyle: {
              color: mainText,
            },
          },
        },
        yAxis: [
          {
            type: 'value',
            name: `Current Speed (${this.units.currentSpeed})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentSpeedColor,
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: mainText,
            },
            axisLine: { 
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            splitLine: { 
              show: true,
              lineStyle: {
                color: subText,
                type: 'dotted',
              },
            },
          },
          {
            type: 'value',
            name: `Current Direction (${this.units.currentDirection})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentDirectionColor,
              padding: [30, 0, 0, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: mainText,
            },
            axisLine: { show: true },
            splitLine: { show: false },
          },
        ],
        dataZoom: [
          {
            type: 'slider',
            bottom: 20,
            height: 15,
            start: 98,
            end: 100,
          },
          {
            type: 'inside',
            start: 98,
            end: 100,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],
        legend: {
          data: ['Current Speed', 'Current Direction'],
          orient: 'vertical',
          right: '15%',
          top: '2%',
          textStyle: {
            rich: {
              speed: {
                color: this.currentSpeedColor,
                fontSize: 14,
              },
              direction: {
                color: this.currentDirectionColor,
                fontSize: 14,
              },
            },
          },
          formatter: (name: string) => {
            if (name === 'Current Speed') {
              return '{speed|Current Speed}';
            } else if (name === 'Current Direction') {
              return '{direction|Current Direction}';
            }
            return name;
          },
        },

        toolbox: {
          feature: {
            // dataZoom: { yAxisIndex: 'none' },
            restore: {},
            saveAsImage: {
              backgroundColor: bgColor,
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: mainText,
          },
        },

        series: [
          {
            name: 'Current Speed',
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.speed)];
            }),
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_speed,
            // ]),
            type: chartType,
            itemStyle: { color: this.currentSpeedColor },
            showSymbol: false,
            label: { show: true, fontSize: 12 },
            yAxisIndex: 0,
          },
          {
            name: 'Current Direction',
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_direction,
            // ]),
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.direction)];
            }),
            type: chartType,
            itemStyle: { color: this.currentDirectionColor },
            // showSymbol: true,
            // symbol:
            //   'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
            // symbolSize: 14,
            // symbolOffset: [0, -7],
            // symbolRotate: (value: any) => value[1],
            // label: {
            //   show: false,
            //   fontSize: 12,
            // },
            yAxisIndex: 1,
          },
          // {
          //   data: this.fullData.map((item) => [item.date, 0]), // fix Y at bottom
          //   type: 'scatter', // use scatter so it doesn't draw a line
          //   // itemStyle: { color: '#1f77b4' },
          //   itemStyle: { color: 'blue' },
          //   symbol:
          //     'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
          //   symbolSize: 14,
          //   symbolOffset: [0, -7],
          //   symbolRotate: (value: any, params: any) =>
          //     parseFloat(this.fullData[params.dataIndex].direction),
          //   label: { show: false },
          //   yAxisIndex: 0,
          //   // name: '',
          //   // showLegendSymbol: false,
          //   // legendHoverLink: false,
          //   // emphasis: {
          //   //   disabled: true,
          //   // },
          //   tooltip: {
          //     show: false, // prevent tooltips too
          //   },
          // },
        ],
      };

      chart.setOption(option);
      chart.off('click');
      chart.on('click', (params: any) => {
        if (params.data && params.data[0] && this.isProcessedData) {
          const clickedDate = params.data[0];
          const clickedItem = this.fullData.find(
            (item) => item.date === clickedDate
          );
          if (clickedItem) {
            this.ngZone.run(() => {
              this.selectedPointId = clickedItem.id;
              this.visible = true;
              this.cdr.detectChanges();
            });
          }
        }
      });
      this.loading = false;

      window.addEventListener('resize', () => {
        chart.resize();
      });
      chart.on('dataZoom', (params) => {
        const option = chart.getOption() as EChartsOption;
        const startValue = (option.dataZoom as any[])[0].startValue;
        const endValue = (option.dataZoom as any[])[0].endValue;
        this.updateXAxisLabel(chart, startValue, endValue);
      });
    } else {
      this.loading = false;
    }
  }

  midSpeedDirection(): void {
    const chartType = this.selectedChart;
    const mid = document.getElementById('midSpeedDirection');

    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const mainText = computedStyle.getPropertyValue('--text-color').trim();
    const subText = computedStyle.getPropertyValue('--font-secondary-color').trim();

    if (mid) {
      const existingInstance = echarts.getInstanceByDom(mid);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const midspeedanddirection = echarts.init(mid);
      this.midChartInstance = midspeedanddirection; // Store the instance before setting options

      const option = {
        title: {
          text: 'Tri-axis',
          // text: 'Tri-axis (🌊 Tide, 🌀 Current Speed, 🧭 Current Direction)',
          left: '1%',
          // top: '0%',
          textStyle: {
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: {
          trigger: 'axis',
        },
        // grid: {
        //   left: '9%',
        //   // bottom: '30%',
        //   right: '5%',
        // },
        xAxis: [
          {
            type: 'time',
            name: 'Day',
            nameLocation: 'middle',
            nameGap: 12,
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: mainText,
              rotate: 0,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
          },
          {
            type: 'time',
            position: 'top',
            axisLine: {
              show: true,
              lineStyle: {
                color: mainText,
              },
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            name: `Current Speed (${this.units.currentSpeed})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentSpeedColor,
              padding: [0, 0, 15, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: this.base.chartFont === 'light' ? 'black' : 'white',
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: this.currentSpeedColor,
              },
            },
            splitLine: {
              show: false,
              // lineStyle: {
              //   type: 'solid',
              //   color: '#00ff00',
              // },
            },
          },
          {
            type: 'value',
            name: `Water Level (${this.units.waterLevel})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.tideChartColor,
              padding: [0, 0, 15, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: mainText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: this.tideChartColor,
              },
            },
            splitLine: {
              show: false,
              lineStyle: {
                color: subText,
                type: 'dotted',
              },
            },
            position: 'left',
            offset: 70, // to avoid overlap with third y-axis
          },
          {
            type: 'value',
            name: `Current Direction (${this.units.currentDirection})`,
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentDirectionColor,
              padding: [30, 0, 0, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: mainText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: this.currentDirectionColor,
              },
            },
            splitLine: {
              show: false,
              // lineStyle: {
              //   type: 'solid',
              //   color: '#00ff00',
              // },
            },
            position: 'right',
            min: 0,
            max: 360,
            interval: 90,
          },
        ],
        legend: {
          data: ['Water Level', 'Current Speed', 'Current Direction'],
          orient: 'horizontal',
          right: '15%',
          textStyle: {
            rich: {
              tide: {
                color: this.tideChartColor,
                fontSize: 14,
              },
              speed: {
                color: this.currentSpeedColor,
                fontSize: 14,
              },
              direction: {
                color: this.currentDirectionColor,
                fontSize: 14,
              },
            },
          },
          formatter: (name: string) => {
            if (name === 'Current Speed') {
              return '{speed|Current Speed}';
            } else if (name === 'Current Direction') {
              return '{direction|Current Direction}';
            } else if (name === 'Water Level') {
              return '{tide|Water Level}';
            }
            return name;
          },
        },
        toolbox: {
          feature: {
            // dataZoom: {
            //   yAxisIndex: 'none',
            // },
            restore: {},
            saveAsImage: {
              backgroundColor: bgColor,
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: mainText,
          },
        },
        dataZoom: [
          {
            type: 'slider',
            bottom: 20,
            height: 15,
            start: 98,
            end: 100,
          },
          {
            type: 'inside',
            start: 98,
            end: 100,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],
        series: [
          {
            name: 'Water Level',
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.tide,
            // ]),
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.pressure)];
            }),
            type: chartType,
            // lineStyle: {
            //   color: '#1f77b4',
            // },
            itemStyle: {
              color: this.tideChartColor,
            },
            showSymbol: false,
            label: {
              show: false,
              fontSize: 12,
            },
            yAxisIndex: 1,
          },
          {
            name: 'Current Speed',
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_speed,
            // ]),
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.speed)];
            }),
            type: chartType,
            // lineStyle: {
            //   color: '#00ff00',
            // },
            itemStyle: {
              color: this.currentSpeedColor,
            },
            showSymbol: false,
            label: {
              show: false,
              fontSize: 12,
            },
            yAxisIndex: 0,
          },

          {
            name: 'Current Direction',
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_direction,
            // ]),
            data: this.fullData.map((item) => {
              return [item.date, this.formatValue(item.direction)];
            }),
            type: chartType,
            // lineStyle: {
            //   color: '#0000ff',
            //   type: 'dashed',
            // },
            itemStyle: {
              color: this.currentDirectionColor,
            },
            // showSymbol: true,
            // symbol:
            //   'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
            // symbolSize: 14,
            // symbolOffset: [0, -7],
            // symbolRotate: (value: any) => value[1],
            // label: {
            //   show: false,
            //   fontSize: 12,
            // },
            yAxisIndex: 2,
          },

          // {
          //   data: this.fullData.map((item) => [item.date, 0]), // fix Y at bottom
          //   type: 'scatter', // use scatter so it doesn't draw a line
          //   // itemStyle: { color: '#1f77b4' },
          //   itemStyle: { color: 'blue' },
          //   symbol:
          //     'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
          //   symbolSize: [10, 10], // Reduce size here (width, height)
          //   symbolOffset: [0, -7],
          //   symbolRotate: (value: any, params: any) =>
          //     parseFloat(this.fullData[params.dataIndex].direction),
          //   label: { show: false },
          //   yAxisIndex: 2,
          //   // name: '',
          //   // showLegendSymbol: false,
          //   // legendHoverLink: false,
          //   // emphasis: {
          //   //   disabled: true,
          //   // },
          //   tooltip: {
          //     show: false, // prevent tooltips too
          //   },
          // },
        ],
      };

      midspeedanddirection.setOption(option);

      // Add click event after setting options
      midspeedanddirection.off('click');
      midspeedanddirection.on('click', (params: any) => {
        if (params.data && params.data[0] && this.isProcessedData) {
          const clickedDate = params.data[0];
          const clickedItem = this.fullData.find(
            (item) => item.date === clickedDate
          );
          if (clickedItem) {
            this.ngZone.run(() => {
              this.selectedPointId = clickedItem.id;
              this.visible = true;
              this.cdr.detectChanges();
            });
          }
        }
      });

      this.loading = false;
      window.addEventListener('resize', () => {
        midspeedanddirection.resize();
      });
      midspeedanddirection.on('dataZoom', (params) => {
        const option = midspeedanddirection.getOption() as EChartsOption;
        const startValue = (option.dataZoom as any[])[0].startValue;
        const endValue = (option.dataZoom as any[])[0].endValue;
        this.updateXAxisLabel(midspeedanddirection, startValue, endValue);
      });
    } else {
      this.loading = false;
    }
  }

  midpolar(): void {
    // if (
    //   !this.selectedPolarDateRange ||
    //   this.selectedPolarDateRange.length !== 2
    // ) {
    //   this.toast.warning('Please select a date range');
    //   return;
    // }

    const startDate = this.formatDateToYMD(this.selectedPolarDateRange[0]);
    const endDate = this.formatDateToYMD(this.selectedPolarDateRange[1]);

    if (this.PolarSelectedInterVal === 'all') {
      const intervals = [30, 60, 360, 1440];

      setTimeout(() => {
        intervals.forEach((interval) => {
          const groupedData = this.groupByIntervalWithinDateRange(
            this.fullData,
            startDate,
            endDate,
            interval
          );
          const averagedData = this.computeAverages(groupedData);
          this.renderPolarChart(
            `midpolar_${interval}`,
            averagedData,
            startDate,
            endDate,
            interval
          );
        });
      }, 100);
    } else {
      const interval = this.PolarSelectedInterVal;

      setTimeout(() => {
        const groupedData = this.groupByIntervalWithinDateRange(
          this.fullData,
          startDate,
          endDate,
          interval
        );
        const averagedData = this.computeAverages(groupedData);
        this.renderPolarChart(
          'midpolar',
          averagedData,
          startDate,
          endDate,
          interval
        );
      }, 100);
    }
  }

  private renderPolarChart(
    elementId: string,
    averagedPolarData: { speed: number; direction: number }[],
    startDate: string,
    endDate: string,
    interval: number
  ): void {
    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const mainText = computedStyle.getPropertyValue('--text-color').trim();
 
    const element = document.getElementById(elementId);
 
    const speedUnit = this.units?.currentSpeed || 'm/s'; // default to m/s
    const directionUnit = this.units?.currentDirection || '°'; // default to degree
    if (!element) {
      console.error(`Element with id '${elementId}' not found`);
      return;
    }
 
    const existingInstance = echarts.getInstanceByDom(element);
    if (existingInstance) {
      existingInstance.dispose();
    }
 
    const chart = echarts.init(element);
 
    const directionLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
 
    const speedLabelUnit = speedUnit === 'knots' ? 'knots' : 'm/s';
 
    let graphic: any = undefined;
 
    if (this.PolarSelectedInterVal !== 'all' || interval === 60) {
      graphic = {
        elements: [
          {
            type: 'text',
            right: '0%',
            top: '0%',
            style: {
              text: `Current Speed (${speedLabelUnit})`,
              fill: mainText,
              font: 'bold 12px sans-serif',
              textAlign: 'left',
            },
          },
        ],
      };
    }
 
    const speedCategories = [
      '<0.5',
      '0.5-2',
      '2-4',
      '4-6',
      '6-8',
      '>8',
    ] as const;
    const speedColors = [
      '#0000FF',
      '#3399FF',
      '#66CCFF',
      '#FFFF66',
      '#FF9933',
      '#FF3300',
    ];
 
    type SpeedCategory = (typeof speedCategories)[number];
    type DirectionBin = Record<SpeedCategory, number>;
 
    const categorizeSpeed = (speed: number): SpeedCategory => {
      if (speed < 0.5) return '<0.5';
      if (speed < 2) return '0.5-2';
      if (speed < 4) return '2-4';
      if (speed < 6) return '4-6';
      if (speed < 8) return '6-8';
      return '>8';
    };
 
    const dataBins: DirectionBin[] = directionLabels.map(() => ({
      '<0.5': 0,
      '0.5-2': 0,
      '2-4': 0,
      '4-6': 0,
      '6-8': 0,
      '>8': 0,
    }));
 
    // averagedPolarData.forEach(({ speed, direction }) => {
    //   // const directionIndex = Math.round(direction / 22.5) % 16;
 
    //   const directionIndex = Math.round(direction / 45) % 8;
    //   const speedCategory = categorizeSpeed(speed);
    //   dataBins[directionIndex][speedCategory] += 1;
    // });
 
    averagedPolarData.forEach(({ speed, direction }) => {
      // Convert speed to m/s if needed
      // const normalizedSpeed = speedUnit === 'knots' ? speed * 0.514444 : speed;
 
      // Convert direction to degrees if needed
      const normalizedDirection =
        directionUnit === 'radians' ? direction * (180 / Math.PI) : direction;
 
      const directionIndex = Math.round(normalizedDirection / 45) % 8;
      const speedCategory = categorizeSpeed(speed);
 
      dataBins[directionIndex][speedCategory] += 1;
    });
 
    const seriesData = speedCategories.map((speedCategory, index) => ({
      name: speedCategory,
      type: 'bar',
      stack: 'wind-speed',
      coordinateSystem: 'polar',
      data: dataBins.map((bin) => bin[speedCategory]),
      itemStyle: {
        color: speedColors[index],
      },
    }));
 
    const option = {
      title:
        this.PolarSelectedInterVal === 'all'
          ? {
              text: this.formatInterval(interval),
              top: '0%',
              left: 'center',
              textStyle: {
                color: mainText,
                fontSize: 18,
              },
            }
          : {
              text: this.formatInterval(interval),
              top: '0%',
              left: 'center',
              textStyle: {
                color: mainText,
                fontSize: 18,
              },
            },
      polar: { center: ['50%', '55%'] },
      legend:
        this.PolarSelectedInterVal === 'all'
          ? {
              show: interval == 60,
              // data: ['30 min', '60 min', '360 min', '1440 min'],
              orient: 'vertical',
              top: '5%',
              right: '0%',
              textStyle: {
                color: mainText,
                fontSize: 12,
              },
            }
          : {
              show: true,
              data: speedCategories,
              orient: 'vertical',
              top: '2%',
              right: '0%',
              textStyle: {
                color: mainText,
                fontSize: 12,
              },
            },
      graphic,
 
      angleAxis: {
        type: 'category',
        data: directionLabels,
        boundaryGap: true,
        startAngle: 110,
        axisLabel: {
          color: mainText,
        },
      },
      radiusAxis: {
        min: 0,
        axisLabel: {
          color: mainText,
          formatter: '{value}',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a}: {c}',
      },
      series: seriesData,
      animationDuration: 800,
    };
 
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  }
 
  private formatInterval(interval: number): string {
    switch (interval) {
      case 30:
        return '30 Minutes';
      case 60:
        return '1 Hour';
      case 360:
        return '6 Hours';
      case 1440:
        return '24 Hours';
      default:
        return `${interval} Minutes`;
    }
  }
 
 
  private groupByIntervalWithinDateRange(
    data: ApiData[],
    startDate: string,
    endDate: string,
    intervalMinutes: number
  ): Record<string, { speed: number; direction: number }[]> {
    const grouped: Record<string, { speed: number; direction: number }[]> = {};
 
    const dateStart = new Date(`${startDate}T00:00:00`);
    const dateEnd = new Date(`${endDate}T23:59:59`);
 
    data.forEach((entry) => {
      const localTime = this.toIST(entry.date);
 
      if (localTime >= dateStart && localTime <= dateEnd) {
        const roundedTime = new Date(
          Math.floor(localTime.getTime() / (intervalMinutes * 60 * 1000)) *
            intervalMinutes *
            60 *
            1000
        );
 
        const key = roundedTime.toISOString();
 
        if (!grouped[key]) {
          grouped[key] = [];
        }
 
        grouped[key].push({
          speed: parseFloat(entry.speed),
          direction: parseFloat(entry.direction),
        });
      }
    });
 
    return grouped;
  }
 
  private toIST(dateStr: string): Date {
    const utcDate = new Date(dateStr);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in ms
    return new Date(utcDate.getTime() + istOffset);
  }
 
  private computeAverages(
    grouped: Record<string, { speed: number; direction: number }[]>
  ): { speed: number; direction: number }[] {
    return Object.values(grouped).map((group) => {
      const avgSpeed =
        group.reduce((sum, item) => sum + item.speed, 0) / group.length;
      const avgDirection =
        group.reduce((sum, item) => sum + item.direction, 0) / group.length;
      return { speed: avgSpeed, direction: avgDirection };
    });
  }
 
  private formatDateToYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
