import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryView } from './memory-view';

describe('MemoryView', () => {
  let component: MemoryView;
  let fixture: ComponentFixture<MemoryView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
