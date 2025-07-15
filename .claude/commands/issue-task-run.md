---
description: Github Issueからタスクを実行し、プルリクエスト作成します[/issue-task-run xxx]
---

## context

- Pull Requestテンプレート
  @.github/PULL_REQUEST_TEMPLATE.md

## 処理フロー

### タスク作成 (Task Tool使用)
- github issue #$ARGUMENTS を参照
- このissueの内容を良く理解してタスク化してください
- TDDメソッドを使用してタスク化
- タスクはTodosで保持
- 作成したtodoをissueのコメントに追加

### 初期設定 (Task Tool使用)
- `git fetch -a -p` を実行
- origin/mainからブランチを作成
- [skip ci]付きの空コミット作成
- pull request作成（todoをチェックリスト化）
  - pull requestのテンプレート: @.github/PULL_REQUEST_TEMPLATE.md

### タスク実行 (各処理でTask Tool個別使用)
- 各タスクを順次実行
- 完了後にコミット・プッシュ
- PRチェックリストを更新（ `- [ ]` → `- [x]` ）
- 未完了タスクがなくなるまで繰り返し
- タスクの戻り値として、実施した内容とPR更新結果を報告
- 次のタスクの実行に必要な情報は、それまでに実行したタスクの戻り値等を適切に使用する
- 全部終わったらプッシュ
	