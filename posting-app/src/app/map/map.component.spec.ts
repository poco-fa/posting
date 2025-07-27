import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { MapComponent } from './map.component';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MapComponent],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements like google-map
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid initializing Google Maps
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('distance calculation', () => {
    it('should calculate distance between two close points', () => {
      const point1 = { lat: 35.681236, lng: 139.767125 }; // 東京駅
      const point2 = { lat: 35.681300, lng: 139.767200 }; // 東京駅の近く
      
      const distance = (component as any).calculateDistance(point1, point2);
      expect(distance).toBeLessThan(100); // 100m未満であることを確認
    });

    it('should calculate distance between two distant points', () => {
      const point1 = { lat: 35.681236, lng: 139.767125 }; // 東京駅
      const point2 = { lat: 35.658034, lng: 139.701636 }; // 新宿駅
      
      const distance = (component as any).calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(5000); // 5km以上であることを確認
    });

    it('should return 0 for identical points', () => {
      const point1 = { lat: 35.681236, lng: 139.767125 };
      const point2 = { lat: 35.681236, lng: 139.767125 };
      
      const distance = (component as any).calculateDistance(point1, point2);
      expect(distance).toBeLessThan(1); // ほぼ0であることを確認
    });
  });

  describe('path segmentation', () => {
    it('should create single segment for close points', () => {
      const points = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 },
        { lat: 35.681350, lng: 139.767250 }
      ];

      const segments = (component as any).createPathSegments(points);
      expect(segments.length).toBe(1);
      expect(segments[0].points.length).toBe(3);
    });

    it('should create multiple segments for distant points', () => {
      const points = [
        { lat: 35.681236, lng: 139.767125 }, // 東京駅
        { lat: 35.681300, lng: 139.767200 }, // 東京駅の近く
        { lat: 35.658034, lng: 139.701636 }, // 新宿駅（遠い）
        { lat: 35.658100, lng: 139.701700 }  // 新宿駅の近く
      ];

      const segments = (component as any).createPathSegments(points);
      expect(segments.length).toBe(2); // 2つのセグメントに分かれることを確認
      expect(segments[0].points.length).toBe(2); // 最初のセグメントは2点
      expect(segments[1].points.length).toBe(2); // 2番目のセグメントは2点
    });

    it('should return empty array for single point', () => {
      const points = [{ lat: 35.681236, lng: 139.767125 }];
      const segments = (component as any).createPathSegments(points);
      expect(segments.length).toBe(0);
    });

    it('should return empty array for empty points', () => {
      const points: any[] = [];
      const segments = (component as any).createPathSegments(points);
      expect(segments.length).toBe(0);
    });

    it('should handle points right at the distance threshold', () => {
      // Create two points exactly 1000m apart (our threshold)
      const point1 = { lat: 35.681236, lng: 139.767125 };
      const point2 = { lat: 35.690236, lng: 139.767125 }; // ~1000m north
      const points = [point1, point2];

      const segments = (component as any).createPathSegments(points);
      expect(segments.length).toBe(1); // Should be connected since it's exactly at threshold
    });
  });

  describe('getter methods', () => {
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
  });
});
