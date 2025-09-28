import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoriesList } from './memories-list';

describe('MemoriesList', () => {
  let component: MemoriesList;
  let fixture: ComponentFixture<MemoriesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoriesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoriesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
