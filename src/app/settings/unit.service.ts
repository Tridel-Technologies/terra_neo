import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UnitSettings {
  waterLevel: string;
  currentSpeed: string;
  currentDirection: string;
  battery: string;
  depth: string;
  latandlong: string;
}

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  private localStorageKey = 'unitSettings';

  private defaultUnits: UnitSettings = {
    waterLevel: 'm',
    currentSpeed: 'm/s',
    currentDirection: '°',
    battery: '%',
    depth: 'm',
    latandlong: 'DD',
  };

  private unitsSubject: BehaviorSubject<UnitSettings>;
  units$: Observable<UnitSettings>;

  constructor() {
    const stored = localStorage.getItem(this.localStorageKey);
    const initialUnits = stored ? JSON.parse(stored) : this.defaultUnits;
    this.unitsSubject = new BehaviorSubject<UnitSettings>(initialUnits);
    this.units$ = this.unitsSubject.asObservable();
  }

  updateUnit(parameter: keyof UnitSettings, unit: string): void {
    const updated = { ...this.unitsSubject.value, [parameter]: unit };
    this.unitsSubject.next(updated);
    localStorage.setItem(this.localStorageKey, JSON.stringify(updated));
  }

  getCurrentUnits(): UnitSettings {
    return this.unitsSubject.value;
  }
}
