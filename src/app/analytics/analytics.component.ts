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
import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from '../base/base.component';
import { CascadeSelectModule } from 'primeng/cascadeselect';

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

  plot:any;
  viewModes:any;  

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
    localStorage.getItem('currentDirectionColor') ?? '#000000';

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

  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private base:BaseComponent
  ) {}
  ngOnInit(): void {
    // Load saved data type preference
    const savedDataType = localStorage.getItem('isProcessedData');
    if (savedDataType !== null) {
      this.isProcessedData = savedDataType === 'true';
    }

    this.files_list = [];
    this.http
      .get('http://localhost:3000/api/files')
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
                code: 'A-SY'
              },
              {
                cname: 'Dual Axis',
                code: 'A-BR'
              },
              {
                cname: 'Tri Axis',
                code: 'A-TO'
              }
          ]
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

  }
show:boolean=false;
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
  toggleFileSelection(file_id: number) {
    this.isMulti = false;
    this.selectedFiles = [
      {
        file_id: file_id,
      },
    ];
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
    this.loading = true;

    this.fullData = [];
    this.main_table = [];
    this.cleanupCharts();

    // Reset chart instances
    this.tideChartInstance = undefined;
    this.midChartInstance = undefined;

    this.http
      .get(
        `http://localhost:3000/api/${
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

    // Find all newly added rows using the isNewRow flag
    const newRows = this.main_table.filter((row) => row.isNewRow);
    const changedRows = this.main_table.filter(
      (row) => this.changedRows.has(row.id) && !row.isNewRow
    );

    // Create the payload
    let promises: Promise<any>[] = [];

    // Handle new rows
    if (newRows.length > 0) {
      const newRowsPromises = newRows.map(newRow => {
        // Parse the date string to get hours and minutes
        const date = new Date(newRow.date);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        const newRowPayload = {
          id: newRow.id,
          file_id: newRow.file_id,
          timestamp: newRow.date,
          speed: parseFloat(newRow.speed),
          direction: parseFloat(newRow.direction),
          tide: parseFloat(newRow.pressure),
          time: timeString,
        };

        return this.http
          .post('http://localhost:3000/api/addNewRow', newRowPayload)
          .toPromise();
      });
      promises.push(...newRowsPromises);
    }

    // Handle updated rows
    if (changedRows.length > 0) {
      const updatePayload = changedRows.map((row) => ({
        id: row.id,
        file_id: row.file_id,
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

      const newRow = {
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

    this.fillDataGaps();

    setTimeout(() => {
      if (this.selectedPointId !== null) {
        // Find the index of the selected item
        const selectedIndex = this.main_table.findIndex(
          (item) => item.id === this.selectedPointId
        );

        if (selectedIndex !== -1) {
          // Calculate the virtual scroll position
          const rowHeight = 46; // This should match virtualScrollItemSize
          const tableWrapper = this.tableWrapper?.nativeElement;

          if (tableWrapper) {
            const wrapperHeight = tableWrapper.clientHeight;
            const scrollPosition = Math.max(
              0,
              selectedIndex * rowHeight - wrapperHeight / 2 + rowHeight / 2
            );

            // First scroll to the approximate position
            tableWrapper.scrollTop = scrollPosition;

            // Then try to find and center the exact row after a short delay
            setTimeout(() => {
              const selectedRow = tableWrapper.querySelector(
                `tr[data-id="${this.selectedPointId}"]`
              );

              if (selectedRow) {
                const rowTop = selectedRow.offsetTop;
                const fineScrollPosition = Math.max(
                  0,
                  rowTop - wrapperHeight / 2 + rowHeight / 2
                );

                tableWrapper.scrollTo({
                  top: fineScrollPosition,
                  behavior: 'smooth',
                });

                // Add a highlight effect
                selectedRow.style.transition = 'background-color 0.3s ease';
                selectedRow.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
                setTimeout(() => {
                  selectedRow.style.backgroundColor = '';
                }, 1500);
              }
            }, 100);
          }
        }
      }

      // Resize charts
      this.chartInstances.forEach((chart) => {
        if (!chart.isDisposed()) {
          chart.resize();
        }
      });
    }, 100); // Reduced initial timeout
  }

  private fillDataGaps() {
    if (this.main_table.length < 2) return;

    // Sort the table by date first
    this.main_table.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const newRows: ApiData[] = [];
    let maxId = Math.max(...this.main_table.map((row) => row.id));

    // Check each consecutive pair of rows
    for (let i = 0; i < this.main_table.length - 1; i++) {
      const currentRow = this.main_table[i];
      const nextRow = this.main_table[i + 1];

      const currentDate = new Date(currentRow.date);
      const nextDate = new Date(nextRow.date);
      const timeDiff = nextDate.getTime() - currentDate.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff > 10) {
        // Calculate how many 10-minute intervals we need to fill
        const intervalsToFill = Math.floor(minutesDiff / 10) - 1;

        for (let j = 0; j < intervalsToFill; j++) {
          // Calculate the new timestamp
          const newDate = new Date(
            currentDate.getTime() + (j + 1) * 10 * 60 * 1000
          );
          const formattedDate = newDate.toISOString();

          maxId++;
          const newRow: ApiData = {
            id: maxId,
            date: formattedDate,
            speed: '',
            direction: '',
            pressure: '',
            file_id: currentRow.file_id,
            file_name: currentRow.file_name,
            battery: '',
            dept: '',
            high_water_level: 0,
            lat: '',
            lon: '',
            station_id: '',
            time: formattedDate.split('T')[1].split('.')[0],
            isNewRow: true,
          };

          newRows.push(newRow);
        }
      }
    }

    // Add all new rows to main_table
    if (newRows.length > 0) {
      this.main_table = [...this.main_table, ...newRows];
      // Sort again after adding new rows
      this.main_table.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      this.fullData = [...this.main_table];

      // Notify user about added rows
      this.toast.info(`Added ${newRows.length} rows to fill time gaps`);
    }
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

    // Load saved color from localStorage or use default
    const savedColor = localStorage.getItem('tideChartColor');
    if (savedColor) {
      this.tideChartColor = savedColor;
    }

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
            color: localStorage.getItem('theme') === 'light' ? 'black' : 'white',
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
              color: this.base.chartFont === 'light' ? 'black' : 'white',
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              backgroundColor: this.base.chartFont === 'light' ? 'black' : 'white',
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: this.base.chartFont === 'light' ? 'black' : 'white',
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
            name: 'High Water Time',
            data: this.fullData
              .filter((item) => item.high_water_level === 1)
              .map((item) => [item.date, parseFloat(item.pressure)]),
            type: 'scatter',
            symbolSize: 15,
            itemStyle: {
              color: '#ff0000',
              borderColor: this.base.chartFont === 'light' ? 'black' : 'white',
              borderWidth: 2,
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
            showSymbol: false,
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
    const speed = document.getElementById('currentSpeed');

    const savedColor = localStorage.getItem('currentSpeedColor');
    if (savedColor) {
      this.currentSpeedColor = savedColor;
    }

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
            color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              color: this.base.chartFont === 'light' ? 'black' : 'white',
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: this.base.chartFont === 'light' ? 'black' : 'white',
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
            axisLabel: { color: this.base.chartFont === 'light' ? 'black' : 'white' },
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
              backgroundColor: this.base.chartFont === 'light' ? 'black' : 'white',
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: this.base.chartFont === 'light' ? 'black' : 'white',
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

    const savedColor = localStorage.getItem('currentDirectionColor');
    if (savedColor) {
      this.currentDirectionColor = savedColor;
    }

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
            color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              color: this.base.chartFont === 'light' ? 'black' : 'white',
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: this.base.chartFont === 'light' ? 'black' : 'white',
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
            axisLabel: { color: this.base.chartFont === 'light' ? 'black' : 'white' },
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
              backgroundColor: this.base.chartFont === 'light' ? 'black' : 'white',
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: this.base.chartFont === 'light' ? 'black' : 'white',
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

    // const bgColor = '#ffffff';
    // const mainText = '#000000';
    // const subText = '#666666';

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
            color: this.base.chartFont === 'light' ? 'black' : 'white',
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
            color: this.base.chartFont === 'light' ? 'black' : 'white',
            padding: [44, 0, 0, 0],
            fontSize: 14,
            fontWeight: 'bold',
          },
          axisLabel: {
            color: this.base.chartFont === 'light' ? 'black' : 'white',
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
            axisLabel: { color: this.base.chartFont === 'light' ? 'black' : 'white' },
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
            axisLabel: { color: this.base.chartFont === 'light' ? 'black' : 'white' },
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
              backgroundColor: this.base.chartFont === 'light' ? 'black' : 'white',
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: this.base.chartFont === 'light' ? 'black' : 'white',
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
            color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              color: this.base.chartFont === 'light' ? 'black' : 'white',
              padding: [44, 0, 0, 0],
              fontSize: 14,
              fontWeight: 'bold',
            },
            axisLabel: {
              color: this.base.chartFont === 'light' ? 'black' : 'white',
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
            name: 'Water Level (m)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: this.tideChartColor,
              padding: [0, 0, 15, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              color: this.base.chartFont === 'light' ? 'black' : 'white',
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
            color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              backgroundColor: this.base.chartFont === 'light' ? 'black' : 'white',
              pixelRatio: 2,
            },
          },
          iconStyle: {
            borderColor: this.base.chartFont === 'light' ? 'black' : 'white',
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
    if (
      !this.selectedPolarDateRange ||
      this.selectedPolarDateRange.length !== 2
    ) {
      this.toast.warning('Please select a date range');
      return;
    }
 
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
    const element = document.getElementById(elementId);
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
 
    const speedCategories = [
      '<0.5 m/s',
      '0.5-2 m/s',
      '2-4 m/s',
      '4-6 m/s',
      '6-8 m/s',
      '>8 m/s',
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
      if (speed < 0.5) return '<0.5 m/s';
      if (speed < 2) return '0.5-2 m/s';
      if (speed < 4) return '2-4 m/s';
      if (speed < 6) return '4-6 m/s';
      if (speed < 8) return '6-8 m/s';
      return '>8 m/s';
    };
 
    const dataBins: DirectionBin[] = directionLabels.map(() => ({
      '<0.5 m/s': 0,
      '0.5-2 m/s': 0,
      '2-4 m/s': 0,
      '4-6 m/s': 0,
      '6-8 m/s': 0,
      '>8 m/s': 0,
    }));
 
    averagedPolarData.forEach(({ speed, direction }) => {
      // const directionIndex = Math.round(direction / 22.5) % 16;
 
      const directionIndex = Math.round(direction / 45) % 8;
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
      title: {
        // text: this.PolarSelectedInterVal,
        text: this.PolarSelectedInterVal !== 'all' ? `${interval} min` : '',
        top: '0%',
        left: 'center',
        textStyle: {
          color: this.base.chartFont === 'light' ? 'black' : 'white',
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
              right: '0%',
              textStyle: {
                color: this.base.chartFont === 'light' ? 'black' : 'white',
                fontSize: 12,
              },
            }
          : {
              show: true,
              data: speedCategories,
              orient: 'vertical',
              right: '0%',
              textStyle: {
                color: this.base.chartFont === 'light' ? 'black' : 'white',
                fontSize: 12,
              },
            },
 
      angleAxis: {
        type: 'category',
        data: directionLabels,
        boundaryGap: true,
        startAngle: 100,
        axisLabel: {
          color: this.base.chartFont === 'light' ? 'black' : 'white',
        },
      },
      radiusAxis: {
        min: 0,
        axisLabel: {
          color: this.base.chartFont === 'light' ? 'black' : 'white',
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
