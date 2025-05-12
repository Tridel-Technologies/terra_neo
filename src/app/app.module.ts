import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { NgxEchartsModule } from 'ngx-echarts';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    FormsModule,
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
  ],
  bootstrap: [],
})
export class AppModule {}
