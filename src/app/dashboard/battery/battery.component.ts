import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-battery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './battery.component.html',
  styleUrl: './battery.component.css',
})
export class BatteryComponent implements OnInit, OnChanges {
  @Input() voltage: number = 0; // changed name
  percentage: number = 0;
  strokeDashoffset: number = 0;
  batteryColor: string = 'red';
  @Input() isLive: boolean = false;

  ngOnInit() {
    this.batteryColor = this.getColor();
    this.updateValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['voltage']) {
      this.updateValues();
    }
  }

  private updateValues() {
    const maxVoltage = 12.4;
    let voltage = Math.min(this.voltage, maxVoltage);

    const voltagePercentage = Math.round((voltage / maxVoltage) * 100);
    this.percentage = voltagePercentage;

    this.calculateOffset();
    this.batteryColor = this.getColor();
  }

  private calculateOffset() {
    const circleLength = 51;
    this.strokeDashoffset = -51 - (circleLength / 100) * this.percentage;
    console.log(`Stroke Dashoffset calculated: ${this.strokeDashoffset}`);
  }

  private getColor(): string {
    if (this.percentage >= 75) return '#01A437'; // Green
    if (this.percentage >= 50) return '#F1C40F'; // Yellow
    if (this.percentage >= 25) return '#E67E22'; // Orange
    return '#E74C3C'; // Red
  }
}
