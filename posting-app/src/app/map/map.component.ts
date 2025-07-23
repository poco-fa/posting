import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';

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
    try {
      const res = await fetch('https://posting-data-1017332250772.europe-west1.run.app/add', {
        method: 'POST',
        body: JSON.stringify({name:this.login_name, value: [...this.path,...this.local] }),
        headers: { 'Content-Type': 'application/json' },
      });
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
      const res = await fetch('https://posting-data-1017332250772.europe-west1.run.app/get',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        this.shard = await res.json(); // オブジェクト配列をshardに格納
        return true; // 成功時にtrueを返す（必要に応じて変更）
      } else {
        console.error('データ取得に失敗しました');
        return false; // 失敗時にfalseを返す（必要に応じて変更）
      }
    } catch (e) {
      console.error('データ取得エラー: ' + e);
      return false; // エラー時もfalseを返す（必要に応じて変更）
    }
  }
}
