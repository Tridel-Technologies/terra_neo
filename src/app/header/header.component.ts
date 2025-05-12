import { CommonModule } from '@angular/common';
import { Component, Input, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from '../base/base.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() index!:number;
  theme:string = 'light';
  private themeSource = new BehaviorSubject<string>('dark');
  currentTheme$ = this.themeSource.asObservable();


  constructor(private renderer: Renderer2, private base:BaseComponent){}
onpageChange(index:number){
  this.base.index = index;
}
  
  onChangeTheme(theme:string){
    this.renderer.setAttribute(document.documentElement, 'data-theme', theme);
    this.theme = theme;
    this.themeSource.next(theme);
  }
}
