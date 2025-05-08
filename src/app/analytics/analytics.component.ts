import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css',
})
export class AnalyticsComponent implements OnInit {
  loading: boolean = false;
  isSpeedChecked: boolean = true;
  isCurrentChecked: boolean = true;
  chartOption: any;
  selectedChart: string = 'line';

  sampleDataAdcp = [
    {
      timestamp: '2024-10-01T00:00:00Z',
      current_speed: 1.2,
      current_direction: 30,
    },
    {
      timestamp: '2024-10-01T01:00:00Z',
      current_speed: 1.5,
      current_direction: 45,
    },
    {
      timestamp: '2024-10-01T02:00:00Z',
      current_speed: 0.8,
      current_direction: 60,
    },
    {
      timestamp: '2024-10-01T03:00:00Z',
      current_speed: 2.1,
      current_direction: 90,
    },
    {
      timestamp: '2024-10-01T04:00:00Z',
      current_speed: 1.9,
      current_direction: 120,
    },
    {
      timestamp: '2024-10-01T05:00:00Z',
      current_speed: 1.6,
      current_direction: 150,
    },
    {
      timestamp: '2024-10-01T06:00:00Z',
      current_speed: 0.5,
      current_direction: 180,
    },
    {
      timestamp: '2024-10-01T07:00:00Z',
      current_speed: 1.3,
      current_direction: 210,
    },
    {
      timestamp: '2024-10-01T08:00:00Z',
      current_speed: 1.4,
      current_direction: 240,
    },
    {
      timestamp: '2024-10-01T09:00:00Z',
      current_speed: 0.9,
      current_direction: 270,
    },
    {
      timestamp: '2024-10-01T10:00:00Z',
      current_speed: 1.1,
      current_direction: 300,
    },
    {
      timestamp: '2024-10-01T11:00:00Z',
      current_speed: 1.0,
      current_direction: 330,
    },
    {
      timestamp: '2024-10-01T12:00:00Z',
      current_speed: 1.4,
      current_direction: 360,
    },
    {
      timestamp: '2024-10-01T13:00:00Z',
      current_speed: 2.0,
      current_direction: 15,
    },
    {
      timestamp: '2024-10-01T14:00:00Z',
      current_speed: 1.7,
      current_direction: 30,
    },
    {
      timestamp: '2024-10-01T15:00:00Z',
      current_speed: 1.8,
      current_direction: 45,
    },
    {
      timestamp: '2024-10-01T16:00:00Z',
      current_speed: 1.2,
      current_direction: 60,
    },
    {
      timestamp: '2024-10-01T17:00:00Z',
      current_speed: 0.7,
      current_direction: 90,
    },
    {
      timestamp: '2024-10-01T18:00:00Z',
      current_speed: 1.4,
      current_direction: 120,
    },
    {
      timestamp: '2024-10-01T19:00:00Z',
      current_speed: 1.6,
      current_direction: 150,
    },
    {
      timestamp: '2024-10-01T20:00:00Z',
      current_speed: 0.4,
      current_direction: 180,
    },
    {
      timestamp: '2024-10-01T21:00:00Z',
      current_speed: 1.1,
      current_direction: 210,
    },
    {
      timestamp: '2024-10-01T22:00:00Z',
      current_speed: 1.5,
      current_direction: 240,
    },
    {
      timestamp: '2024-10-01T23:00:00Z',
      current_speed: 0.9,
      current_direction: 270,
    },
    {
      timestamp: '2024-10-02T00:00:00Z',
      current_speed: 1.0,
      current_direction: 300,
    },
    {
      timestamp: '2024-10-02T01:00:00Z',
      current_speed: 1.2,
      current_direction: 330,
    },
    {
      timestamp: '2024-10-02T02:00:00Z',
      current_speed: 1.5,
      current_direction: 360,
    },
    {
      timestamp: '2024-10-02T03:00:00Z',
      current_speed: 1.8,
      current_direction: 15,
    },
    {
      timestamp: '2024-10-02T04:00:00Z',
      current_speed: 1.6,
      current_direction: 30,
    },
    {
      timestamp: '2024-10-02T05:00:00Z',
      current_speed: 1.4,
      current_direction: 45,
    },
    {
      timestamp: '2024-10-02T06:00:00Z',
      current_speed: 0.9,
      current_direction: 60,
    },
    {
      timestamp: '2024-10-02T07:00:00Z',
      current_speed: 1.1,
      current_direction: 90,
    },
    {
      timestamp: '2024-10-02T08:00:00Z',
      current_speed: 1.3,
      current_direction: 120,
    },
    {
      timestamp: '2024-10-02T09:00:00Z',
      current_speed: 1.2,
      current_direction: 150,
    },
    {
      timestamp: '2024-10-02T10:00:00Z',
      current_speed: 1.5,
      current_direction: 180,
    },
    {
      timestamp: '2024-10-02T11:00:00Z',
      current_speed: 1.7,
      current_direction: 210,
    },
    {
      timestamp: '2024-10-02T12:00:00Z',
      current_speed: 1.4,
      current_direction: 240,
    },
    {
      timestamp: '2024-10-02T13:00:00Z',
      current_speed: 1.8,
      current_direction: 270,
    },
    {
      timestamp: '2024-10-02T14:00:00Z',
      current_speed: 1.0,
      current_direction: 300,
    },
    {
      timestamp: '2024-10-02T15:00:00Z',
      current_speed: 1.2,
      current_direction: 330,
    },
    {
      timestamp: '2024-10-02T16:00:00Z',
      current_speed: 1.5,
      current_direction: 360,
    },
    {
      timestamp: '2024-10-02T17:00:00Z',
      current_speed: 1.3,
      current_direction: 15,
    },
    {
      timestamp: '2024-10-02T18:00:00Z',
      current_speed: 0.6,
      current_direction: 30,
    },
    {
      timestamp: '2024-10-02T19:00:00Z',
      current_speed: 1.2,
      current_direction: 45,
    },
    {
      timestamp: '2024-10-02T20:00:00Z',
      current_speed: 1.1,
      current_direction: 60,
    },
    {
      timestamp: '2024-10-02T21:00:00Z',
      current_speed: 0.8,
      current_direction: 90,
    },
    {
      timestamp: '2024-10-02T22:00:00Z',
      current_speed: 1.4,
      current_direction: 120,
    },
    {
      timestamp: '2024-10-02T23:00:00Z',
      current_speed: 1.6,
      current_direction: 150,
    },
  ];

