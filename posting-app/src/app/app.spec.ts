import { TestBed } from '@angular/core/testing';
import { App } from './app';

/**
 * メインアプリケーションコンポーネントのユニットテスト
 * 
 * テスト対象：
 * - アプリコンポーネントの基本的な生成
 * - メイン要素のレンダリング
 * - localStorage の無限プロンプトループ回避
 */
describe('App', () => {
  beforeEach(async () => {
    // localStorage をモック化して無限プロンプトループを防止
    // ユーザー名が未設定の場合の prompt() 呼び出しを回避
    spyOn(localStorage, 'getItem').and.returnValue('test-user');
    spyOn(localStorage, 'setItem').and.stub();
    
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    // アプリコンポーネントの基本的な生成テスト
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render main element', () => {
    // メイン要素の正常なレンダリング確認
    // アプリケーションの基本構造が正しく表示されることをテスト
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main.main')).toBeTruthy();
  });
});
