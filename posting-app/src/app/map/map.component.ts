import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PathSegmentationService, LatLng, PathSegment } from '../service/path-segmentation.service';

/**
 * GPS軌跡記録・表示用メインマップコンポーネント
 * 
 * 主な機能：
 * - リアルタイムGPS追跡と軌跡記録
 * - 距離ベースの軌跡分割による異常移動の防止
 * - ローカルストレージへの軌跡保存
 * - サーバーとの軌跡共有
 * - 複数の軌跡タイプの色分け表示
 * 
 * 表示される軌跡タイプ：
 * - 現在記録中：赤色
 * - ローカル保存済み：緑色  
 * - 共有軌跡：青色
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [GoogleMapsModule, CommonModule], 
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('map') map!: GoogleMap;
  
  /** 地図の中心座標（デフォルト: 東京駅） */
  center: LatLng = { lat: 35.681236, lng: 139.767125 };
  
  /** 地図のズームレベル */
  zoom = 15;
  
  /** 現在位置マーカー用の座標 */
  currentPosition: google.maps.LatLngLiteral | null = null;

  /** GPS記録中フラグ */
  isRecording = false;

  /** 現在記録中の軌跡（赤色で表示） */
  path: LatLng[] = [];
  
  /** ローカル保存済みの軌跡（緑色で表示） */
  local: LatLng[] = [];
  
  /** 
   * 共有軌跡データ（青色で表示）
   * キー形式: "YYYY-MM-DD-ユーザー名"
   * 値: GPS座標配列
   */
  shard: Record<string, LatLng[]> = {}; 
  
  /** geolocation.watchPosition のID（記録停止時に使用） */
  watchId: number | null = null;
  
  /** ローカルストレージのキー名 */
  readonly storageKey = 'local';
  
  /** ログインユーザー名（共有時に使用） */
  readonly login_name = localStorage.getItem('login_name') || 'unknown';

  /**
   * Google Maps の表示オプション
   * UIコントロールを最小限に抑えた設定
   */
  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,      // 「地図」「航空写真」などの切替ボタンを非表示
    fullscreenControl: false,   // フルスクリーンボタンを非表示
    streetViewControl: false,   // ストリートビューを非表示
    zoomControl: true,          // ズームコントロールは表示
    scaleControl: false,        // スケールバーを非表示
  };

  constructor(private http: HttpClient, private pathSegmentationService: PathSegmentationService) {}

  /**
   * 現在記録中の軌跡を分割済みセグメントとして取得
   * @returns 距離ベースで分割されたパスセグメント配列
   */
  get pathSegments(): PathSegment[] {
    return this.pathSegmentationService.createPathSegments(this.path);
  }

  /**
   * ローカル保存済み軌跡を分割済みセグメントとして取得
   * @returns 距離ベースで分割されたパスセグメント配列
   */
  get localSegments(): PathSegment[] {
    return this.pathSegmentationService.createPathSegments(this.local);
  }

  /**
   * 指定された座標配列を分割済みセグメントとして取得
   * 共有軌跡の表示に使用
   * @param points GPS座標配列
   * @returns 距離ベースで分割されたパスセグメント配列
   */
  getShardSegments(points: LatLng[]): PathSegment[] {
    return this.pathSegmentationService.createPathSegments(points);
  }

  /**
   * コンポーネント初期化処理
   * ローカルストレージからの軌跡復元と共有データ取得を実行
   */
  ngOnInit(): void {
    // ローカルストレージから保存済み軌跡を復元
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.local = JSON.parse(saved);
      if (this.local.length > 0) {
        // 最後に記録された位置を地図中心に設定
        this.center = this.local[this.local.length - 1];
      }
    }

    // サーバーから共有軌跡データを取得
    this.fetchShardData();
  }

  /**
   * ビュー初期化後処理
   * Google Maps API の完全な初期化を待ってから実行される
   */
  ngAfterViewInit(): void {
    // google.maps.ControlPosition が確実に使用可能になってからズームコントロール位置を設定
    this.mapOptions.zoomControlOptions = {
      position: 4 // LEFT_CENTER
    };

    // Google Map コンポーネントが初期化された後に現在位置取得と初期ズーム設定
    if (this.map) {
      this.getCurrentLocation();
      if (this.map?.googleMap) {
        this.map.googleMap.setZoom(15);// ズームレベルを調整
      }
    }
  }

  /**
   * マップ初期化時のカスタムボタン配置処理
   * 現在は使用していないが、将来的な拡張用に保持
   * @param map 初期化された Google Maps インスタンス
   */
  onMapInitialized(map: google.maps.Map) {
    const controls = document.getElementById('controls')!;
    // マップコントロール領域にボタンを配置する場合は以下を有効化
    //map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controls);
    //map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
  }

  /**
   * 現在位置を取得して地図中心とマーカーを更新
   * ブラウザの Geolocation API を使用
   */
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: google.maps.LatLngLiteral = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // 地図の中心を現在位置に移動
          if (this.map?.googleMap) {
            this.map.googleMap.setCenter(pos);
          }

          // 現在位置マーカーを表示
          this.currentPosition = pos;
        },
        (error) => {
          console.error('位置情報の取得に失敗しました:', error);
          alert('位置情報の取得に失敗しました。許可されているか確認してください。');
        }
      );
    } else {
      alert('このブラウザは位置情報をサポートしていません。');
    }
  }

  /**
   * GPS軌跡の記録を開始
   * 
   * 処理内容：
   * 1. 記録状態の確認と設定
   * 2. 新規記録用の軌跡配列初期化
   * 3. 高精度GPS監視の開始
   * 4. GPS精度フィルタリング（100m閾値）
   * 5. 距離ベース異常検出とログ出力
   * 6. 地図表示とローカルストレージへの自動保存
   */
  startRecording() {
    if (this.isRecording) return;
    this.isRecording = true;
    
    // 新規記録開始時はpath配列をリセット
    // （local配列は保持して履歴として残す）
    this.path = [];

    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const last = this.path[this.path.length - 1];
          
          // 重複位置の排除：直前のポイントと完全に同じ座標は無視
          if (last && last.lat === point.lat && last.lng === point.lng) return;

          // GPS精度フィルタリング：精度が100m以上の場合は信頼性が低いため無視
          // これにより建物内や悪天候時の不正確な位置情報を除外
          if (position.coords.accuracy > 100) {
            console.warn(`GPS精度が低いため点を無視: 精度 ${position.coords.accuracy}m`);
            return;
          }

          // 距離ベース異常検出：前の点から異常に遠い場合は警告ログを出力
          // データは保存するが、後でセグメント分割により線の描画は防止される
          if (last) {
            const distance = this.pathSegmentationService.calculateDistance(last, point);
            if (distance > this.pathSegmentationService.maxDistanceThreshold) {
              console.warn(`前の点から${Math.round(distance)}m離れている新しい点を記録 (閾値: ${this.pathSegmentationService.maxDistanceThreshold}m)`);
            }
          }

          // 地図の中心を現在位置に追従
          if (this.map?.googleMap) {
            this.map.googleMap.setCenter(point);
          }

          // 新しいポイントを軌跡に追加し、ローカルストレージに即座に保存
          // 記録中断時のデータ損失を防ぐ
          this.path = [...this.path, point];
          localStorage.setItem(this.storageKey, JSON.stringify(this.path));
          this.center = point;
        },
        (error) => {
          console.warn('位置情報の取得に失敗しました', error);
        },
        { 
          enableHighAccuracy: true,  // 高精度モード（GPS優先）
          maximumAge: 0,            // キャッシュ無効（常に最新位置を取得）
          timeout: 10000            // 10秒でタイムアウト
        }
      );
    }
  }

  /**
   * GPS軌跡の記録を停止
   * 
   * 処理内容：
   * 1. 位置監視の停止
   * 2. 記録中軌跡をローカル履歴に統合
   * 3. ローカルストレージの更新
   * 4. 記録状態のリセット
   */
  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    
    if (this.watchId !== null) {
      // GPS位置監視を停止
      navigator.geolocation.clearWatch(this.watchId);
      
      // 記録中の軌跡をローカル履歴に追加
      this.local = [...this.local, ...this.path];
      localStorage.setItem(this.storageKey, JSON.stringify(this.local));
      
      // 記録中軌跡をクリア
      this.path = [];
      
      // ローカルストレージから最新データを再読み込みして整合性を保つ
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.local = JSON.parse(saved);
        // 最初のポイント削除処理（理由不明のレガシー処理）
        if (this.local.length > 0) {
          this.local = this.local.slice(1);
        }
      }
      
      this.watchId = null;
    }
  }

  /**
   * ローカル保存された軌跡をサーバーに共有
   * 
   * 処理内容：
   * 1. サーバーAPIへのPOSTリクエスト送信
   * 2. 軌跡データの JSON 形式での送信
   * 3. 成功時のローカルデータクリア
   * 4. 共有軌跡データの再取得
   * 
   * データ形式：
   * - name: ユーザー名
   * - value: GPS座標配列
   */
  async regist() {
    try {
      const res = await fetch(`https://${environment.fqdn}/add`,
        {
          method: 'POST',
          body: JSON.stringify(
            { 
              name: this.login_name, 
              value: [...this.local] 
            }
          ),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (res.ok) {
        alert('共有しました');
        // 共有成功時はローカルデータをクリア
        localStorage.removeItem(this.storageKey);
        this.local = [];
        this.path = [];
        // 共有軌跡データを再取得して最新状態に更新
        this.fetchShardData();
      } else {
        alert('共有に失敗しました');
      }
    } catch (e) {
      alert('共有エラー: ' + e);
    }
  }

  /**
   * サーバーから共有軌跡データを取得
   * 
   * 処理内容：
   * 1. サーバーAPIからのデータ取得
   * 2. ユーザー別・日付別のデータ構造を平坦化
   * 3. null値のフィルタリング
   * 4. 内部データ構造への変換
   * 
   * サーバーデータ形式：
   * {
   *   "ユーザー名": {
   *     "YYYY-MM-DD": [GPS座標配列]
   *   }
   * }
   * 
   * 内部データ形式：
   * {
   *   "YYYY-MM-DD-ユーザー名": GPS座標配列
   * }
   * 
   * @returns 取得成功時はtrue、失敗時はfalse
   */
  async fetchShardData() {
    try {
      const res = await fetch(`https://${environment.fqdn}/get`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (res.ok) {
        let data = await res.json();
        
        // ネストされたデータ構造を平坦化
        for (let name in data) {
          if (name) {
            for (let date in data[name]) {
              if( date ) {
                // キー形式: "日付-ユーザー名"
                const key = `${date}-${name}`;
                if (!this.shard[key]) this.shard[key] = [];
                
                // 既存データに追加（null値は除外）
                this.shard[key] = [
                  ...this.shard[key], 
                  ...(data[name][date].filter((item: any) => item !== null)),
                ];
              }
            }
          }
        }
        return true;
      } else {
        console.error('データ取得に失敗しました');
        return false;
      }
    } catch (e) {
      console.error('データ取得エラー: ' + e);
      return false;
    }
  }
}
