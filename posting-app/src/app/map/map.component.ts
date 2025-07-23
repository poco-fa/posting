import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
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
export class MapComponent implements OnInit {
  center: LatLng = { lat: 35.681236, lng: 139.767125 }; // デフォルト: 東京駅
  zoom = 15;

  isRecording = false;
  path: LatLng[] = [];
  local: LatLng[] = [];
  shard: LatLng[] = [];
  watchId: number | null = null;
  readonly storageKey = 'local-path';
  readonly login_name = localStorage.getItem('login_name') || 'unknown';
  
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
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        },
        (error) => {
          console.warn('現在位置の取得に失敗しました', error);
        }
      );
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
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.apiToken}`
    });
    try {
      await this.http.post(
        `https://${environment.fqdn}/add`,
        { name: this.login_name, value: [...this.path, ...this.local] },
        { headers }
      ).toPromise();
      alert('共有しました');
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      alert('共有エラー: ' + e);
    }
  }

    async fetchShardData() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.apiToken}`
    });
    try {
      const res = await this.http.post(
        `https://${environment.fqdn}/get`,
        { name: this.login_name },
        { headers }
      ).toPromise();
      this.shard = res as any[];
      return true;
    } catch (e) {
      console.error('データ取得エラー: ' + e);
      return false;
    }
  }
}
