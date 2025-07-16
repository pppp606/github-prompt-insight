# GitHub Prompt Insight

GitHub Markdownファイルに対してAIによる翻訳と要約機能を提供するChrome拡張機能です。

## 主な機能

- 🌐 **AI翻訳**: GitHub上のMarkdownコンテンツを任意の言語に翻訳
- 📋 **AI要約**: 長いドキュメントやコメントを簡潔に要約
- 🤖 **複数のLLMプロバイダー対応**: OpenAI、Anthropic、Google Geminiをサポート
- ⚡ **リアルタイム処理**: GitHubページ上で直接翻訳・要約結果を表示

## インストール方法

### 開発版のインストール

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/github-prompt-insight.git
cd github-prompt-insight
```

2. 依存関係をインストール
```bash
npm install
```

3. 拡張機能をビルド
```bash
npm run build
```

4. Chromeで拡張機能を読み込み
   - Chrome で `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効にする
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist` フォルダーを選択

## 設定

1. 拡張機能アイコンをクリックし、「⚙️ Settings」を選択
2. 以下の項目を設定：
   - **LLM Provider**: 使用するAIプロバイダー（OpenAI、Anthropic、Google）
   - **API Key**: 選択したプロバイダーのAPIキー
   - **Model** (オプション): 使用するモデル名
   - **Default Language**: 翻訳先のデフォルト言語

## 使い方

1. GitHubでMarkdownファイルまたはコメントを表示
2. Markdownコンテンツの右上に表示される以下のボタンをクリック：
   - 🌐 : コンテンツを設定した言語に翻訳
   - 📋 : コンテンツを要約

翻訳や要約の結果は、元のコンテンツの下に表示されます。

## 開発

### 開発サーバーの起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

## 技術スタック

- **Chrome Extension Manifest V3**
- **TypeScript**
- **Vite** - ビルドツール
- **LangChain** - LLM統合
- **対応LLMプロバイダー**:
  - OpenAI (GPT-3.5, GPT-4)
  - Anthropic (Claude)
  - Google (Gemini)

## プロジェクト構造

```
github-prompt-insight/
├── src/
│   ├── content.ts        # コンテンツスクリプト（メイン機能）
│   ├── background.ts     # バックグラウンドサービスワーカー
│   ├── llm.ts           # LLM統合ラッパー
│   ├── options.ts       # 設定ページ
│   ├── popup.html       # ポップアップUI
│   └── content.css      # スタイル定義
├── public/
│   ├── manifest.json    # Chrome拡張機能マニフェスト
│   └── icons/           # 拡張機能アイコン
└── dist/                # ビルド出力
```

## セキュリティ

- APIキーはChromeの同期ストレージに保存されます
- 拡張機能の権限はGitHubドメインとストレージAPIに限定されています
- APIキーは外部に送信されません

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更を行う場合は、まずissueを作成して変更内容について議論してください。