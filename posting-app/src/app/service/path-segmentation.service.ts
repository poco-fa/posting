import { Injectable } from '@angular/core';

/**
 * GPS座標を表すインターフェース
 * Google Maps APIのLatLngLiteralと互換性あり
 */
export interface LatLng {
  /** 緯度（度）：-90 から 90 の範囲 */
  lat: number;
  /** 経度（度）：-180 から 180 の範囲 */
  lng: number;
}

/**
 * GPS軌跡の一つのセグメント（連続する点群）を表すインターフェース
 * セグメント間は直線で接続されず、独立した軌跡として描画される
 */
export interface PathSegment {
  /** セグメントを構成するGPS座標の配列（2点以上） */
  points: LatLng[];
}

/**
 * GPS軌跡の距離ベース分割サービス
 * 
 * GPS信号不良や画面ロック時に発生する遠隔地への異常な移動を検出し、
 * 軌跡を適切なセグメントに分割することで、非現実的な長距離接続を防ぐ。
 * 
 * 主な機能：
 * - ハーベルサイン公式による正確な GPS 座標間距離計算
 * - 設定可能な距離閾値による軌跡分割
 * - 地図上での分割された軌跡の個別描画サポート
 */
@Injectable({
  providedIn: 'root'
})
export class PathSegmentationService {
  /**
   * 最大距離閾値（メートル単位）
   * 
   * 連続するGPS点間の距離がこの値を超える場合、軌跡を分割する。
   * 1km（1000m）は以下の根拠に基づく：
   * - 徒歩での一般的な移動速度: 4-6 km/h
   * - GPS記録間隔: 通常数秒〜1分程度
   * - 想定される最大合理的移動距離: 1分間で約100m程度
   * - 安全マージンを考慮して1kmに設定
   */
  readonly maxDistanceThreshold = 1000; // 1km

  /**
   * ハーベルサイン公式を使用して2つのGPS座標間の距離を計算
   * 
   * ハーベルサイン公式は球面上の2点間の最短距離（大円距離）を
   * 緯度・経度から計算する標準的な手法。地球を完全な球体として
   * 近似するため、数メートル程度の誤差があるが、GPS追跡用途には十分。
   * 
   * @param point1 起点のGPS座標
   * @param point2 終点のGPS座標
   * @returns 2点間の距離（メートル単位）
   */
  calculateDistance(point1: LatLng, point2: LatLng): number {
    // 地球の半径（メートル単位）
    // WGS84楕円体の平均半径を使用
    const R = 6371000; 
    
    // 度をラジアンに変換
    const lat1Rad = point1.lat * Math.PI / 180;
    const lat2Rad = point2.lat * Math.PI / 180;
    const deltaLatRad = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;

    // ハーベルサイン公式の実装
    // a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    // c = 2 × atan2(√a, √(1−a))
    // 球面上の中心角を計算
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // distance = R × c
    // 半径に中心角を掛けて実際の距離を算出
    return R * c;
  }

  /**
   * GPS軌跡を距離に基づいてセグメントに分割
   * 
   * アルゴリズム：
   * 1. 軌跡の最初の点から新しいセグメントを開始
   * 2. 連続する点間の距離を計算
   * 3. 距離が閾値以下なら同一セグメントに追加
   * 4. 距離が閾値を超える場合、現在のセグメントを保存し新しいセグメントを開始
   * 5. 最後のセグメントを保存
   * 
   * 利点：
   * - GPS信号不良による異常な跳躍を検出・分離
   * - 合理的な移動軌跡のみを線で接続
   * - 地図上で視覚的に分かりやすい表示
   * 
   * @param points 分割対象のGPS座標配列
   * @returns 分割されたパスセグメントの配列（各セグメントは2点以上を含む）
   */
  createPathSegments(points: LatLng[]): PathSegment[] {
    // 空配列または1点のみの場合はセグメント生成不可
    if (points.length <= 1) return [];

    const segments: PathSegment[] = [];
    let currentSegment: LatLng[] = [points[0]]; // 最初の点でセグメント開始

    // 2番目の点から順次処理
    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(points[i - 1], points[i]);
      
      if (distance <= this.maxDistanceThreshold) {
        // 距離が閾値以下：現在のセグメントに追加
        // 合理的な移動として扱い、線で接続
        currentSegment.push(points[i]);
      } else {
        // 距離が閾値を超過：セグメント分割
        // GPS異常や長距離移動として扱い、線を切断
        if (currentSegment.length > 1) {
          // 現在のセグメントが2点以上なら保存
          segments.push({ points: [...currentSegment] });
        }
        // 新しいセグメントを開始
        currentSegment = [points[i]];
      }
    }

    // 最後のセグメントを保存
    // 2点以上あれば線として描画可能
    if (currentSegment.length > 1) {
      segments.push({ points: [...currentSegment] });
    }

    return segments;
  }
}