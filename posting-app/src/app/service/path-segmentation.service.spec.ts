import { TestBed } from '@angular/core/testing';
import { PathSegmentationService } from './path-segmentation.service';

/**
 * PathSegmentationService のユニットテスト
 * 
 * テスト対象機能：
 * - ハーベルサイン公式による距離計算の精度
 * - 距離ベースのパス分割ロジック
 * - エッジケースの処理（空配列、単一点、閾値境界など）
 */
describe('PathSegmentationService', () => {
  let service: PathSegmentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PathSegmentationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * 距離計算機能のテスト
   * ハーベルサイン公式の実装が正しく動作することを検証
   */
  describe('distance calculation', () => {
    it('should calculate distance between two close points', () => {
      // 東京駅とその近傍点での距離計算テスト
      // 実際の距離は約10m程度を想定
      const point1 = { lat: 35.681236, lng: 139.767125 }; // 東京駅
      const point2 = { lat: 35.681300, lng: 139.767200 }; // 東京駅の近く
      
      const distance = service.calculateDistance(point1, point2);
      expect(distance).toBeLessThan(100); // 100m未満であることを確認
    });

    it('should calculate distance between two distant points', () => {
      // 東京駅と新宿駅間の距離計算テスト
      // 実際の距離は約6-7km程度を想定
      const point1 = { lat: 35.681236, lng: 139.767125 }; // 東京駅
      const point2 = { lat: 35.658034, lng: 139.701636 }; // 新宿駅
      
      const distance = service.calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(5000); // 5km以上であることを確認
    });

    it('should return 0 for identical points', () => {
      // 同一座標での距離計算（境界値テスト）
      const point1 = { lat: 35.681236, lng: 139.767125 };
      const point2 = { lat: 35.681236, lng: 139.767125 };
      
      const distance = service.calculateDistance(point1, point2);
      expect(distance).toBeLessThan(1); // ほぼ0であることを確認（浮動小数点誤差考慮）
    });
  });

  /**
   * パス分割機能のテスト
   * 距離閾値に基づく適切なセグメント分割を検証
   */
  describe('path segmentation', () => {
    it('should create single segment for close points', () => {
      // 近距離点のみの場合：単一セグメントが生成されることを確認
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
      // 遠距離点を含む場合：複数セグメントに分割されることを確認
      // GPS異常による遠距離跳躍を模擬
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
      // 単一点の場合：線を描画できないため空配列を返す
      const points = [{ lat: 35.681236, lng: 139.767125 }];
      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(0);
    });

    it('should return empty array for empty points', () => {
      // 空配列の場合：セグメント生成不可
      const points: any[] = [];
      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(0);
    });

    it('should handle points right at the distance threshold', () => {
      // 距離閾値境界値テスト：100m以下は接続される
      // Create two points that are close to but under 100m apart
      const point1 = { lat: 35.681236, lng: 139.767125 };
      const point2 = { lat: 35.681800, lng: 139.767125 }; // ~63m north
      const points = [point1, point2];

      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(1); // Should be connected since it's under threshold
    });

    it('should create separate segments when distance exceeds threshold', () => {
      // 距離閾値超過テスト：100m超過で分割される
      // GPS信号不良による異常な跳躍を模擬（1km跳躍）
      const points = [
        { lat: 35.681236, lng: 139.767125 }, // 東京駅
        { lat: 35.681300, lng: 139.767200 }, // 東京駅の近く (< 100m)
        { lat: 35.691236, lng: 139.767125 }, // 東京駅から約1.1km北 (> 100m)
        { lat: 35.691300, lng: 139.767200 }  // そのすぐ近く (< 100m)
      ];

      const segments = service.createPathSegments(points);
      expect(segments.length).toBe(2);
      expect(segments[0].points).toEqual([points[0], points[1]]);
      expect(segments[1].points).toEqual([points[2], points[3]]);
    });
  });
});