import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface LatLng {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [GoogleMapsModule, CommonModule], 
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('map') map!: GoogleMap;
  center: LatLng = { lat: 35.681236, lng: 139.767125 }; // デフォルト: 東京駅
  zoom = 15;
  currentPosition: google.maps.LatLngLiteral | null = null;

  isRecording = false;

  path: LatLng[] = [];
  local: LatLng[] = [];
  shard: Record<string, LatLng[]> = {}; 
  watchId: number | null = null;
  readonly storageKey = 'local-path';
  readonly login_name = localStorage.getItem('login_name') || 'unknown';

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,      // 「地図」「航空写真」などの切替ボタンを非表示
    fullscreenControl: false,   // フルスクリーンボタンを非表示
    streetViewControl: false,   // ストリートビューを非表示
    zoomControl: true,          // ズームコントロールは必要に応じて
    scaleControl: false,        // スケールバー
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // 既存の記録があれば復元
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.local = JSON.parse(saved);
      if (this.path.length > 0) {
        this.center = this.local[this.local.length - 1];
      }
    }

    this.fetchShardData();

  }

  ngAfterViewInit(): void {
    // google.maps.ControlPositionが確実に使えるタイミングでセット
    this.mapOptions.zoomControlOptions = {
      position: 4 // LEFT_CENTER
    };

    // map が初期化された後に呼び出す
    if (this.map) {
      this.getCurrentLocation();
      if (this.map?.googleMap) {
        this.map.googleMap.setZoom(15);// ズームレベルを調整
      }
    }
  }

  // マップ初期化時にカスタムボタンを追加
  onMapInitialized(map: google.maps.Map) {
    const controls = document.getElementById('controls')!;
    // マップの右下にボタンを配置
    //map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controls);
    //map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
  }

  // 現在位置を取得
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: google.maps.LatLngLiteral = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (this.map?.googleMap) {
            this.map.googleMap.setCenter(pos);// マップの中心を現在位置に移動
          }

          this.currentPosition = pos; // マーカーを表示するために位置を保存
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

  startRecording() {
    if (this.isRecording) return;
    this.isRecording = true;
    // 新規記録開始時はpathをリセット
    this.path = [];

    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          let last = this.path[this.path.length - 1];
          // 直前のポイントと同じ位置は追加しない
          if (last && last.lat === point.lat && last.lng === point.lng) return;

          // マップの中心を更新
          if (this.map?.googleMap) {
            this.map.googleMap.setCenter(point);
          }

          // pathにポイントを追加し、localStorageに保存
          this.path = [...this.path, point];
          localStorage.setItem(this.storageKey, JSON.stringify(this.path));
          this.center = point;
        },
        (error) => {
          console.warn('位置情報の取得に失敗しました', error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    // pathは既にlocalStorageに保存済み
  }

  async regist() {
    try {
      const res = await fetch(`https://${environment.fqdn}/add`,
        {
          method: 'POST',
          body: JSON.stringify(
            { name: this.login_name, value: [...this.path, ...this.local] }
          ),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (res.ok) {
        alert('共有しました');
        localStorage.removeItem(this.storageKey);
      } else {
        alert('共有に失敗しました');
      }
    } catch (e) {
      alert('共有エラー: ' + e);
    }
  }

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
        for (let name in data) {
          for (let date in data[name]) {
            if (!this.shard[date]) this.shard[date] = [];
            this.shard[date] = [...this.shard[date], ...data[name][date]];
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
      return false;
    }
  }
}
