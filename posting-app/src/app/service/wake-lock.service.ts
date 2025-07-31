import { Injectable } from '@angular/core';

/**
 * Screen Wake Lock API を管理するサービス
 * 
 * 主な機能：
 * - デバイスの画面スリープを防止
 * - GPS記録中の継続的な画面表示の維持
 * - ブラウザ互換性の確認
 * - 適切なリソース管理とクリーンアップ
 */
@Injectable({
  providedIn: 'root'
})
export class WakeLockService {
  /** 現在のwake lockオブジェクト */
  private wakeLock: WakeLockSentinel | null = null;
  
  /** wake lockが有効かどうかのフラグ */
  private isActive = false;

  constructor() {}

  /**
   * Screen Wake Lock APIがサポートされているかチェック
   * @returns サポートされている場合はtrue
   */
  isSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  /**
   * wake lockが現在有効かどうか
   * @returns 有効な場合はtrue
   */
  get active(): boolean {
    return this.isActive && this.wakeLock !== null && !this.wakeLock.released;
  }

  /**
   * Screen Wake Lockを要求してデバイスのスリープを防止
   * @returns 成功時はtrue、失敗時はfalse
   */
  async requestWakeLock(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Screen Wake Lock API はこのブラウザではサポートされていません');
      return false;
    }

    // 既にwake lockが有効な場合は何もしない
    if (this.active) {
      return true;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.isActive = true;

      // wake lockが解除された時のイベントリスナーを設定
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake lock が解除されました');
        this.isActive = false;
      });

      console.log('Wake lock が有効になりました');
      return true;
    } catch (error) {
      console.error('Wake lock の要求に失敗しました:', error);
      this.isActive = false;
      return false;
    }
  }

  /**
   * Screen Wake Lockを解除してデバイスのスリープを許可
   * @returns 成功時はtrue、失敗時はfalse
   */
  async releaseWakeLock(): Promise<boolean> {
    if (!this.wakeLock || this.wakeLock.released) {
      this.isActive = false;
      return true;
    }

    try {
      await this.wakeLock.release();
      this.wakeLock = null;
      this.isActive = false;
      console.log('Wake lock が解除されました');
      return true;
    } catch (error) {
      console.error('Wake lock の解除に失敗しました:', error);
      return false;
    }
  }

  /**
   * ページの可視性が変更された時のハンドラー
   * ページが隠れた時にwake lockは自動的に解除され、
   * ページが再び表示された時に必要に応じて再取得する
   */
  async handleVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && this.isActive && (!this.wakeLock || this.wakeLock.released)) {
      // ページが再び表示され、wake lockが必要な状態だが解除されている場合は再取得
      await this.requestWakeLock();
    }
  }
}