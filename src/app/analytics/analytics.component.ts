import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostBinding,
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
  @ViewChild('tableWrapper') tableWrapper!: ElementRef;
  @ViewChild('tideChart') tideChart!: ElementRef;
  @ViewChild('midChart') midChart!: ElementRef;
  @HostBinding('class.modal-open') get isModalOpen() {
    return this.visible;
  }

  loading: boolean = false;
  chartOption: any;
  selectedChart: string = 'line';
  isCompareView: boolean = false;

  visible: boolean = false;
  selectedPointId: number | null = null;
  private tideChartInstance!: EChartsType;
  private midChartInstance!: EChartsType;

  sampleDataAdcp = [
    {
      id: 1,
      timestamp: '2024-10-01T00:00:00Z',
      current_speed: 1.2,
      current_direction: 30,
      tide: 0.71,
    },
    {
      id: 2,
      timestamp: '2024-10-01T01:00:00Z',
      current_speed: 1.5,
      current_direction: 45,
      tide: 1.06,
    },
    {
      id: 3,
      timestamp: '2024-10-01T02:00:00Z',
      current_speed: 0.8,
      current_direction: 60,
      tide: 1.44,
    },
    {
      id: 4,
      timestamp: '2024-10-01T03:00:00Z',
      current_speed: 2.1,
      current_direction: 90,
      tide: 0.79,
    },
    {
      id: 5,
      timestamp: '2024-10-01T04:00:00Z',
      current_speed: 1.9,
      current_direction: 120,
      tide: 0.9,
    },
    {
      id: 6,
      timestamp: '2024-10-01T05:00:00Z',
      current_speed: 1.6,
      current_direction: 150,
      tide: 1.66,
    },
    {
      id: 7,
      timestamp: '2024-10-01T06:00:00Z',
      current_speed: 0.5,
      current_direction: 180,
      tide: 0.5,
    },
    {
      id: 8,
      timestamp: '2024-10-01T07:00:00Z',
      current_speed: 1.3,
      current_direction: 210,
      tide: 0.79,
    },
    {
      id: 9,
      timestamp: '2024-10-01T08:00:00Z',
      current_speed: 1.4,
      current_direction: 240,
      tide: 0.86,
    },
    {
      id: 10,
      timestamp: '2024-10-01T09:00:00Z',
      current_speed: 0.9,
      current_direction: 270,
      tide: 1.13,
    },
    {
      id: 11,
      timestamp: '2024-10-01T10:00:00Z',
      current_speed: 1.1,
      current_direction: 300,
      tide: 1.02,
    },
    {
      id: 12,
      timestamp: '2024-10-01T11:00:00Z',
      current_speed: 1.0,
      current_direction: 330,
      tide: 0.94,
    },
    {
      id: 13,
      timestamp: '2024-10-01T12:00:00Z',
      current_speed: 1.4,
      current_direction: 360,
      tide: 0.86,
    },
    {
      id: 14,
      timestamp: '2024-10-01T13:00:00Z',
      current_speed: 2.0,
      current_direction: 15,
      tide: 1.29,
    },
    {
      id: 15,
      timestamp: '2024-10-01T14:00:00Z',
      current_speed: 1.7,
      current_direction: 30,
      tide: 0.91,
    },
    {
      id: 16,
      timestamp: '2024-10-01T15:00:00Z',
      current_speed: 1.8,
      current_direction: 45,
      tide: 0.72,
    },
    {
      id: 17,
      timestamp: '2024-10-01T16:00:00Z',
      current_speed: 1.2,
      current_direction: 60,
      tide: 1.29,
    },
    {
      id: 18,
      timestamp: '2024-10-01T17:00:00Z',
      current_speed: 0.7,
      current_direction: 90,
      tide: 1.61,
    },
    {
      id: 19,
      timestamp: '2024-10-01T18:00:00Z',
      current_speed: 1.4,
      current_direction: 120,
      tide: 0.79,
    },
    {
      id: 20,
      timestamp: '2024-10-01T19:00:00Z',
      current_speed: 1.6,
      current_direction: 150,
      tide: 1.05,
    },
  ];

  ngOnInit(): void {
    // this.Tide();
    // this.midSpeedDirection();
    // this.currentSpeed();
    // this.currentDirection();
    // this.loadChart();
    // this.onDialogShow();
  }

  ngAfterViewInit(): void {
    this.loadChart();
  }

  loadChart() {
    setTimeout(() => {
      if (this.isCompareView) {
        this.midSpeedDirection();
      } else {
        this.Tide();
        this.currentSpeed();
        this.currentDirection();
      }
    }, 100);
  }

  onDialogShow() {
    console.log('Dialog shown');
    setTimeout(() => {
      const selectedRow = document.querySelector('.selected-row');
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      this.updateChartWidths(70);
    }, 100);
  }

  onDialogHide() {
    this.updateChartWidths(100);
  }

  private updateChartWidths(width: number) {
    const charts = document.querySelectorAll('.compare-diagram');
    charts.forEach((chart) => {
      (chart as HTMLElement).style.width = `${width}%`;
    });

    // Resize charts after width change
    if (this.tideChartInstance) {
      this.tideChartInstance.resize();
    }
    if (this.midChartInstance) {
      this.midChartInstance.resize();
    }
  }

  Tide(): void {
    const tide = document.getElementById('tide');

    // const computedStyle = getComputedStyle(document.body);
    // const bgColor = computedStyle
    //   .getPropertyValue('--secbackground-color')
    //   .trim();
    // const mainText = computedStyle.getPropertyValue('--chart-maintext').trim();
    // const subText = computedStyle.getPropertyValue('--main-text').trim();

    const bgColor = '#ffffff'; // White background for image export
    const mainText = '#000000'; // Black for titles/labels
    const subText = '#666666'; // Grey for axis labels and legend

    const sampleData = [
      ['2000-06-05', 116],
      ['2000-06-06', 129],
      ['2000-06-07', 135],
      ['2000-06-08', 86],
      ['2000-06-09', 73],
      ['2000-06-10', 85],
      ['2000-06-11', 73],
      ['2000-06-12', 68],
      ['2000-06-13', 92],
      ['2000-06-14', 130],
      ['2000-06-15', 245],
      ['2000-06-16', 139],
      ['2000-06-17', 115],
      ['2000-06-18', 111],
      ['2000-06-19', 309],
      ['2000-06-20', 206],
      ['2000-06-21', 137],
      ['2000-06-22', 128],
      ['2000-06-23', 85],
      ['2000-06-24', 94],
      ['2000-06-25', 71],
      ['2000-06-26', 106],
      ['2000-06-27', 84],
      ['2000-06-28', 93],
      ['2000-06-29', 85],
      ['2000-06-30', 73],
      ['2000-07-01', 83],
      ['2000-07-02', 125],
      ['2000-07-03', 107],
      ['2000-07-04', 82],
      ['2000-07-05', 44],
      ['2000-07-06', 72],
      ['2000-07-07', 106],
      ['2000-07-08', 107],
      ['2000-07-09', 66],
      ['2000-07-10', 91],
      ['2000-07-11', 92],
      ['2000-07-12', 113],
      ['2000-07-13', 107],
      ['2000-07-14', 131],
      ['2000-07-15', 111],
      ['2000-07-16', 64],
      ['2000-07-17', 69],
      ['2000-07-18', 88],
      ['2000-07-19', 77],
      ['2000-07-20', 83],
      ['2000-07-21', 111],
      ['2000-07-22', 57],
      ['2000-07-23', 55],
      ['2000-07-24', 60],
      ['2000-07-25', 44],
      ['2000-07-26', 127],
      ['2000-07-27', 114],
      ['2000-07-28', 86],
      ['2000-07-29', 73],
      ['2000-07-30', 52],
      ['2000-07-31', 69],
      ['2000-08-01', 86],
      ['2000-08-02', 118],
      ['2000-08-03', 56],
      ['2000-08-04', 91],
      ['2000-08-05', 121],
      ['2000-08-06', 127],
      ['2000-08-07', 78],
      ['2000-08-08', 79],
      ['2000-08-09', 46],
      ['2000-08-10', 108],
      ['2000-08-11', 80],
      ['2000-08-12', 79],
      ['2000-08-13', 69],
      ['2000-08-14', 80],
      ['2000-08-15', 105],
      ['2000-08-16', 119],
      ['2000-08-17', 105],
      ['2000-08-18', 55],
      ['2000-08-19', 74],
      ['2000-08-20', 41],
      ['2000-08-21', 62],
      ['2000-08-22', 104],
      ['2000-08-23', 118],
      ['2000-08-24', 121],
      ['2000-08-25', 126],
      ['2000-08-26', 99],
      ['2000-08-27', 92],
      ['2000-08-28', 75],
      ['2000-08-29', 91],
      ['2000-08-30', 94],
      ['2000-08-31', 69],
      ['2000-09-01', 93],
      ['2000-09-02', 124],
      ['2000-09-03', 120],
      ['2000-09-04', 93],
      ['2000-09-05', 26],
      ['2000-09-06', 32],
    ];

    if (tide) {
      const existingInstance = echarts.getInstanceByDom(tide);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const tideLevel = echarts.init(tide);

      const option = {
        title: {
          text: '🌊 Tide',
          left: '1%',
          textStyle: {
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: {
          trigger: 'axis',
        },
        grid: {
          left: '7%',
          // bottom: '30%',
          right: '5%',
        },
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
            name: 'Water Level (m/s)',
            nameLocation: 'middle',
            nameTextStyle: {
              color: '#1f77b4',
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
          // type: 'scroll',
          orient: 'vertical', // Orient the legend vertically
          right: '15%',
          top: '2%',
          // top: 'middle',
          textStyle: {
            color: '#1f77b4', // Set legend text color to white
            fontSize: 14,
          },
        },

        toolbox: {
          // right: 10,
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
            start: 0, // You can adjust to define how much of the chart is visible initially
            end: 100, // Set the percentage of the range initially visible
          },
          {
            type: 'inside',
            start: 0,
            end: 100, // Can be modified based on your dataset's initial view preference
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],

        series: [
          {
            name: 'Water Level',
            data: sampleData.map(([date, value]) => ({
              value: [date, value],
            })),
            // data: this.sampleDataTide.map(item => [item.date, item.level]),
            //  data: sampleData.map(item => [item[0], item[1]]),
            type: 'line',
            smooth: 'line',
            // lineStyle: 'line',
            // barWidth: 'line',

            itemStyle: {
              color: '#1f77b4',
            },
            showSymbol: false,
            label: {
              show: true,
              fontSize: 12, // Optional: Set font size for the data points (if labels are enabled)
            },
          },

          {
            // Invisible dummy series to trigger rendering of top and right axes
            type: 'line',
            xAxisIndex: 1,
            // yAxisIndex: 1,
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

      // Set options for the chart
      tideLevel.setOption(option);
      window.addEventListener('resize', () => {
        tideLevel.resize();
      });
    } else {
    }
  }

  currentSpeed(): void {
    const chartType = this.selectedChart;
    const speed = document.getElementById('currentSpeed');

    // const computedStyle = getComputedStyle(document.body);
    // const bgColor = computedStyle
    //   .getPropertyValue('--secbackground-color')
    //   .trim();
    // const mainText = computedStyle.getPropertyValue('--chart-maintext').trim();
    // const subText = computedStyle.getPropertyValue('--main-text').trim();

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
          text: '🌀 Current Speed',
          left: '1%',
          textStyle: {
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: { trigger: 'axis' },
        grid: { left: '7%', right: '5%' },
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
              color: 'red',
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
            color: 'red',
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
            start: 0, // You can adjust to define how much of the chart is visible initially
            end: 100, // Set the percentage of the range initially visible
          },
          {
            type: 'inside',
            start: 0,
            end: 100, // Can be modified based on your dataset's initial view preference
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],

        series: [
          {
            name: 'Current Speed',
            data: this.sampleDataAdcp.map((item) => [
              item.timestamp,
              item.current_speed,
            ]),
            type: chartType,
            // smooth: 'line',
            // lineStyle: { color: '#00ff00' },
            itemStyle: { color: 'red' },
            showSymbol: false,
            label: { show: true, fontSize: 12 },
            // yAxisIndex: 0,
          },
        ],
      };

      currentSpeed.setOption(option);
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

    // const computedStyle = getComputedStyle(document.body);
    // const bgColor = computedStyle
    //   .getPropertyValue('--secbackground-color')
    //   .trim();
    // const mainText = computedStyle.getPropertyValue('--chart-maintext').trim();
    // const subText = computedStyle.getPropertyValue('--main-text').trim();

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
          text: '🧭 Current Direction',
          left: '1%',
          textStyle: {
            color: mainText,
            fontSize: 20,
          },
        },
        tooltip: { trigger: 'axis' },
        grid: { left: '7%', right: '5%' },
        
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
              color: 'green',
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
            color: 'green',
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
            start: 0, // You can adjust to define how much of the chart is visible initially
            end: 100, // Set the percentage of the range initially visible
          },
          {
            type: 'inside',
            start: 0,
            end: 100, // Can be modified based on your dataset's initial view preference
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
        ],

        series: [
          {
            name: 'Current Direction',
            data: this.sampleDataAdcp.map((item) => [
              item.timestamp,
              item.current_direction,
            ]),
            type: chartType,
            // smooth: 'line',
            // lineStyle: { color: '#00ff00' },
            itemStyle: { color: 'green' },
            showSymbol: true,
            symbol:
              'path://M122.88,61.217L59.207,122.433V83.029H0V39.399H59.207V0L122.88,61.217Z',
            symbolSize: 14,
            symbolOffset: [0, -7],
            symbolRotate: (value: any) => value[1],
            label: { show: false, fontSize: 12 },
            // yAxisIndex: 0,
          },
        ],
      };

      currentDirection.setOption(option);
      this.loading = false;
      window.addEventListener('resize', () => {
        currentDirection.resize();
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
      this.midChartInstance = midspeedanddirection;  // Store the instance before setting options

      const option = {
        title: {
          text: 'Compare View (🌊 Tide, 🌀 Current Speed, 🧭 Current Direction)',
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
        grid: {
          left: '9%',
          // bottom: '30%',
          right: '5%',
        },
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
              color: '#1f77b4',
              padding: [0, 0, 10, 0],
              fontSize: 16,
            },
            axisLabel: {
              color: subText,
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: '#1f77b4', // orange
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
            data: this.sampleDataAdcp.map((item) => [
              item.timestamp,
              item.current_speed,
            ]),
            type: chartType,
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
            type: chartType,
            // lineStyle: {
            //   color: '#1f77b4',
            // },
            itemStyle: {
              color: '#1f77b4',
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
            data: this.sampleDataAdcp.map((item) => [
              item.timestamp,
              item.current_direction,
            ]),
            type: chartType,
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
}
