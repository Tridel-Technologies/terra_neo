import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
 
export interface UnitSettings {
  waterLevel: string;
  currentSpeed: string;
  currentDirection: string;
  battery: string;
  depth: string;
  latandlong: string;
}
 
@Injectable({
  providedIn: 'root'
})
export class UnitService {
 
  private defaultUnits: UnitSettings = {
    waterLevel: 'm',
    currentSpeed: 'm/s',
    currentDirection: '°',
    battery: '%',
    depth: 'm',
    latandlong:'DD',
  };
 
  private unitsSubject = new BehaviorSubject<UnitSettings>(this.defaultUnits);
  units$ = this.unitsSubject.asObservable();
 
  updateUnit(parameter: keyof UnitSettings, unit: string): void {
    const updated = { ...this.unitsSubject.value, [parameter]: unit };
    this.unitsSubject.next(updated);
  }
 
  getCurrentUnits(): UnitSettings {
    return this.unitsSubject.value;
  }
 
}
 
 