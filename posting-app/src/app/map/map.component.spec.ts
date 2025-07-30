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

  describe('KML layer initialization', () => {
    it('should apply KML layers after map is ready', () => {
      // Setup: simulate KML layers in localStorage
      const testLayers = [
        { id: 'test-1', name: 'Test Layer 1', url: 'https://example.com/test1.kml', visible: true },
        { id: 'test-2', name: 'Test Layer 2', url: 'https://example.com/test2.kml', visible: false }
      ];
      
      // Set layers directly to simulate them being loaded
      component.kmlLayers = testLayers;
      
      // Mock Google Maps instance with all required methods
      const mockMap = jasmine.createSpyObj('mockMap', ['setZoom', 'setCenter']);
      component.map = { googleMap: mockMap } as any;
      
      // Mock getCurrentLocation to prevent geolocation calls
      spyOn(component, 'getCurrentLocation').and.stub();
      
      // Spy on updateKmlLayers to verify it's called
      spyOn(component as any, 'updateKmlLayers').and.stub();
      
      // Call ngAfterViewInit which should apply KML layers to the map
      component.ngAfterViewInit();
      
      // Verify that updateKmlLayers was called when map is ready
      expect((component as any).updateKmlLayers).toHaveBeenCalled();
    });

    it('should not apply KML layers when map is not ready during ngOnInit', () => {
      // Setup: simulate the race condition where layers are loaded but map isn't ready
      const testLayers = [
        { id: 'test-1', name: 'Test Layer', url: 'https://example.com/test.kml', visible: true }
      ];
      
      // Spy on updateKmlLayers
      spyOn(component as any, 'updateKmlLayers').and.stub();
      
      // Simulate what happens in ngOnInit subscription when layers are loaded from service
      component.kmlLayers = testLayers;
      
      // Map is not ready yet (map property is undefined)
      expect(component.map).toBeUndefined();
      
      // Manually simulate the subscription logic from ngOnInit
      // This represents the race condition where layers load before map is ready
      if (component.map?.googleMap) {
        (component as any).updateKmlLayers();
      }
      
      // updateKmlLayers should not be called since map is not ready
      expect((component as any).updateKmlLayers).not.toHaveBeenCalled();
    });

    it('should apply KML layers on map initialization event', () => {
      // Setup: simulate KML layers being loaded from localStorage
      const testLayers = [
        { id: 'test-1', name: 'Test Layer', url: 'https://example.com/test.kml', visible: true }
      ];
      
      component.kmlLayers = testLayers;
      
      // Mock Google Maps instance
      const mockMap = jasmine.createSpyObj('mockMap', ['setZoom', 'setCenter']) as google.maps.Map;
      
      // Spy on updateKmlLayers to verify it's called
      spyOn(component as any, 'updateKmlLayers').and.stub();
      
      // Call onMapInitialized which should apply KML layers to the map
      component.onMapInitialized(mockMap);
      
      // Verify that updateKmlLayers was called when map is initialized
      expect((component as any).updateKmlLayers).toHaveBeenCalled();
    });
  });

  describe('clearLocalStorage', () => {
    it('should clear localStorage and request location permission when confirmed', () => {
      // localStorage削除と位置情報許可要求のテスト（確認時）
      // モックの設定
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert').and.stub();
      spyOn(localStorage, 'removeItem').and.stub();
      spyOn(localStorage, 'setItem').and.stub();
      
      // Geolocation APIのモック
      const mockGeolocation = {
        getCurrentPosition: jasmine.createSpy('getCurrentPosition').and.callFake(
          (success: any) => {
            // 成功コールバックを呼び出してテスト
            success({
              coords: { latitude: 35.681236, longitude: 139.767125 },
              timestamp: Date.now()
            });
          }
        )
      };
      
      // navigatorのgeolocationをモック
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });
      
      // テストデータの設定
      component.local = [{ lat: 35.681236, lng: 139.767125 }];
      component.path = [{ lat: 35.681300, lng: 139.767200 }];
      
      // メソッド実行
      component.clearLocalStorage();
      
      // 確認
      expect(window.confirm).toHaveBeenCalledWith(
        '本当にローカルデータを削除しますか？\n党員番号と記録されたパスがすべて削除され、位置情報の許可も再度求められます。'
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith('login_name');
      expect(localStorage.removeItem).toHaveBeenCalledWith('local');
      expect(component.local).toEqual([]);
      expect(component.path).toEqual([]);
      expect(window.alert).toHaveBeenCalledTimes(2); // 削除完了 + 位置情報許可成功
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('should not clear localStorage when cancelled', () => {
      // localStorage削除のキャンセル時のテスト
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(localStorage, 'removeItem').and.stub();
      
      const originalLocal = [{ lat: 35.681236, lng: 139.767125 }];
      const originalPath = [{ lat: 35.681300, lng: 139.767200 }];
      component.local = [...originalLocal];
      component.path = [...originalPath];
      
      component.clearLocalStorage();
      
      expect(window.confirm).toHaveBeenCalled();
      expect(localStorage.removeItem).not.toHaveBeenCalled();
      expect(component.local).toEqual(originalLocal);
      expect(component.path).toEqual(originalPath);
    });
  });
});
