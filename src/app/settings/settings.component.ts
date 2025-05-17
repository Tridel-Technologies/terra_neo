import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UnitService } from './unit.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {

  unitSettings = [
  {
    key: 'waterLevel',
    label: 'Water Level',
    iconClass: 'fas fa-water', // or use another icon library
    units: ['m', 'ft', 'cm']
  },
  {
    key: 'currentSpeed',
    label: 'Current Speed',
    iconClass: 'fas fa-tachometer-alt',
    units: ['m/s', 'knots']
  },
  {
    key: 'currentDirection',
    label: 'Current Direction',
    iconClass: 'fas fa-compass',
    units: ['°']
  },
  {
    key: 'battery',
    label: 'Battery',
    iconClass: 'fas fa-battery-full',
    units: ['%', 'volts']
  },
  {
    key: 'depth',
    label: 'Depth',
    iconClass: 'fas fa-arrows-down-to-line',
    units: ['m', 'ft']
  }
];

getTooltip(paramKey: string, unit: string): string {
  const tooltips: any = {
    waterLevel: {
      m: 'Meters',
      ft: 'Feet',
      cm: 'Centimeters'
    },
    currentSpeed: {
      'm/s': 'Meters per second',
      knots: 'Knots'
    },
    currentDirection: {
      '°': 'Degrees',
      rad: 'Radians'
    },
    battery: {
      '%': 'Percentage',
      volts: 'Volts'
    },
    depth: {
      m: 'Meters',
      ft: 'Feet'
    }
  };

  return tooltips[paramKey]?.[unit] || '';
}

selectedUnits: any = {};

constructor(private unitService: UnitService) {
  this.selectedUnits = this.unitService.getCurrentUnits();
}

selectUnit(paramKey: string, unit: string) {
  this.selectedUnits[paramKey] = unit;
  this.unitService.updateUnit(paramKey as any, unit);
}

}