  ngOnInit(): void {
    this.Tide();
    this.midSpeedDirection();
  }

  Tide(): void {
    // const chartType = this.selectedChart;
    // this.loading = true;
    const tide = document.getElementById('tide');

    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle
      .getPropertyValue('--secbackground-color')
      .trim();
    const mainText = computedStyle.getPropertyValue('--chart-maintext').trim();
    const subText = computedStyle.getPropertyValue('--main-text').trim();

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
          text: 'Tide',
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
          // top: '50%',
          left: '7%',
          // right: '10%',
          bottom: '30%',
          // containLabel: true
        },
        xAxis: {
          type: 'time',
          name: 'Date', // X-axis legend (title)
          nameLocation: 'middle',
          nameTextStyle: {
            color: mainText,
            padding: [35, 0, 0, 0],
            fontSize: 16,
          },
          // data: dates,
          axisLabel: {
            color: subText, // Set x-axis label color to white
            rotate: 45,
          },
          axisLine: {
            show: true,
          },
          splitLine: {
            show: false, // Hide x-axis grid lines
          },
        },

        yAxis: {
          name: `Water Level (m/s)`, // Y-axis legend (title)
          nameLocation: 'middle',
          nameTextStyle: {
            color: mainText,
            padding: [0, 0, 30, 0],
            fontSize: 16,
          },
          // type: 'value'
          axisLabel: {
            color: subText, // Set y-axis label color to white
          },
          axisLine: {
            show: true,
          },
          splitLine: {
            show: true, // Hide x-axis grid lines
            lineStyle: {
              color: subText,
              type: 'dashed',
            },
          },
        },

