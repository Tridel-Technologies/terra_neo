import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSource = new BehaviorSubject<string>('light');
  currentTheme$ = this.themeSource.asObservable();

  constructor() {}

  changeTheme(theme: string) {
    this.themeSource.next(theme);
  }
}
