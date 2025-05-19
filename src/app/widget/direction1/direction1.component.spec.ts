import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Direction1Component } from './direction1.component';

describe('Direction1Component', () => {
  let component: Direction1Component;
  let fixture: ComponentFixture<Direction1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Direction1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Direction1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
