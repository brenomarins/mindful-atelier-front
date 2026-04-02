import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('prepareRoute returns empty string when outlet not activated', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const mockOutlet = { isActivated: false } as any;
    expect(app.prepareRoute(mockOutlet)).toBe('');
  });
});
