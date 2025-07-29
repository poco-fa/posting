import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Component } from '@angular/core';

import { MapComponent } from './map.component';
import { PathSegmentationService } from '../service/path-segmentation.service';

/**
 * Google Maps API なしでのテスト用モックコンポーネント
 * 実際の Google Maps 初期化を回避してテストを実行可能にする
 */
@Component({
  selector: 'app-map',
  template: '<div>Map Component</div>',
  standalone: true
})
class MockMapComponent extends MapComponent {}

/**
 * MapComponent のユニットテスト
 * 
 * テスト対象機能：
 * - コンポーネントの基本的な初期化
 * - PathSegmentationService との統合
 * - セグメント取得メソッドの動作
 * - 初期状態の確認
 * 
 * 注意：Google Maps API の初期化は回避し、
 * ロジック部分のみをテスト対象とする
 */
describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let pathSegmentationService: PathSegmentationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // HTTP通信のモック
      providers: [PathSegmentationService],
      schemas: [NO_ERRORS_SCHEMA] // 未知の要素（google-map等）を無視
    })
    .overrideComponent(MapComponent, {
      set: {
        // Google Maps 初期化を回避するための空テンプレート
        template: '<div>Map Component</div>'
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    pathSegmentationService = TestBed.inject(PathSegmentationService);
    // detectChanges() を呼ばず Google Maps 初期化を回避
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * PathSegmentationService との統合テスト
   * コンポーネントがサービスを正しく利用できることを確認
   */
  describe('component integration with PathSegmentationService', () => {
    beforeEach(() => {
      // Google Maps を初期化せずにコンポーネントを使用
    });

    it('should return path segments', () => {
      // 現在記録中軌跡のセグメント取得テスト
      component.path = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.pathSegments;
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
    });

    it('should return local segments', () => {
      // ローカル保存軌跡のセグメント取得テスト
      component.local = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.localSegments;
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
    });

    it('should return shard segments', () => {
      // 共有軌跡のセグメント取得テスト
      const points = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.getShardSegments(points, 'test-key');
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
    });

    it('should use PathSegmentationService for path segmentation', () => {
      // PathSegmentationService の呼び出し確認
      // サービスメソッドがコンポーネントから正しく呼ばれることをテスト
      spyOn(pathSegmentationService, 'createPathSegments').and.returnValue([]);
      
      component.path = [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.681300, lng: 139.767200 }
      ];
      
      const segments = component.pathSegments;
      expect(pathSegmentationService.createPathSegments).toHaveBeenCalledWith(component.path);
    });

    it('should initialize with default values', () => {
      // コンポーネントの初期状態確認
      // 各プロパティが期待される初期値で設定されることをテスト
      expect(component.center).toEqual({ lat: 35.681236, lng: 139.767125 }); // 東京駅
      expect(component.zoom).toBe(15);
      expect(component.isRecording).toBe(false); // 記録停止状態
      expect(component.path).toEqual([]); // 空の軌跡
      expect(component.local).toEqual([]); // 空のローカルデータ
      expect(component.shard).toEqual({}); // 空の共有データ
    });
  });
});
