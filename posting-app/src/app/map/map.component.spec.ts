import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Component } from '@angular/core';

import { MapComponent } from './map.component';
import { PathSegmentationService } from '../service/path-segmentation.service';

// Mock component template without Google Maps
@Component({
  selector: 'app-map',
  template: '<div>Map Component</div>',
  standalone: true
})
class MockMapComponent extends MapComponent {}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let pathSegmentationService: PathSegmentationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PathSegmentationService],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements like google-map
    })
    .overrideComponent(MapComponent, {
      set: {
        template: '<div>Map Component</div>' // Override template to avoid Google Maps initialization
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    pathSegmentationService = TestBed.inject(PathSegmentationService);
    // Don't call detectChanges() to avoid initializing Google Maps
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component integration with PathSegmentationService', () => {
    beforeEach(() => {
      // Initialize component without calling detectChanges()
    });

    it('should return path segments', () => {
      component.path = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.pathSegments;
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
    });

    it('should return local segments', () => {
      component.local = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.localSegments;
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
    });

    it('should return shard segments', () => {
      const points = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.getShardSegments(points);
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
    });

    it('should use PathSegmentationService for path segmentation', () => {
      spyOn(pathSegmentationService, 'createPathSegments').and.returnValue([]);
      
      component.path = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.pathSegments;
      expect(pathSegmentationService.createPathSegments).toHaveBeenCalledWith(component.path);
    });

    it('should initialize with default values', () => {
      expect(component.center).toEqual({ lat: 35.681236, lng: 139.767125 });
      expect(component.zoom).toBe(15);
      expect(component.isRecording).toBe(false);
      expect(component.path).toEqual([]);
      expect(component.local).toEqual([]);
      expect(component.shard).toEqual({});
    });
  });
});
