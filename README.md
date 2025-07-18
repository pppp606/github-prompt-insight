# GitHub Prompt Insight

GitHubで公開されているMarkdown形式のプロンプトファイルを要約するChrome拡張機能です。

## 主な機能

- 📋 **プロンプト要約特化**: Markdown形式で書かれたAIプロンプトの内容を効率的に要約
- 🌐 **多言語対応要約**: 設定した言語でプロンプトの要約を生成
- 🤖 **複数のLLMプロバイダー対応**: OpenAI、Anthropic、Google Geminiをサポート
- ⚡ **リアルタイム処理**: GitHubページ上で直接要約結果を表示

## 対象と制限

- **対象**: Markdown形式で書かれたAIプロンプトファイル
- **効果的な場面**: プロンプトエンジニアリング、プロンプトライブラリの閲覧
- **注意**: プロンプト以外の一般的な文書では期待した効果が得られない場合があります

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
   - **Default Language**: 要約結果のデフォルト言語（プロンプトがどの言語で書かれていても、設定した言語で要約が生成されます）

## 使い方

1. GitHubでMarkdown形式のプロンプトファイルを表示
2. プロンプトコンテンツの右上に表示される「Summarize」ボタンをクリック

要約結果は設定した言語で生成され、元のコンテンツの上に表示されます。

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