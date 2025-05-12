import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-battery',
  standalone: true,
  imports: [],
  templateUrl: './battery.component.html',
  styleUrl: './battery.component.css'
})
export class BatteryComponent implements OnInit, OnChanges {
  @Input() percentage: number = 0;
  strokeDashoffset: number = 0;
  batteryColor: string = 'red';

  ngOnInit() {
    this.batteryColor = this.getColor()
    this.updateValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['percentage']) {
      this.updateValues();
    }
  }

  private updateValues() {
    this.percentage = (this.percentage / 12) * 100;
    this.calculateOffset();
    this.batteryColor = this.getColor();
  }

  private calculateOffset() {
    const circleLength = 51;
    this.strokeDashoffset = -51 - ((circleLength / 100) * this.percentage);
    console.log(`Stroke Dashoffset calculated: ${this.strokeDashoffset}`);
  }

  private getColor(): string {
    if (this.percentage >= 75) return '#01A437'; // Green
    if (this.percentage >= 50) return '#F1C40F'; // Yellow
    if (this.percentage >= 25) return '#E67E22'; // Orange
    return '#E74C3C'; // Red
  }
}
