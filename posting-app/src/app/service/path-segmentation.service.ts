import { Injectable } from '@angular/core';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PathSegment {
  points: LatLng[];
}

@Injectable({
  providedIn: 'root'
})
export class PathSegmentationService {
  // 最大距離閾値（メートル） - この距離を超える場合は線を繋がない
  readonly maxDistanceThreshold = 1000; // 1km

  /**
   * ハーベルサイン公式を使用して2つのGPS座標間の距離を計算（メートル単位）
   */
  calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371000; // 地球の半径（メートル）
    const lat1Rad = point1.lat * Math.PI / 180;
    const lat2Rad = point2.lat * Math.PI / 180;
    const deltaLatRad = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * パスを距離に基づいてセグメントに分割
   * 連続する点の距離が閾値を超える場合、新しいセグメントを開始
   */
  createPathSegments(points: LatLng[]): PathSegment[] {
    if (points.length <= 1) return [];

    const segments: PathSegment[] = [];
    let currentSegment: LatLng[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(points[i - 1], points[i]);
      
      if (distance <= this.maxDistanceThreshold) {
        // 距離が閾値以下の場合、現在のセグメントに追加
        currentSegment.push(points[i]);
      } else {
        // 距離が閾値を超える場合、現在のセグメントを保存し新しいセグメントを開始
        if (currentSegment.length > 1) {
          segments.push({ points: [...currentSegment] });
        }
        currentSegment = [points[i]];
      }
    }

    // 最後のセグメントを追加
    if (currentSegment.length > 1) {
      segments.push({ points: [...currentSegment] });
    }

    return segments;
  }
}