# OpenAI O1モデルのmax_tokensパラメータエラーの修正

## 問題の概要
OpenAIのO1モデル（o1-mini、o1-preview）を使用すると、以下のエラーが発生します：
```
Summarization failed: LLM generation failed: 400 Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.
```

## 原因
- OpenAIは2024年9月にO1モデルシリーズをリリースし、これらのモデルでは `max_tokens` パラメータが非推奨となり、代わりに `max_completion_tokens` を使用する必要があります
- 現在のコード（`src/llm.ts:44`）では、すべてのOpenAIモデルに対して一律に `maxTokens` パラメータを使用しているため、O1モデルで動作しません

## 影響範囲
- OpenAI O1モデル（o1-mini、o1-preview）を使用するすべてのユーザー
- テキストの翻訳・要約機能が完全に使用不可

## 修正方針

### 1. モデル判定ロジックの追加
O1モデルかどうかを判定する処理を追加：
```typescript
private isO1Model(modelName: string): boolean {
  return modelName.startsWith('o1-') || modelName.includes('o1-mini') || modelName.includes('o1-preview');
}
```

### 2. OpenAI LLM作成時の条件分岐
`src/llm.ts` の `createLLM` メソッドで、O1モデルとその他のモデルで異なるパラメータを使用：

```typescript
case "openai":
  const modelName = config.model || "gpt-3.5-turbo";
  
  if (this.isO1Model(modelName)) {
    // O1モデルの場合：max_completion_tokensを使用
    // 注：LangChainが対応していない場合は、直接OpenAI SDKを使用する必要がある可能性
    return new ChatOpenAI({
      openAIApiKey: config.apiKey,
      modelName: modelName,
      temperature: config.temperature || 0.7,
      configuration: {
        baseOptions: {
          defaultQuery: {
            max_completion_tokens: config.maxTokens || 8192
          }
        }
      }
    });
  } else {
    // 従来のモデルの場合：maxTokensを使用
    return new ChatOpenAI({
      openAIApiKey: config.apiKey,
      modelName: modelName,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 8192,
    });
  }
```

### 3. LangChainのバージョン確認と代替実装
- 現在のLangChainバージョンがO1モデルのパラメータに対応しているか確認
- 対応していない場合は、OpenAI SDKを直接使用する実装も検討

### 4. オプションページでの注意事項追加
O1モデルを選択した際の注意事項をユーザーに表示することを検討

## テスト項目
1. 既存のモデル（GPT-3.5、GPT-4など）が引き続き正常に動作すること
2. O1モデル（o1-mini、o1-preview）でエラーが発生しないこと
3. 両方のモデルタイプで翻訳・要約機能が正常に動作すること

## 参考情報
- [OpenAI O1モデルドキュメント](https://platform.openai.com/docs/models/o1)
- エラーメッセージが明確にパラメータ名の変更を示している
- 他のプロバイダー（Anthropic、Google）は影響を受けない