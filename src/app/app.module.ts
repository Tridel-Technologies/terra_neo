import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// import { CompassChartComponent } from './compass-chart/compass-chart.component';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,


    ToastrModule.forRoot({}),
    HttpClientModule,




  ],
  providers: [

  ],
  bootstrap: [],
  exports:[] 
})
export class AppModule {}