        legend: {
          // type: 'scroll',
          orient: 'vertical', // Orient the legend vertically
          right: '15%',
          top: '2%',
          // top: 'middle',
          textStyle: {
            color: subText, // Set legend text color to white
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
            // bottom: 15,
            height: 20,
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
            lineStyle: 'line',
            barWidth: 'line',

            itemStyle: {
              color: '#1ee1ff',
            },
            showSymbol: false,
            label: {
              show: false,
              fontSize: 12, // Optional: Set font size for the data points (if labels are enabled)
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

  midSpeedDirection(): void {
    const chartType = this.selectedChart;
    //       this.loading = true;
    const mid = document.getElementById('midSpeedDirection');

    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle
      .getPropertyValue('--secbackground-color')
      .trim();
    const mainText = computedStyle.getPropertyValue('--chart-maintext').trim();
    const subText = computedStyle.getPropertyValue('--main-text').trim();

    // if(this.selectedStation.toLowerCase() == "cwprs01"){
    //   for(let i in this.cwprs01 ){
    //     const [speedStr, directionStr] = this.cwprs01[i].Middle_CurrentSpeedDirection.split(';');

    //     // Convert the string parts to numbers
    //     const speed = parseFloat(speedStr);
    //     const direction = parseFloat(directionStr);
    //     this.sampleData2.push(
    //      {time: this.cwprs01[i].Date,       // Assuming 'Date' holds the time value
    //       speed: speed,     // Assuming 'speed' is available in 'cwprs01'
    //       direction: direction}
    //     );
    //   }
    // }else if(this.selectedStation.toLowerCase() == "cwprs02"){
    //   for(let i in this.cwprs02 ){
    //     const [speedStr, directionStr] = this.cwprs02[i].Middle_CurrentSpeedDirection.split(';');

    //     // Convert the string parts to numbers
    //     const speed = parseFloat(speedStr);
    //     const direction = parseFloat(directionStr);
    //     this.sampleData2.push(
    //      {time: this.cwprs02[i].Date,       // Assuming 'Date' holds the time value
    //       speed: speed,     // Assuming 'speed' is available in 'cwprs01'
    //       direction: direction}
    //     );
    //   }
    // }

    // const midCurrent = this.updateInit(this.midbin, false);
    // = this.selectedStation === 'cwprs01' ? this.cwprs01.map(item => item.Middle_CurrentSpeedDirection) :
    // this.selectedStation === 'cwprs02' ? this.cwprs02.map(item => item.Middle_CurrentSpeedDirection) : []

    // const dates =  this.selectedStation === 'cwprs01' ? this.cwprs01.map(item =>`${item.Date?.split('T')[0]} ${item.Time?.split('T')[1]?.split('.')[0]}`) :
    // this.selectedStation === 'cwprs02' ? this.cwprs02.map(item =>`${item.Date?.split('T')[0]} ${item.Time?.split('T')[1]?.split('.')[0]}`) : []
    // const dates = this.cwprs01.map(item =>`${item.Date?.split('T')[0]}`);

    if (mid) {
      const existingInstance = echarts.getInstanceByDom(mid);
      if (existingInstance) {
        existingInstance.dispose();
      }
      const midspeedanddirection = echarts.init(mid);

      // Prepare chart options
      const option = {
        title: {
          text: 'Mid', // Changed title to 'Mid'
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
          // right: '10%',
          bottom: '22%',
        },
        xAxis: {
          type: 'time', // Set x-axis type to time
          name: 'Time',
          nameLocation: 'middle',
          nameTextStyle: {
            color: mainText,
            padding: [15, 0, 0, 0],
            fontSize: 16,
          },
          axisLabel: {
            color: subText, // Set x-axis label color to white
          },
          axisLine: {
            show: true,
          },
          splitLine: {
            show: false, // Hide x-axis grid lines
          },
        },

        yAxis: [
          ...(this.isSpeedChecked
            ? [
                {
                  type: 'value',
                  name: `Current speed (m/s)`, // Left Y-axis title
                  nameLocation: 'middle',
                  nameTextStyle: {
                    color: mainText,
                    padding: [0, 0, 30, 0], // Adjust spacing
                    fontSize: 16,
                    // margin: 20
                  },
                  axisLabel: {
                    color: subText, // Set y-axis label color to white
                  },
                  axisLine: {
                    show: true,
                    lineStyle: {
                      color: '#00ff00', // Updated color to green
                    },
                  },
                  splitLine: {
                    show: true, // Show grid lines
                    lineStyle: {
                      type: 'solid', // Solid gridlines for yAxis 0 (left axis)
                      color: '#00ff00', // Updated to green
                    },
                  },
                },
              ]
            : []),

          ...(this.isCurrentChecked
            ? [
                {
                  type: 'value',
                  name: 'Current Direction (°)',
                  nameLocation: 'middle',
                  nameTextStyle: {
                    color: mainText,
                    padding: 25, // Adjust spacing
                    fontSize: 16,
                  },
                  axisLabel: {
                    color: subText, // Set y-axis label color to white
                  },
                  axisLine: {
                    show: true,
                    lineStyle: {
                      color: '#0000ff', // Updated color to blue
                    },
                  },
                  splitLine: {
                    show: true, // Show grid lines
                    lineStyle: {
                      type: 'dashed', // Dashed gridlines for yAxis 1 (right axis)
                      color: '#0000ff', // Updated to blue
                    },
                  },
                  position:
                    this.isSpeedChecked && this.isCurrentChecked ? 'right' : '', // Position the axis on the right
                  min: 0, // Set minimum value
                  max: 360, // Set maximum value
                  interval: 90, // Set interval between tick marks
                },
              ]
            : []),
        ],

        legend: {
          data: [
            ...(this.isSpeedChecked ? ['Current Speed'] : []),
            ...(this.isCurrentChecked ? ['Current Direction'] : []),
          ], // Make sure this matches series names
          orient: 'vertical',
          right: '15%',
          textStyle: {
            color: subText,
            fontSize: 14,
          },
        },

        toolbox: {
          // right: 10,s
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

        // dataZoom: [
        //     {
        //         type: 'slider',
        //         start: 0,
        //         end: 100
        //     },
        //     {
        //         type: 'inside'
        //     }
        // ],

        dataZoom: [
          {
            type: 'inside', // Enable interactive zooming
            xAxisIndex: 0, // Apply zooming to the x-axis (time axis)
            filterMode: 'filter', // Filter out of view data
            start: 0, // Start position for zooming (0%)
            end: 100, // End position for zooming (100%)
          },
          {
            type: 'slider', // Enable zooming via a slider below the x-axis
            height: 20,
            xAxisIndex: 0, // Apply slider to the x-axis
            filterMode: 'filter',
            start: 0, // Start position for zooming
            end: 100, // End position for zooming
          },
          {
            type: 'inside', // Enable vertical zooming for y-axis 0 (speed)
            yAxisIndex: 0, // Bind zoom to the left y-axis (speed)
            filterMode: 'filter',
            start: 0,
            end: 100,
          },
          ...(this.isSpeedChecked && this.isCurrentChecked
            ? [
                {
                  type: 'inside', // Enable vertical zooming for y-axis 1 (direction)
                  yAxisIndex: 1, // Bind zoom to the right y-axis (direction)
                  filterMode: 'filter',
                  start: 0,
                  end: 100,
                },
              ]
            : []),
        ],

        series: [
          ...(this.isSpeedChecked
            ? [
                {
                  name: 'Current Speed',
                  // data: this.sampleData2.map(item => [item.time, item.speed]),
                  data: this.sampleDataAdcp.map((item) => [
                    item.timestamp,
                    item.current_speed,
                  ]),
                  // data: dates.map((date, index) => ({
                  //   value: [date, midCurrent[index]?.split(';')[0]],
                  // })),
                  type: chartType,
                  lineStyle: {
                    normal: {
                      color: '#00ff00', // Updated line color to green
                    },
                  },
                  itemStyle: {
                    color: '#00ff00', // Updated item color to green
                  },
                  showSymbol: false,
                  label: {
                    show: false,
                    fontSize: 12,
                  },
                  yAxisIndex: 0, // Bind to left y-axis
                },
              ]
            : []),

          ...(this.isCurrentChecked
            ? [
                {
                  name: 'Current Direction',
                  // data: this.sampleData.map(item => [item.time, item.direction]),
                  data: this.sampleDataAdcp.map((item) => [
                    item.timestamp,
                    item.current_direction,
                  ]),
                  // data: dates.map((date, index) => ({
                  //   value: [date, midCurrent[index]?.split(';')[1]],
                  // })),
                  type: chartType,
                  lineStyle: {
                    normal: {
                      color: '#0000ff', // Updated line color to blue
                      type: 'dashed',
                    },
                  },
                  itemStyle: {
                    color: '#0000ff', // Updated item color to blue
                  },
                  showSymbol: true,
                  label: {
                    show: false,
                    fontSize: 12,
                  },
                  yAxisIndex:
                    this.isSpeedChecked && this.isCurrentChecked ? 1 : 0, // Bind to right y-axis
                },
              ]
            : []),
        ],
      };

      // Set options for the chart
      midspeedanddirection.setOption(option);
      this.loading = false;
      window.addEventListener('resize', () => {
        midspeedanddirection.resize();
      });
    } else {
      //console.error("Element with id 'midspeedanddirection' not found");
      this.loading = false;
    }
  }
}
