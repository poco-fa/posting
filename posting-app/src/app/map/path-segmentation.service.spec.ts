import { TestBed } from '@angular/core/testing';
import { PathSegmentationService } from './path-segmentation.service';

describe('PathSegmentationService', () => {
  let service: PathSegmentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PathSegmentationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('distance calculation', () => {
    it('should calculate distance between two close points', () => {
      const point1 = { lat: 35.681236, lng: 139.767125 }; // 東京駅
      const point2 = { lat: 35.681300, lng: 139.767200 }; // 東京駅の近く
      
      const distance = service.calculateDistance(point1, point2);
      expect(distance).toBeLessThan(100); // 100m未満であることを確認
    });

    it('should calculate distance between two distant points', () => {
      const point1 = { lat: 35.681236, lng: 139.767125 }; // 東京駅
      const point2 = { lat: 35.658034, lng: 139.701636 }; // 新宿駅
      
      const distance = service.calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(5000); // 5km以上であることを確認
    });

    it('should return 0 for identical points', () => {
      const point1 = { lat: 35.681236, lng: 139.767125 };
      const point2 = { lat: 35.681236, lng: 139.767125 };
      
      const distance = service.calculateDistance(point1, point2);
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

      const segments = service.createPathSegments(points);
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

      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(2); // 2つのセグメントに分かれることを確認
      expect(segments[0].points.length).toBe(2); // 最初のセグメントは2点
      expect(segments[1].points.length).toBe(2); // 2番目のセグメントは2点
    });

    it('should return empty array for single point', () => {
      const points = [{ lat: 35.681236, lng: 139.767125 }];
      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(0);
    });

    it('should return empty array for empty points', () => {
      const points: any[] = [];
      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(0);
    });

    it('should handle points right at the distance threshold', () => {
      // Create two points that are close to but under 1000m apart
      const point1 = { lat: 35.681236, lng: 139.767125 };
      const point2 = { lat: 35.685236, lng: 139.767125 }; // ~444m north
      const points = [point1, point2];

      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(1); // Should be connected since it's under threshold
    });

    it('should create separate segments when distance exceeds threshold', () => {
      // Create points that are more than 1000m apart
      const points = [
        { lat: 35.681236, lng: 139.767125 }, // 東京駅
        { lat: 35.681300, lng: 139.767200 }, // 東京駅の近く (< 1000m)
        { lat: 36.681236, lng: 139.767125 }, // 東京駅から111km北 (> 1000m)
        { lat: 36.681300, lng: 139.767200 }  // そのすぐ近く (< 1000m)
      ];

      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(2);
      expect(segments[0].points).toEqual([points[0], points[1]]);
      expect(segments[1].points).toEqual([points[2], points[3]]);
    });
  });
});