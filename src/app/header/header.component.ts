import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from '../base/base.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  @Input() index!:number;
  theme:string = 'light';
  private themeSource = new BehaviorSubject<string>('dark');
  currentTheme$ = this.themeSource.asObservable();
ngOnInit(){
  const theme = localStorage.getItem('theme');
  this.base.chartFont = theme!;
  this.theme = theme!;
  this.onChangeTheme(theme!);
}

  constructor(private renderer: Renderer2, private base:BaseComponent, private router:Router){}
onpageChange(index:number){
  this.base.index = index;
}
  logout(){
    this.router.navigate(['/login']);
  }
  onChangeTheme(theme:string){
    this.renderer.setAttribute(document.documentElement, 'data-theme', theme);
    this.theme = theme;
    this.themeSource.next(theme);
    this.base.chartFont = theme;
    localStorage.setItem('theme', theme);
   const data = window.dispatchEvent(new Event('storage'));
  }
}
