import { TestBed } from '@angular/core/testing';
import { WakeLockService } from './wake-lock.service';

describe('WakeLockService', () => {
  let service: WakeLockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WakeLockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect if Wake Lock API is supported', () => {
    // This test just ensures the method exists and returns a boolean
    const supported = service.isSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('should have active property', () => {
    // This test just ensures the active property exists and returns a boolean
    const active = service.active;
    expect(typeof active).toBe('boolean');
  });
});