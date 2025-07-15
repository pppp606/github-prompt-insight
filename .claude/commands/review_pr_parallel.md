# PR並列レビュー実行・マージ

## 対象URL
#$ARGUMENTS

## フロー (Use Task Tool)
- [ ] gh コマンドを利用してPRの目的・主な変更点を取得
- [ ] レビュー実行し結果のJsonを取得
  - [ ] 子レビューコマンドを実行(1回目)
  - [ ] 子レビューコマンドを実行(2回目)
  - [ ] 子レビューコマンドを実行(3回目)
- [ ] 3回分のレビュー結果の全ての妥当性をultrathinkし検証
- [ ] 妥当なものだけをまとめ最終出力

## 子レビューコマンド

```bash
claude -p "$(cat .claude/commands/review_child.md | sed "s|{{PR_URL}}|#$ARGUMENTS|g") > .tmp/review_{{n}}.md"
```

** {{n}} には実行回数が入る

## 最終出力形式（Markdown）
````
### 📋 Summary
- **目的**: PR の目的
- **主な変更**: 変更内容の要約

---

### 🔍 Review Comments

#### 🏗️ 設計の妥当性

##### 🚨 [must] `app/models/sound.rb:61`
```ruby
def generate_email_html
  template_string = Rails.root.join('app/views/embed/sounds/email.html.haml').read
  # ...
end
```
**問題点**: 毎回ファイルを読み込んでテンプレートをコンパイルするのは非効率的です。

**提案**: テンプレートをキャッシュするか、パーシャルテンプレートを使用することを検討してください。

---

##### 💭 [imo] `app/models/sound.rb:65`
```ruby
template.render(Object.new, {...})
```
**問題点**: Object.newを使用するより、適切なコンテキストオブジェクトを作成するか、bindingを使用した方が意図が明確になります。

````

### カテゴリの日本語名
- 🏗️ 設計の妥当性: design
- 🤖 AIによる可読性: ai_readability
- ✅ テストの妥当性・網羅性: test
- 🔒 セキュリティの懸念: security
- ⚡ パフォーマンスの懸念: performance
- 🚧 保守性・拡張性: maintainability
- 📚 ドキュメント整備状況: docs
- 🛠️ エラー処理・例外対応: error_handling


### 📝 ラベル付けルール
- 🚨 **[must]**: 対応必須
- 💭 **[imo]**: 意見・提案  
- 🔧 **[nits]**: 些細な指摘
- ❓ **[ask]**: 質問・確認

### 📁 ファイルパス記載ルール
- ファイルパスは必ず `file/path/to/file.ts:行数` の形式で記載
- VSCodeのターミナルでクリック可能になるよう、コロン(:)で行数を指定
- 例: `app/models/user.rb:25`, `src/components/Button.tsx:10`

### 🎨 フォーマット要求
- 各指摘は明確に区切り線（---）で分離
- コードブロックは適切な言語指定で記載
- 問題点と提案を明確に分けて記載
- 絵文字を使用して視覚的に分かりやすく
- 観点ごとにセクションを分ける
