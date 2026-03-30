import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { JournalComponent } from './journal.component';
import { JournalService } from '../../core/services/journal.service';
import { JournalEntry } from '../../core/models/journal.model';

const TODAY = new Date().toISOString().slice(0, 10);

const MOCK_ENTRY: JournalEntry = {
  date: TODAY,
  mood: 'good',
  achievements: 'shipped a feature',
  difficulties: 'merge conflict',
  createdAt: '',
  updatedAt: '',
};

describe('JournalComponent', () => {
  let fixture: ComponentFixture<JournalComponent>;
  let component: JournalComponent;
  let journalSvc: jasmine.SpyObj<JournalService>;
  let router: Router;

  beforeEach(() => {
    journalSvc = jasmine.createSpyObj('JournalService', ['getByDate', 'upsert']);
    journalSvc.getByDate.and.returnValue(throwError(() => ({ status: 404 })));
    journalSvc.upsert.and.returnValue(of(MOCK_ENTRY));

    TestBed.configureTestingModule({
      imports: [JournalComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: JournalService, useValue: journalSvc },
      ],
    });

    fixture   = TestBed.createComponent(JournalComponent);
    component = fixture.componentInstance;
    router    = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls getByDate with today on init', () => {
    expect(journalSvc.getByDate).toHaveBeenCalledWith(TODAY);
  });

  it('form is blank and no error on 404', () => {
    expect(component.mood()).toBeNull();
    expect(component.achievements()).toBe('');
    expect(component.difficulties()).toBe('');
    expect(component.loadError()).toBeNull();
  });

  it('populates form when entry loads successfully', () => {
    journalSvc.getByDate.and.returnValue(of(MOCK_ENTRY));
    component.prevDay();
    fixture.detectChanges();
    expect(component.mood()).toBe('good');
    expect(component.achievements()).toBe('shipped a feature');
    expect(component.difficulties()).toBe('merge conflict');
  });

  it('sets loadError on non-404 load failure', () => {
    journalSvc.getByDate.and.returnValue(throwError(() => ({ status: 500 })));
    component.prevDay();
    fixture.detectChanges();
    expect(component.loadError()).toBeTruthy();
  });

  it('loading is false after successful load', () => {
    journalSvc.getByDate.and.returnValue(of(MOCK_ENTRY));
    component.prevDay();
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
  });

  it('loading is false after 404', () => {
    expect(component.loading()).toBeFalse();
  });

  it('canSave is false when mood is null', () => {
    expect(component.canSave()).toBeFalse();
  });

  it('canSave is true when mood is set', () => {
    component.mood.set('good');
    expect(component.canSave()).toBeTrue();
  });

  it('canSave is false while loading', () => {
    component.mood.set('good');
    component.loading.set(true);
    expect(component.canSave()).toBeFalse();
  });

  it('prevDay() decrements selectedDate by one day', () => {
    const before = component.selectedDate();
    component.prevDay();
    const after  = component.selectedDate();
    const diffMs = new Date(before + 'T12:00:00').getTime()
                 - new Date(after  + 'T12:00:00').getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });

  it('nextDay() does nothing when already on today', () => {
    const before = component.selectedDate();
    component.nextDay();
    expect(component.selectedDate()).toBe(before);
  });

  it('nextDay() increments date when not on today', () => {
    component.prevDay();
    fixture.detectChanges();
    const yesterday = component.selectedDate();
    component.nextDay();
    expect(component.selectedDate()).not.toBe(yesterday);
  });

  it('isToday is true on init', () => {
    expect(component.isToday()).toBeTrue();
  });

  it('isToday is false after prevDay', () => {
    component.prevDay();
    expect(component.isToday()).toBeFalse();
  });

  it('saveDraft() calls upsert with correct payload', () => {
    component.mood.set('great');
    component.achievements.set('done');
    component.difficulties.set('hard');
    component.saveDraft();
    expect(journalSvc.upsert).toHaveBeenCalledWith(TODAY, {
      mood: 'great',
      achievements: 'done',
      difficulties: 'hard',
    });
  });

  it('saveDraft() does not navigate', () => {
    component.mood.set('good');
    spyOn(router, 'navigate');
    component.saveDraft();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('saveDraft() resets saving to false on success', () => {
    component.mood.set('good');
    component.saveDraft();
    expect(component.saving()).toBeFalse();
  });

  it('saveDraft() does nothing when canSave is false', () => {
    component.saveDraft();
    expect(journalSvc.upsert).not.toHaveBeenCalled();
  });

  it('completeReflection() calls upsert and navigates to /schedule', () => {
    component.mood.set('good');
    spyOn(router, 'navigate');
    component.completeReflection();
    expect(journalSvc.upsert).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/schedule']);
  });

  it('saving is false before router.navigate in completeReflection', () => {
    component.mood.set('good');
    let savingAtNavigate: boolean | undefined;
    spyOn(router, 'navigate').and.callFake(() => {
      savingAtNavigate = component.saving();
      return Promise.resolve(true);
    });
    component.completeReflection();
    expect(savingAtNavigate).toBeFalse();
  });

  it('completeReflection() does not navigate on upsert failure', () => {
    component.mood.set('good');
    journalSvc.upsert.and.returnValue(throwError(() => new Error('fail')));
    spyOn(router, 'navigate');
    component.completeReflection();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('sets saveError on upsert failure', () => {
    component.mood.set('good');
    journalSvc.upsert.and.returnValue(throwError(() => new Error('fail')));
    component.saveDraft();
    expect(component.saveError()).toBeTruthy();
  });

  it('saving is false after upsert failure', () => {
    component.mood.set('good');
    journalSvc.upsert.and.returnValue(throwError(() => new Error('fail')));
    component.saveDraft();
    expect(component.saving()).toBeFalse();
  });
});
