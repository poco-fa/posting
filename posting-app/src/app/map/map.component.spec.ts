import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MapComponent } from './map.component';

describe('Map', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    // Mock Google Maps
    (window as any).google = {
      maps: {
        Map: class MockMap {},
        LatLng: class MockLatLng {},
        Marker: class MockMarker {},
        ControlPosition: {},
      }
    };

    await TestBed.configureTestingModule({
      imports: [MapComponent, HttpClientTestingModule],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    
    // Don't trigger change detection to avoid Google Maps initialization
    // fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear localStorage when clearLocalStorage is called and confirmed', () => {
    // Setup test data
    localStorage.setItem('login_name', 'test-user');
    localStorage.setItem('local', JSON.stringify([{lat: 35.681236, lng: 139.767125}]));
    component.local = [{lat: 35.681236, lng: 139.767125}];
    component.path = [{lat: 35.681236, lng: 139.767125}];

    // Mock confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');

    // Call the method
    component.clearLocalStorage();

    // Verify localStorage is cleared
    expect(localStorage.getItem('login_name')).toBeNull();
    expect(localStorage.getItem('local')).toBeNull();
    expect(component.local).toEqual([]);
    expect(component.path).toEqual([]);
    expect(window.confirm).toHaveBeenCalledWith('本当にローカルデータを削除しますか？\n党員番号と記録されたパスがすべて削除されます。');
    expect(window.alert).toHaveBeenCalledWith('ローカルデータを削除しました。\nページを再読み込みすると党員番号の入力が求められます。');
  });

  it('should not clear localStorage when clearLocalStorage is called but not confirmed', () => {
    // Setup test data
    localStorage.setItem('login_name', 'test-user');
    localStorage.setItem('local', JSON.stringify([{lat: 35.681236, lng: 139.767125}]));
    component.local = [{lat: 35.681236, lng: 139.767125}];
    component.path = [{lat: 35.681236, lng: 139.767125}];

    // Mock confirm to return false
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(window, 'alert');

    // Call the method
    component.clearLocalStorage();

    // Verify localStorage is NOT cleared
    expect(localStorage.getItem('login_name')).toBe('test-user');
    expect(localStorage.getItem('local')).toBe(JSON.stringify([{lat: 35.681236, lng: 139.767125}]));
    expect(component.local).toEqual([{lat: 35.681236, lng: 139.767125}]);
    expect(component.path).toEqual([{lat: 35.681236, lng: 139.767125}]);
    expect(window.confirm).toHaveBeenCalledWith('本当にローカルデータを削除しますか？\n党員番号と記録されたパスがすべて削除されます。');
    expect(window.alert).not.toHaveBeenCalled();
  });
});
