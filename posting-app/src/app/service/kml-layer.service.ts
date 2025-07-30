import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * KMLレイヤー情報インターフェース
 */
export interface KmlLayerInfo {
  id: string;
  name: string;
  url: string;
  visible: boolean;
  layer?: google.maps.KmlLayer;
}

/**
 * KMLレイヤー管理サービス
 * 
 * 機能：
 * - KMLレイヤーの追加・削除・表示切り替え
 * - URLの検証
 * - ローカルストレージでの設定保存
 * - Google Maps KmlLayer の管理
 */
@Injectable({
  providedIn: 'root'
})
export class KmlLayerService {
  private readonly storageKey = 'kml-layers';
  private layersSubject = new BehaviorSubject<KmlLayerInfo[]>([]);
  
  /** KMLレイヤー一覧のObservable */
  public layers$ = this.layersSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 新しいKMLレイヤーを追加
   * @param url KMLファイルのURL
   * @param name レイヤー名（省略時はURLから自動生成）
   * @returns 追加されたレイヤー情報、失敗時はnull
   */
  addLayer(url: string, name?: string): KmlLayerInfo | null {
    if (!this.isValidKmlUrl(url)) {
      return null;
    }

    const id = this.generateId();
    const layerName = name || this.extractNameFromUrl(url);
    
    const newLayer: KmlLayerInfo = {
      id,
      name: layerName,
      url: url,
      visible: true
    };

    const currentLayers = this.layersSubject.value;
    const updatedLayers = [...currentLayers, newLayer];
    
    this.layersSubject.next(updatedLayers);
    this.saveToStorage();
    
    return newLayer;
  }

  /**
   * KMLレイヤーを削除
   * @param id レイヤーID
   */
  removeLayer(id: string): void {
    const currentLayers = this.layersSubject.value;
    const layer = currentLayers.find(l => l.id === id);
    
    // Google Maps レイヤーが存在する場合は削除
    if (layer?.layer) {
      layer.layer.setMap(null);
    }
    
    const updatedLayers = currentLayers.filter(l => l.id !== id);
    this.layersSubject.next(updatedLayers);
    this.saveToStorage();
  }

  /**
   * レイヤーの表示/非表示を切り替え
   * @param id レイヤーID
   * @param visible 表示状態
   */
  toggleLayerVisibility(id: string, visible: boolean): void {
    const currentLayers = this.layersSubject.value;
    const updatedLayers = currentLayers.map(layer => {
      if (layer.id === id) {
        // Google Maps レイヤーの表示状態も更新
        if (layer.layer) {
          layer.layer.setMap(visible ? layer.layer.getMap() : null);
        }
        return { ...layer, visible };
      }
      return layer;
    });
    
    this.layersSubject.next(updatedLayers);
    this.saveToStorage();
  }

  /**
   * Google Maps レイヤーオブジェクトを設定
   * @param id レイヤーID
   * @param layer Google Maps KmlLayer オブジェクト
   */
  setGoogleMapsLayer(id: string, layer: google.maps.KmlLayer): void {
    const currentLayers = this.layersSubject.value;
    const updatedLayers = currentLayers.map(l => 
      l.id === id ? { ...l, layer } : l
    );
    this.layersSubject.next(updatedLayers);
  }

  /**
   * 現在のレイヤー一覧を取得
   * @returns KMLレイヤー情報配列
   */
  getLayers(): KmlLayerInfo[] {
    return this.layersSubject.value;
  }

  /**
   * KML URLの妥当性を検証
   * @param url 検証対象のURL
   * @returns 妥当な場合true
   */
  private isValidKmlUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // HTTPSまたはHTTPのみ許可
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Google My Maps URLの場合は特別処理
      if (url.includes('google.com/maps/d/')) {
        return true;
      }
      
      // KMLファイル拡張子のチェック
      if (urlObj.pathname.toLowerCase().endsWith('.kml')) {
        return true;
      }
      
      // KMZ（圧縮KML）ファイルのチェック
      if (urlObj.pathname.toLowerCase().endsWith('.kmz')) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * URLからレイヤー名を抽出
   * @param url KML URL
   * @returns 抽出されたレイヤー名
   */
  private extractNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Google My Maps の場合
      if (url.includes('google.com/maps/d/')) {
        return 'Google My Maps';
      }
      
      // ファイル名から拡張子を除去してレイヤー名とする
      const filename = urlObj.pathname.split('/').pop() || 'KMLレイヤー';
      return filename.replace(/\.(kml|kmz)$/i, '');
    } catch {
      return 'KMLレイヤー';
    }
  }

  /**
   * ユニークなIDを生成
   * @returns 生成されたID
   */
  private generateId(): string {
    return `kml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ローカルストレージからレイヤー情報を読み込み
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const layers: KmlLayerInfo[] = JSON.parse(stored);
        // Google Maps レイヤーオブジェクトは除外（シリアライズできないため）
        const cleanLayers = layers.map(layer => ({
          ...layer,
          layer: undefined
        }));
        this.layersSubject.next(cleanLayers);
      }
    } catch (error) {
      console.warn('KMLレイヤー設定の読み込みに失敗しました:', error);
    }
  }

  /**
   * レイヤー情報をローカルストレージに保存
   */
  private saveToStorage(): void {
    try {
      const layers = this.layersSubject.value;
      // Google Maps レイヤーオブジェクトは除外してシリアライズ
      const serializableLayers = layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        url: layer.url,
        visible: layer.visible
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(serializableLayers));
    } catch (error) {
      console.warn('KMLレイヤー設定の保存に失敗しました:', error);
    }
  }
}