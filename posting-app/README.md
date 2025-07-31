# PostingApp

GPS軌跡記録・表示アプリケーション

## 機能概要

- リアルタイムGPS追跡と軌跡記録
- 距離ベースの軌跡分割による異常移動の防止
- ローカルストレージへの軌跡保存
- サーバーとの軌跡共有
- KMLレイヤーの表示
- **スリープ防止機能（Screen Wake Lock API）**

## スリープ防止機能

このアプリケーションでは、GPS記録中にデバイスの画面がスリープしないようにする機能を実装しています。

### 機能詳細

- **自動有効化**: GPS記録開始時に自動的にスリープ防止を有効化
- **自動解除**: GPS記録停止時に自動的にスリープ防止を解除
- **手動制御**: 設定画面でスリープ防止機能のON/OFF切り替えが可能
- **ブラウザ対応チェック**: 対応していないブラウザでは機能を無効化
- **ページ表示状態管理**: ページが隠れた時の自動解除と再表示時の復帰

### 使用方法

1. アプリケーション右下の歯車アイコンをクリックして設定画面を開く
2. 「スリープ防止」セクションの切り替えスイッチでON/OFF設定
3. GPS記録を開始すると自動的にスリープ防止が有効化される
4. 緑色のインジケーターでスリープ防止の状態を確認可能

### ブラウザ対応

Screen Wake Lock APIをサポートするモダンブラウザで利用可能：
- Chrome 84+
- Edge 84+
- Opera 70+
- Chrome for Android 84+

### 技術実装

- `WakeLockService`: Screen Wake Lock APIを管理するAngularサービス
- `MapComponent`: GPS記録とスリープ防止機能の統合
- 適切なリソース管理とクリーンアップ
- ページ表示状態変更の監視

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
