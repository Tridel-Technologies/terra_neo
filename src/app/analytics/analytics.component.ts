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

interface Files {
  id: number;
  files: string[];
  folder_name: string;
  timestamp: string;
}
interface dashdata {
  id: string;
  tide: string;
  date: string;
  time: string;
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
}

interface SelectedData {
  id: number;
  tide: string;
  datetime: string;
  current_speed: string;
  current_direction: string;
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
export class AnalyticsComponent implements OnInit, AfterViewInit {
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
  changedRows: Set<number> = new Set(); // Track rows that have been modified

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
  // chartOptions = [
  //   { label: 'Line Plot', value: 'line' },
  //   { label: 'Scatter Series', value: 'scatter' },
  //   { label: 'Bar Plot', value: 'bar' },
  // ];

  viewMode: string = 'Single Axis';
  viewModes = [
    { label: 'Single Axis', value: 'Single Axis' },
    { label: 'Dual Axis', value: 'Dual Axis' },
    { label: 'Tri Axis', value: 'Tri Axis' },
    { label: 'Polar', value: 'Polar' },
  ];

  totalRecords: number = 0;
  lazyParams: any = {
    first: 0,
    rows: 20,
  };
  private fullData: ApiData[] = [];

  sampleDataAdcp = [
    {
      id: 1,

      timestamp: '2024-10-01T00:00:00Z',

      current_speed: 2,

      current_direction: 245,

      tide: 3.66,
    },

    {
      id: 2,

      timestamp: '2024-10-01T01:00:00Z',

      current_speed: 1,

      current_direction: 91,

      tide: 3.56,
    },

    {
      id: 3,

      timestamp: '2024-10-01T02:00:00Z',

      current_speed: 2,

      current_direction: 247,

      tide: 3.45,
    },

    {
      id: 4,

      timestamp: '2024-10-01T03:00:00Z',

      current_speed: 3,

      current_direction: 342,

      tide: 3.31,
    },

    {
      id: 5,

      timestamp: '2024-10-01T04:00:00Z',

      current_speed: 2,

      current_direction: 165,

      tide: 3.12,
    },

    {
      id: 6,

      timestamp: '2024-10-01T05:00:00Z',

      current_speed: 0,

      current_direction: 304,

      tide: 2.86,
    },

    {
      id: 7,

      timestamp: '2024-10-01T06:00:00Z',

      current_speed: 1,

      current_direction: 111,

      tide: 2.7,
    },

    {
      id: 8,

      timestamp: '2024-10-01T07:00:00Z',

      current_speed: 1,

      current_direction: 268,

      tide: 2.51,
    },

    {
      id: 9,

      timestamp: '2024-10-01T08:00:00Z',

      current_speed: 3,

      current_direction: 258,

      tide: 2.24,
    },

    {
      id: 10,

      timestamp: '2024-10-01T09:00:00Z',

      current_speed: 2,

      current_direction: 335,

      tide: 2,
    },

    {
      id: 11,

      timestamp: '2024-10-01T10:00:00Z',

      current_speed: 0,

      current_direction: 205,

      tide: 1.82,
    },

    {
      id: 12,

      timestamp: '2024-10-01T11:00:00Z',

      current_speed: 1,

      current_direction: 83,

      tide: 1.62,
    },

    {
      id: 13,

      timestamp: '2024-10-01T12:00:00Z',

      current_speed: 1,

      current_direction: 315,

      tide: 1.43,
    },

    {
      id: 14,

      timestamp: '2024-10-01T13:00:00Z',

      current_speed: 3,

      current_direction: 114,

      tide: 1.23,
    },

    {
      id: 15,

      timestamp: '2024-10-01T14:00:00Z',

      current_speed: 3,

      current_direction: 268,

      tide: 1.11,
    },

    {
      id: 16,

      timestamp: '2024-10-01T15:00:00Z',

      current_speed: 0,

      current_direction: 357,

      tide: 1,
    },

    {
      id: 17,

      timestamp: '2024-10-01T16:00:00Z',

      current_speed: 2,

      current_direction: 203,

      tide: 0.91,
    },

    {
      id: 18,

      timestamp: '2024-10-01T17:00:00Z',

      current_speed: 3,

      current_direction: 143,

      tide: 0.86,
    },

    {
      id: 19,

      timestamp: '2024-10-01T18:00:00Z',

      current_speed: 1,

      current_direction: 99,

      tide: 0.83,
    },

    {
      id: 20,

      timestamp: '2024-10-01T19:00:00Z',

      current_speed: 1,

      current_direction: 161,

      tide: 0.84,
    },

    {
      id: 21,

      timestamp: '2024-10-01T20:00:00Z',

      current_speed: 0,

      current_direction: 123,

      tide: 0.88,
    },

    {
      id: 22,

      timestamp: '2024-10-01T21:00:00Z',

      current_speed: 3,

      current_direction: 175,

      tide: 0.94,
    },

    {
      id: 23,

      timestamp: '2024-10-01T22:00:00Z',

      current_speed: 3,

      current_direction: 252,

      tide: 1.08,
    },

    {
      id: 24,

      timestamp: '2024-10-01T23:00:00Z',

      current_speed: 3,

      current_direction: 73,

      tide: 1.18,
    },

    {
      id: 25,

      timestamp: '2024-10-02T00:00:00Z',

      current_speed: 3,

      current_direction: 122,

      tide: 1.35,
    },

    {
      id: 26,

      timestamp: '2024-10-02T01:00:00Z',

      current_speed: 3,

      current_direction: 39,

      tide: 1.5,
    },

    {
      id: 27,

      timestamp: '2024-10-02T02:00:00Z',

      current_speed: 0,

      current_direction: 97,

      tide: 1.64,
    },

    {
      id: 28,

      timestamp: '2024-10-02T03:00:00Z',

      current_speed: 2,

      current_direction: 324,

      tide: 1.86,
    },

    {
      id: 29,

      timestamp: '2024-10-02T04:00:00Z',

      current_speed: 3,

      current_direction: 206,

      tide: 2.01,
    },

    {
      id: 30,

      timestamp: '2024-10-02T05:00:00Z',

      current_speed: 2,

      current_direction: 184,

      tide: 2.16,
    },

    {
      id: 31,

      timestamp: '2024-10-02T06:00:00Z',

      current_speed: 3,

      current_direction: 177,

      tide: 2.4,
    },

    {
      id: 32,

      timestamp: '2024-10-02T07:00:00Z',

      current_speed: 3,

      current_direction: 332,

      tide: 2.67,
    },

    {
      id: 33,

      timestamp: '2024-10-02T08:00:00Z',

      current_speed: 3,

      current_direction: 249,

      tide: 2.79,
    },

    {
      id: 34,

      timestamp: '2024-10-02T09:00:00Z',

      current_speed: 2,

      current_direction: 77,

      tide: 3.04,
    },

    {
      id: 35,

      timestamp: '2024-10-02T10:00:00Z',

      current_speed: 1,

      current_direction: 219,

      tide: 3.28,
    },

    {
      id: 36,

      timestamp: '2024-10-02T11:00:00Z',

      current_speed: 3,

      current_direction: 148,

      tide: 3.46,
    },

    {
      id: 37,

      timestamp: '2024-10-02T12:00:00Z',

      current_speed: 2,

      current_direction: 287,

      tide: 3.61,
    },

    {
      id: 38,

      timestamp: '2024-10-02T13:00:00Z',

      current_speed: 0,

      current_direction: 224,

      tide: 3.86,
    },
  ];

