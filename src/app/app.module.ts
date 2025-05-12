import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
    ToastrModule.forRoot(),
    HttpClientModule,
  ],
  providers: [

  ],
  bootstrap: [],
  exports:[] 
})
export class AppModule {}
