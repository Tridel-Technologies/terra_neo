import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImporterComponent } from './importer.component';

describe('ImporterComponent', () => {
  let component: ImporterComponent;
  let fixture: ComponentFixture<ImporterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImporterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImporterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
