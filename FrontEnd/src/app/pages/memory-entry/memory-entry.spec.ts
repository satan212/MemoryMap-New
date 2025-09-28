import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryEntry } from './memory-entry';

describe('MemoryEntry', () => {
  let component: MemoryEntry;
  let fixture: ComponentFixture<MemoryEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