  tideChartColor: string = localStorage.getItem('tideChartColor') ?? '#4900ff';
  currentSpeedColor: string = localStorage.getItem('currentSpeedColor') ?? '#ff00c1';
  currentDirectionColor: string = localStorage.getItem('currentDirectionColor') ?? '#000000';

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

  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}
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
  }

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
    console.log(fileName, file_id);
    this.selected_folder_name = folder_name;
    this.isMulti = false;
    this.selectedFiles = [
      {
        file_name: fileName,
        file_id: file_id,
      },
    ];
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
    this.loading = true;

    this.fullData = [];
    this.main_table = [];
    this.cleanupCharts();

    // Reset chart instances
    this.tideChartInstance = undefined;
    this.midChartInstance = undefined;

    this.http
      .get(
        `http://localhost:3000/api/fetch_data_by_file/${this.openedFolder}/${file_name}`
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

  // tap_date(dateTime: string) {
  //   console.log('tapped datetime:', dateTime);

  //   // Find the matching item in main_table
  //   const selectedItem = this.main_table.find((item) => item.date === dateTime);

  //   if (selectedItem) {
  //     const data: SelectedData = {
  //       id: selectedItem.id,
  //       tide: selectedItem.pressure,
  //       datetime: selectedItem.date, // Use the full datetime string directly
  //       current_speed: selectedItem.speed,
  //       current_direction: selectedItem.direction,
  //     };
  //     this.selected_data = data;
  //     console.log('Selected data:', this.selected_data);
  //   } else {
  //     console.warn('No matching record found for datetime:', dateTime);
  //   }
  // }
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

  // onChartTypeChange() {
  //   this.loadChart();
  // }

  // loadChart() {
  //   setTimeout(() => {
  //     if (this.isCompareView) {
  //       this.Tide();
  //       this.currentSpeed();
  //       this.currentDirection();
  //       this.midSpeedDirection();
  //       this.midSpeedDirection2();
  //       this.midpolar();
  //     } else {
  //       this.Tide();
  //       this.currentSpeed();
  //       this.currentDirection();
  //       this.currentSpeedAndDirection();
  //       this.midSpeedDirection();
  //       this.midpolar();
  //     }
  //   }, 100);
  // }

  loadChart() {
    // Ensure cleanup of existing charts
    this.cleanupCharts();

    // Wait for DOM to be ready
    setTimeout(() => {
      switch (this.viewMode) {
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
        case 'Polar':
          this.midpolar();
          break;
      }
      this.loading = false;
    }, 100);
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

    // Find the newly added row using the isNewRow flag
    const newRow = this.main_table.find((row) => row.isNewRow);
    const changedRows = this.main_table.filter(
      (row) => this.changedRows.has(row.id) && !row.isNewRow
    );

    // Create the payload
    let promises: Promise<any>[] = [];

    // Handle new rows
    if (newRow) {
      // Parse the date string to get hours and minutes
      const date = new Date(newRow.date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const newRowPayload = {
        id: newRow.id,
        timestamp: newRow.date,
        speed: parseFloat(newRow.speed),
        direction: parseFloat(newRow.direction),
        tide: parseFloat(newRow.pressure),
        time: timeString,
      };

      const newRowPromise = this.http
        .post('http://localhost:3000/api/addNewRow', newRowPayload)
        .toPromise();
      promises.push(newRowPromise);
    }

    // Handle updated rows
    if (changedRows.length > 0) {
      const updatePayload = changedRows.map((row) => ({
        id: row.id,
        speed: parseFloat(row.speed),
        direction: parseFloat(row.direction),
        pressure: parseFloat(row.pressure),
      }));

      const updatePromise = this.http
        .put('http://localhost:3000/api/updateData', updatePayload)
        .toPromise();
      promises.push(updatePromise);
    }

    // Process all promises
    if (promises.length > 0) {
      Promise.all(promises)
        .then(() => {
          this.toast.success('Data updated successfully');
          this.changedRows.clear(); // Reset tracked changes
          // Refresh the data
          this.open_file(this.opened_file, this.openedFolder);
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

      const newRow = {
        id: item.id,
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

  ngOnDestroy() {
    this.cleanupCharts();
  }

  onDialogShow() {
    // Ensure data is loaded
    if (this.main_table.length === 0 && this.fullData.length > 0) {
      this.main_table = this.fullData;
    }

    // Wait for the dialog and table to be fully rendered
    setTimeout(() => {
      if (this.selectedPointId !== null) {
        const tableWrapper = this.tableWrapper?.nativeElement;
        if (tableWrapper) {
          // Find the selected row element
          const selectedRow = tableWrapper.querySelector(
            `tr[data-id="${this.selectedPointId}"]`
          );
          if (selectedRow) {
            // Get the position of the selected row relative to the table wrapper
            const rowTop = selectedRow.offsetTop;
            const wrapperHeight = tableWrapper.clientHeight;
            const rowHeight = selectedRow.clientHeight;

            // Calculate the scroll position to center the row
            const scrollPosition = Math.max(
              0,
              rowTop - wrapperHeight / 2 + rowHeight / 2
            );

            // Scroll to the position with smooth behavior
            tableWrapper.scrollTo({
              top: scrollPosition,
              behavior: 'smooth',
            });
          } else {
            // If row not found, it might be because of virtual scrolling
            // Find the index of the selected item
            const selectedIndex = this.main_table.findIndex(
              (item) => item.id === this.selectedPointId
            );
            if (selectedIndex !== -1) {
              // Calculate approximate scroll position based on row height and index
              const rowHeight = 46; // This should match virtualScrollItemSize
              const scrollPosition = Math.max(
                0,
                selectedIndex * rowHeight - tableWrapper.clientHeight / 2
              );

              tableWrapper.scrollTo({
                top: scrollPosition,
                behavior: 'smooth',
              });
            }
          }
        }
      }

      // Resize charts
      this.chartInstances.forEach((chart) => {
        if (!chart.isDisposed()) {
          chart.resize();
        }
      });
    }, 500); // Increased timeout to ensure dialog and table are fully rendered
  }

  closeDialog() {
    this.visible = false;
    this.selectedPointId = null;
  }

  loadData(event: any) {
    this.loading = true;
    this.main_table = this.fullData;
    this.loading = false;
    this.cdr.detectChanges();
  }

  Tide(): void {
    const chartType = this.selectedChart;
    this.loading = true;
    const tide = document.getElementById('tide');
  
    // Load saved color from localStorage or use default
    const savedColor = localStorage.getItem('tideChartColor');
    if (savedColor) {
      this.tideChartColor = savedColor;
    }
  
    const bgColor = '#ffffff'; // White background for image export
    const mainText = '#000000'; // Black for titles/labels
    const subText = '#666666'; // Grey for axis labels and legend
  
    if (tide) {
      const existingInstance = echarts.getInstanceByDom(tide);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const tideLevel = echarts.init(tide);
  
      const option = {
        title: {
          text: 'Water Level',
          left: '1%',
          textStyle: {
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
            name: 'DateTime',
            nameLocation: 'middle',
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
            },
            axisLabel: {
              color: subText,
              rotate: 45,
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
            name: 'Water Level (m)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.tideChartColor, // Use selected color
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
            },
            axisLine: {
              show: true,
            },
            splitLine: {
              show: true,
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
            dataZoom: {
              yAxisIndex: 'none',
              title: {
                zoom: 'Zoom',
                back: 'Reset Zoom',
              },
            },
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
              return [item.date, parseFloat(item.pressure)];
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
            type: 'line',
            xAxisIndex: 1,
            data: [],
            lineStyle: {
              opacity: 0,
            },
            showSymbol: false,
            tooltip: {
              show: false,
            },
          },
        ],
      };
  
      tideLevel.setOption(option);
      tideLevel.off('click');
      tideLevel.on('click', (params: any) => {
        if (params.data && params.data[0]) {
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
    const speed = document.getElementById('currentSpeed');

    const savedColor = localStorage.getItem('currentSpeedColor');
    if (savedColor) {
      this.currentSpeedColor = savedColor;
    }

    const bgColor = '#ffffff'; // White background for image export
    const mainText = '#000000'; // Black for titles/labels
    const subText = '#666666'; // Grey for axis labels and legend

    if (speed) {
      const existingInstance = echarts.getInstanceByDom(speed);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const currentSpeed = echarts.init(speed);

      const option = {
        title: {
          text: 'Current Speed',
          left: '1%',
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
            name: 'DateTime',
            nameLocation: 'middle',
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
            },
            axisLabel: {
              color: subText,
              rotate: 45,
            },
            axisLine: {
              show: true,
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
            name: 'Current speed (m/s)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentSpeedColor,
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: { color: subText },
            axisLine: {
              show: true,
              // lineStyle: { color: '#00ff00' },
            },
            splitLine: {
              show: true,
              // lineStyle: {
              //   type: 'solid',
              //   color: '#00ff00',
              // },
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
            dataZoom: { yAxisIndex: 'none' },
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
              return [item.date, parseFloat(item.speed)];
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
        if (params.data && params.data[0]) {
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
        currentSpeed.resize();
      });
    } else {
      this.loading = false;
    }
  }

  currentDirection(): void {
    const chartType = this.selectedChart;
    const direction = document.getElementById('currentDirection');

    const savedColor = localStorage.getItem('currentDirectionColor');
    if (savedColor) {
      this.currentDirectionColor = savedColor;
    }
    
    const bgColor = '#ffffff'; // White background for image export
    const mainText = '#000000'; // Black for titles/labels
    const subText = '#666666'; // Grey for axis labels and legend

    if (direction) {
      const existingInstance = echarts.getInstanceByDom(direction);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const currentDirection = echarts.init(direction);

      const option = {
        title: {
          text: 'Current Direction',
          left: '1%',
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
            name: 'DateTime',
            nameLocation: 'middle',
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
            },
            axisLabel: {
              color: subText,
              rotate: 45,
            },
            axisLine: {
              show: true,
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
            name: 'Current Direction (°)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentDirectionColor,
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: { color: subText },
            axisLine: {
              show: true,
              // lineStyle: { color: '#00ff00' },
            },
            splitLine: {
              show: true,
              // lineStyle: {
              //   type: 'solid',
              //   color: '#00ff00',
              // },
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
            dataZoom: { yAxisIndex: 'none' },
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
              return [item.date, parseFloat(item.direction)];
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
            itemStyle: { color: this.currentDirectionColor },
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
        if (params.data && params.data[0]) {
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
    } else {
      this.loading = false;
    }
  }

  currentSpeedAndDirection(): void {
    const chartType = this.selectedChart;
    const chartContainer = document.getElementById('currentSpeedDirection');

    const bgColor = '#ffffff';
    const mainText = '#000000';
    const subText = '#666666';

    if (chartContainer) {
      const existingInstance = echarts.getInstanceByDom(chartContainer);
      if (existingInstance) {
        existingInstance.dispose();
      }

      const chart = echarts.init(chartContainer);

      const option = {
        title: {
          text: 'Dual Axis',
          left: '1%',
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
          name: 'DateTime',
          nameLocation: 'middle',
          nameTextStyle: {
            color: mainText,
            padding: [44, 0, 0, 0],
            fontSize: 14,
          },
          axisLabel: {
            color: subText,
            rotate: 45,
          },
          axisLine: { show: true },
        },
        yAxis: [
          {
            type: 'value',
            name: 'Current Speed (m/s)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentSpeedColor,
              padding: [0, 0, 30, 0],
              fontSize: 16,
            },
            axisLabel: { color: subText },
            axisLine: { show: true },
            splitLine: { show: true },
          },
          {
            type: 'value',
            name: 'Current Direction (°)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentDirectionColor,
              padding: [30, 0, 0, 0],
              fontSize: 16,
            },
            axisLabel: { color: subText },
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
          // data: ['Current Speed'],
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
            dataZoom: { yAxisIndex: 'none' },
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
              return [item.date, parseFloat(item.speed)];
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
              return [item.date, parseFloat(item.direction)];
            }),
            type: chartType,
            itemStyle: { color: this.currentDirectionColor },
            // showSymbol: true,
            // symbol:
            //   'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
            // symbolSize: 14,
            // symbolOffset: [0, -7],
            // symbolRotate: (value: any) => value[1],
            // label: { show: false },
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
        if (params.data && params.data[0]) {
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
    } else {
      this.loading = false;
    }
  }

  midSpeedDirection(): void {
    const chartType = this.selectedChart;
    const mid = document.getElementById('midSpeedDirection');

    // const computedStyle = getComputedStyle(document.body);
    // const bgColor = computedStyle
    //   .getPropertyValue('--secbackground-color')
    //   .trim();
    // const mainText = computedStyle.getPropertyValue('--chart-maintext').trim();
    // const subText = computedStyle.getPropertyValue('--main-text').trim();

    const bgColor = '#ffffff'; // White background for image export
    const mainText = '#000000'; // Black for titles/labels
    const subText = '#666666'; // Grey for axis labels and legend

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
            name: 'DateTime',
            nameLocation: 'middle',
            nameTextStyle: {
              color: mainText,
              padding: [44, 0, 0, 0],
              fontSize: 14,
            },
            axisLabel: {
              color: subText,
              rotate: 45,
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
            name: 'Current Speed (m/s)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentSpeedColor,
              padding: [0, 0, 15, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
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
            name: 'Water Level (m)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.tideChartColor,
              padding: [0, 0, 15, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: this.tideChartColor,
              },
            },
            splitLine: {
              show: false,
              // lineStyle: {
              //   type: 'solid',
              //   color: '#00ff00',
              // },
            },
            position: 'left',
            offset: 70, // to avoid overlap with third y-axis
          },
          {
            type: 'value',
            name: 'Current Direction (°)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.currentDirectionColor,
              padding: [30, 0, 0, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
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
            color: subText,
            fontSize: 14,
          },
        },
        toolbox: {
          feature: {
            dataZoom: {
              yAxisIndex: 'none',
            },
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
              return [item.date, parseFloat(item.pressure)];
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
              return [item.date, parseFloat(item.speed)];
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
              return [item.date, parseFloat(item.direction)];
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
        if (params.data && params.data[0]) {
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
    } else {
      this.loading = false;
    }
  }

  midSpeedDirection2(): void {
    const chartType = this.selectedChart;
    const mid = document.getElementById('midSpeedDirection2');

    // const computedStyle = getComputedStyle(document.body);
    // const bgColor = computedStyle
    //   .getPropertyValue('--secbackground-color')
    //   .trim();
    // const mainText = computedStyle.getPropertyValue('--chart-maintext').trim();
    // const subText = computedStyle.getPropertyValue('--main-text').trim();

    const bgColor = '#ffffff'; // White background for image export
    const mainText = '#000000'; // Black for titles/labels
    const subText = '#666666'; // Grey for axis labels and legend

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
            name: 'Date',
            nameLocation: 'middle',
            nameTextStyle: {
              color: mainText,
              padding: [40, 0, 0, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
              rotate: 45,
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
            name: 'Current Speed (m/s)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: 'red',
              padding: [0, 0, 10, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: 'red',
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
            name: 'Tide (m)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: '#4900ff',
              padding: [0, 0, 10, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: '#4900ff', // orange
              },
            },
            splitLine: {
              show: false,
              // lineStyle: {
              //   type: 'solid',
              //   color: '#00ff00',
              // },
            },
            position: 'left',
            offset: 70, // to avoid overlap with third y-axis
          },
          {
            type: 'value',
            name: 'Current Direction (°)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: 'green',
              padding: 25,
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: 'green',
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
          data: ['Current Speed', 'Tide', 'Current Direction'],
          orient: 'horizontal',
          right: '15%',
          textStyle: {
            color: subText,
            fontSize: 14,
          },
        },
        toolbox: {
          feature: {
            dataZoom: {
              yAxisIndex: 'none',
            },
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
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'filter',
            start: 0,
            end: 100,
          },
          {
            type: 'slider',
            bottom: 20,
            height: 15,
            xAxisIndex: 0,
            filterMode: 'filter',
            start: 0,
            end: 100,
          },
          {
            type: 'inside',
            yAxisIndex: 0,
            filterMode: 'filter',
            start: 0,
            end: 100,
          },
          {
            type: 'inside',
            yAxisIndex: 1,
            filterMode: 'filter',
            start: 0,
            end: 100,
          },
          {
            type: 'inside',
            yAxisIndex: 2,
            filterMode: 'filter',
            start: 0,
            end: 100,
          },
        ],
        series: [
          {
            name: 'Current Speed',
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_speed,
            // ]),
            data: this.main_table.map((item) => {
              const dateStr = item.date.split('T')[0];
              const combinedDateTime = new Date(`${dateStr}T${item.time}`);
              return [combinedDateTime, parseFloat(item.speed)];
            }),
            type: 'scatter',
            // lineStyle: {
            //   color: '#00ff00',
            // },
            itemStyle: {
              color: 'red',
            },
            showSymbol: false,
            label: {
              show: false,
              fontSize: 12,
            },
            yAxisIndex: 0,
          },
          {
            name: 'Tide',
            data: this.sampleDataAdcp.map((item) => [
              item.timestamp,
              item.tide,
            ]),
            // type: chartType,
            type: 'scatter',
            // lineStyle: {
            //   color: '#1f77b4',
            // },
            itemStyle: {
              color: '#4900ff',
            },
            showSymbol: false,
            label: {
              show: false,
              fontSize: 12,
            },
            yAxisIndex: 1,
          },
          {
            name: 'Current Direction',
            // data: this.sampleDataAdcp.map((item) => [
            //   item.timestamp,
            //   item.current_direction,
            // ]),
            data: this.main_table.map((item) => {
              const dateStr = item.date.split('T')[0];
              const combinedDateTime = new Date(`${dateStr}T${item.time}`);
              return [combinedDateTime, parseFloat(item.direction)];
            }),
            type: 'scatter',
            // lineStyle: {
            //   color: '#0000ff',
            //   type: 'dashed',
            // },
            itemStyle: {
              color: 'green',
            },
            showSymbol: true,
            symbol:
              'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
            symbolSize: 14,
            symbolOffset: [0, -7],
            symbolRotate: (value: any) => value[1],
            label: {
              show: false,
              fontSize: 12,
            },
            yAxisIndex: 2,
          },
        ],
      };

      midspeedanddirection.setOption(option);

      // Add click event after setting options
      midspeedanddirection.on('click', (params: echarts.ECElementEvent) => {
        const dataIndex = params.dataIndex;
        if (dataIndex !== undefined) {
          this.selectedPointId = this.sampleDataAdcp[dataIndex].id;
          this.visible = true;
        }
      });

      this.loading = false;
      window.addEventListener('resize', () => {
        midspeedanddirection.resize();
      });
    } else {
      this.loading = false;
    }
  }

  midpolar(): void {
    // const chartType = this.selectedChart;
    // this.loading = true;
    let sampleDataPolar = [
      { speed: 3.4, direction: 45 },
      { speed: 1.6, direction: 120 },
      { speed: 4.1, direction: 270 },
      { speed: 2.4, direction: 90 },
      { speed: 0.0, direction: 180 },
      { speed: 4.4, direction: 200 },
      { speed: 0.9, direction: 320 },
      { speed: 2.8, direction: 135 },
      { speed: 1.5, direction: 270 },
      { speed: 1.2, direction: 15 },
      { speed: 2.3, direction: 60 },
      { speed: 5.1, direction: 330 },
      { speed: 3.1, direction: 75 },
      { speed: 2.0, direction: 150 },
      { speed: 4.3, direction: 210 },
      { speed: 0.7, direction: 300 },
      { speed: 5.2, direction: 10 },
      { speed: 0.8, direction: 80 },
      { speed: 5.0, direction: 360 },
      { speed: 2.5, direction: 240 },
      { speed: 1.0, direction: 30 },
      { speed: 3.7, direction: 190 },
      { speed: 1.6, direction: 120 },
      { speed: 4.0, direction: 210 },
      { speed: 2.9, direction: 260 },
      { speed: 2.3, direction: 350 },
      { speed: 4.6, direction: 180 },
      { speed: 1.3, direction: 70 },
      { speed: 3.0, direction: 45 },
      { speed: 0.9, direction: 300 },
      { speed: 4.5, direction: 220 },
      { speed: 0.6, direction: 110 },
      { speed: 2.1, direction: 190 },
      { speed: 3.8, direction: 350 },
      { speed: 5.0, direction: 40 },
      { speed: 2.6, direction: 80 },
      { speed: 5.3, direction: 140 },
      { speed: 3.2, direction: 300 },
      { speed: 1.4, direction: 160 },
      { speed: 5.7, direction: 270 },
      { speed: 2.0, direction: 30 },
      { speed: 1.1, direction: 50 },
      { speed: 4.2, direction: 200 },
      { speed: 0.8, direction: 360 },
      { speed: 2.3, direction: 120 },
      { speed: 3.0, direction: 90 },
      { speed: 4.8, direction: 260 },
      { speed: 0.5, direction: 300 },
      { speed: 5.9, direction: 15 },
      { speed: 3.5, direction: 170 },
      { speed: 2.2, direction: 320 },
      { speed: 2.8, direction: 240 },
      { speed: 6.1, direction: 360 },
    ];
    const polar2 = document.getElementById('midpolar')!;

    setTimeout(() => {
      const bgColor = '#ffffff';
      const mainText = '#000000';
      const subText = '#333333';
      const text = '#999999';

      if (polar2) {
        const existingInstance = echarts.getInstanceByDom(polar2);
        if (existingInstance) {
          existingInstance.dispose();
        }
        const windRoseChart1 = echarts.init(polar2);

        const directionLabels = [
          'N',
          'NNE',
          'NE',
          'ENE',
          'E',
          'ESE',
          'SE',
          'SSE',
          'S',
          'SSW',
          'SW',
          'WSW',
          'W',
          'WNW',
          'NW',
          'NNW',
        ];
        const speedCategories = [
          '<0.5 m/s',
          '0.5-2 m/s',
          '2-4 m/s',
          '4-6 m/s',
          '6-8 m/s',
          '>8 m/s',
        ] as const;

        const speedColors = [
          '#440154', // dark purple
          '#3b528b', // blue
          '#21918c', // teal-green
          '#5ec962', // light green
          '#fde725', // bright yellow
          '#ffffe0', // lightest yellowish
        ];

        // Blue to red gradient

        // Type for speed categories
        type SpeedCategory = (typeof speedCategories)[number];

        // Type for direction bins with each speed category as a key
        type DirectionBin = Record<SpeedCategory, number>;

        // Function to bin speeds
        function categorizeSpeed(speed: number): SpeedCategory {
          if (speed < 0.5) return '<0.5 m/s';
          if (speed < 2) return '0.5-2 m/s';
          if (speed < 4) return '2-4 m/s';
          if (speed < 6) return '4-6 m/s';
          if (speed < 8) return '6-8 m/s';
          return '>8 m/s';
        }

        // Initialize bins
        const dataBins: DirectionBin[] = directionLabels.map(() => ({
          '<0.5 m/s': 0,
          '0.5-2 m/s': 0,
          '2-4 m/s': 0,
          '4-6 m/s': 0,
          '6-8 m/s': 0,
          '>8 m/s': 0,
        }));

        // Map directions to labels and fill dataBins with counts
        sampleDataPolar.forEach(({ speed, direction }) => {
          const directionIndex = Math.round(direction / 22.5) % 16;
          const speedCategory = categorizeSpeed(speed);
          dataBins[directionIndex][speedCategory] += 1;
        });

        // Extract data for each speed category to use in series
        const seriesData = speedCategories.map((speedCategory, index) => ({
          name: speedCategory,
          type: 'bar',
          stack: 'wind-speed',
          coordinateSystem: 'polar',
          data: dataBins.map((bin) => bin[speedCategory]),
          itemStyle: {
            color: speedColors[index], // Assign color based on speed range
          },
        }));

        // Set up the chart options
        const option = {
          title: {
            text: 'Polar Binned', // Changed from 'Surface' to 'Low'
            // left: '1%',
            top: '18%',
            textStyle: {
              color: mainText,
              fontSize: 20,
            },
          },
          polar: {},
          angleAxis: {
            type: 'category',
            data: directionLabels,
            boundaryGap: true,
            startAngle: 100,
            axisLabel: {
              color: subText, // White axis labels
            },
            splitArea: {
              show: true,
              areaStyle: {
                color: ['rgba(255, 255, 255, 0.1)', 'rgba(200, 200, 200, 0.1)'],
              },
              axisLine: {
                lineStyle: {
                  color: subText,
                },
              },
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#cccccc',
                width: 1,
                type: 'dashed',
              },
            },
          },
          radiusAxis: {
            min: 0,
            axisLine: {
              lineStyle: {
                color: subText, // White radius axis line
              },
            },
            axisLabel: {
              color: subText,
              formatter: '{value}',
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: text,
                type: 'dashed',
              },
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a}: {c}',
          },
          //   toolbox: {
          //     bottom: 0,
          //     left: 0,
          //     feature: {
          //         dataZoom: {
          //             yAxisIndex: 'none'
          //         },
          //         restore: {},
          //          saveAsImage: {
          //       backgroundColor: bgColor,
          //       pixelRatio: 2,
          //     }
          //     },
          //     iconStyle: {
          //         borderColor: mainText
          //     }
          // },

          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100,
            },
          ],
          series: seriesData,
          animationDuration: 1000,
        };

        // Render the chart and handle resizing
        windRoseChart1.setOption(option);

        //console.table(dataBins);

        // this.loading = false;
        window.addEventListener('resize', () => windRoseChart1.resize());
      } else {
        console.error("Element with id 'rose-plot' not found");
        // this.loading = false;
      }
    }, 0);
  }
}
