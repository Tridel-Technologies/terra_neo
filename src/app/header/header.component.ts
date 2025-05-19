import { CommonModule } from '@angular/common';
import { Component, Input, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from '../base/base.component';
import { Router } from '@angular/router';

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

  Iconcolor:string = this.theme ==='dark'?'#dee2e6':'#343a40';
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
  }
}
