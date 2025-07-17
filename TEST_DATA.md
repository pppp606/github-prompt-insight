# Test Data for Multi-Language Summary Feature

## Test Content Samples

### Sample 1: VS Code README Content
**Source**: https://github.com/microsoft/vscode/blob/main/README.md
**Content Type**: Technical documentation
**Length**: ~500 words

**Original Text**:
```
Visual Studio Code is a lightweight but powerful source code editor which runs on your desktop and is available for Windows, macOS and Linux. It comes with built-in support for JavaScript, TypeScript and Node.js and has a rich ecosystem of extensions for other languages and runtimes (such as C++, C#, Java, Python, PHP, Go, .NET). Begin your journey with VS Code with these introductory videos.

VS Code is built on Electron and uses a combination of HTML, CSS, and JavaScript for the user interface. The editor is based on Monaco Editor, which is also used by Azure DevOps. VS Code has a powerful extension API that allows developers to add languages, themes, debuggers, and tools to support their development workflow.
```

**Expected Summaries**:

**Japanese** (Expected):
```
Visual Studio Code は Windows、macOS、Linux で動作する軽量で強力なソースコードエディタです。JavaScript、TypeScript、Node.js のサポートが組み込まれており、他の言語やランタイム用の豊富な拡張機能エコシステムを持っています。VS Code は Electron 上に構築され、Monaco Editor をベースとした強力な拡張 API を提供しています。
```

**Spanish** (Expected):
```
Visual Studio Code es un editor de código fuente liviano pero potente que funciona en Windows, macOS y Linux. Viene con soporte integrado para JavaScript, TypeScript y Node.js, y tiene un ecosistema rico de extensiones para otros lenguajes. VS Code está construido sobre Electron y utiliza Monaco Editor como base, proporcionando una API de extensiones poderosa para desarrolladores.
```

**French** (Expected):
```
Visual Studio Code est un éditeur de code source léger mais puissant qui fonctionne sur Windows, macOS et Linux. Il dispose d'un support intégré pour JavaScript, TypeScript et Node.js, ainsi que d'un écosystème riche d'extensions pour d'autres langages. VS Code est construit sur Electron et utilise Monaco Editor comme base, offrant une API d'extensions puissante.
```

**German** (Expected):
```
Visual Studio Code ist ein leichtgewichtiger aber mächtiger Quellcode-Editor, der auf Windows, macOS und Linux läuft. Er verfügt über eingebaute Unterstützung für JavaScript, TypeScript und Node.js sowie ein reiches Ökosystem von Erweiterungen für andere Sprachen. VS Code basiert auf Electron und verwendet Monaco Editor als Grundlage, mit einer mächtigen Erweiterungs-API.
```

### Sample 2: React README Content
**Source**: https://github.com/facebook/react/blob/main/README.md
**Content Type**: Library documentation
**Length**: ~300 words

**Original Text**:
```
React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components". React has a few different kinds of components, but we'll start with React.Component subclasses. React components implement a render() method that takes input data and returns what to display. This example uses an XML-like syntax called JSX.

React can also render on the server using Node.js and power mobile apps using React Native. React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.
```

**Expected Summaries**:

**Japanese** (Expected):
```
React は、コンポーネントと呼ばれる小さく独立したコード部品から複雑な UI を構築するための JavaScript ライブラリです。React は JSX という XML 風の構文を使用し、render() メソッドを実装してデータを表示します。React は Node.js を使用してサーバーでのレンダリングや React Native を使用したモバイルアプリの開発も可能で、データの変更時に効率的にコンポーネントを更新します。
```

**Spanish** (Expected):
```
React es una biblioteca de JavaScript para construir interfaces de usuario a partir de pequeños componentes aislados. Utiliza una sintaxis similar a XML llamada JSX y implementa un método render() para mostrar datos. React puede renderizar en el servidor usando Node.js y alimentar aplicaciones móviles con React Native, actualizando eficientemente los componentes cuando los datos cambian.
```

**French** (Expected):
```
React est une bibliothèque JavaScript pour construire des interfaces utilisateur à partir de petits composants isolés appelés "components". Il utilise une syntaxe similaire à XML appelée JSX et implémente une méthode render() pour afficher les données. React peut également effectuer le rendu côté serveur avec Node.js et alimenter des applications mobiles avec React Native.
```

**German** (Expected):
```
React ist eine JavaScript-Bibliothek zum Erstellen von Benutzeroberflächen aus kleinen, isolierten Code-Teilen namens "Komponenten". Es verwendet eine XML-ähnliche Syntax namens JSX und implementiert eine render()-Methode zur Datenanzeige. React kann auch serverseitig mit Node.js rendern und mobile Apps mit React Native antreiben, wobei Komponenten effizient aktualisiert werden.
```

### Sample 3: TensorFlow README Content
**Source**: https://github.com/tensorflow/tensorflow/blob/main/README.md
**Content Type**: Machine learning framework
**Length**: ~400 words

**Original Text**:
```
TensorFlow is an open source machine learning framework for everyone. TensorFlow offers stable Python and C++ APIs, as well as non-guaranteed backwards compatible APIs for other languages. TensorFlow provides multiple levels of abstraction so you can choose the right one for your needs. Build and train models by using the high-level Keras API, which makes getting started with machine learning and TensorFlow easier.

For production environments, use TensorFlow Serving for serving machine learning models. TensorFlow Lite enables on-device machine learning on mobile and embedded devices. TensorFlow Extended (TFX) provides a platform for machine learning pipelines suitable for production ML workflows.
```

**Expected Summaries**:

**Japanese** (Expected):
```
TensorFlow は、すべての人のためのオープンソース機械学習フレームワークです。安定した Python と C++ API を提供し、高レベルの Keras API を使用してモデルの構築と訓練を簡単に行うことができます。TensorFlow Serving による本番環境でのモデル提供、TensorFlow Lite によるモバイル・組み込みデバイスでの機械学習、TFX による本番 ML ワークフロー向けのプラットフォームを提供します。
```

**Spanish** (Expected):
```
TensorFlow es un framework de aprendizaje automático de código abierto para todos. Ofrece APIs estables de Python y C++, y facilita comenzar con el aprendizaje automático usando la API de alto nivel Keras. Para entornos de producción, TensorFlow Serving permite servir modelos, TensorFlow Lite habilita ML en dispositivos móviles, y TFX proporciona una plataforma para pipelines de ML en producción.
```

**French** (Expected):
```
TensorFlow est un framework d'apprentissage automatique open source pour tous. Il offre des APIs stables Python et C++, et facilite les débuts en apprentissage automatique avec l'API haut niveau Keras. Pour la production, TensorFlow Serving sert les modèles, TensorFlow Lite permet le ML sur appareils mobiles, et TFX fournit une plateforme pour les pipelines ML de production.
```

**German** (Expected):
```
TensorFlow ist ein Open-Source-Framework für maschinelles Lernen für alle. Es bietet stabile Python- und C++-APIs und erleichtert den Einstieg in maschinelles Lernen mit der High-Level-Keras-API. Für Produktionsumgebungen dient TensorFlow Serving zum Bereitstellen von Modellen, TensorFlow Lite ermöglicht ML auf mobilen Geräten, und TFX bietet eine Plattform für ML-Pipelines in der Produktion.
```

### Sample 4: Node.js README Content
**Source**: https://github.com/nodejs/node/blob/main/README.md
**Content Type**: Runtime documentation
**Length**: ~350 words

**Original Text**:
```
Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world. Node.js applications are written in JavaScript and can be run on OS X, Microsoft Windows, and Linux.

Node.js is designed to build scalable network applications. In the traditional blocking I/O model, each connection spawns a new thread, which can quickly consume system memory. Node.js operates on a single-thread event loop, making it capable of handling thousands of concurrent connections efficiently.
```

**Expected Summaries**:

**Japanese** (Expected):
```
Node.js は Chrome の V8 JavaScript エンジン上に構築された JavaScript ランタイムです。イベント駆動・ノンブロッキング I/O モデルを使用して軽量で効率的であり、世界最大のオープンソースライブラリエコシステムである npm を持っています。Node.js はスケーラブルなネットワークアプリケーションを構築するために設計されており、シングルスレッドのイベントループで数千の同時接続を効率的に処理できます。
```

**Spanish** (Expected):
```
Node.js es un runtime de JavaScript construido sobre el motor V8 de Chrome. Utiliza un modelo de I/O sin bloqueo y orientado a eventos que lo hace liviano y eficiente, con npm como el ecosistema más grande de bibliotecas de código abierto del mundo. Node.js está diseñado para construir aplicaciones de red escalables, operando en un bucle de eventos de un solo hilo para manejar miles de conexiones concurrentes eficientemente.
```

**French** (Expected):
```
Node.js est un runtime JavaScript construit sur le moteur V8 de Chrome. Il utilise un modèle d'I/O non-bloquant et orienté événements qui le rend léger et efficace, avec npm comme le plus grand écosystème de bibliothèques open source au monde. Node.js est conçu pour construire des applications réseau évolutives, fonctionnant sur une boucle d'événements à thread unique pour gérer efficacement des milliers de connexions simultanées.
```

**German** (Expected):
```
Node.js ist eine JavaScript-Laufzeitumgebung, die auf Chromes V8-JavaScript-Engine basiert. Es verwendet ein ereignisgesteuertes, nicht-blockierendes I/O-Modell, das es leichtgewichtig und effizient macht, mit npm als dem weltweit größten Ökosystem für Open-Source-Bibliotheken. Node.js ist für skalierbare Netzwerkanwendungen konzipiert und arbeitet mit einer Single-Thread-Event-Loop, um Tausende gleichzeitiger Verbindungen effizient zu handhaben.
```

## Quality Assessment Criteria

### Language Accuracy Verification

**For Japanese Summaries**:
- [ ] Uses appropriate Japanese characters (hiragana, katakana, kanji)
- [ ] Maintains proper Japanese sentence structure
- [ ] Uses technical terms appropriately (e.g., ライブラリ for library, フレームワーク for framework)
- [ ] Includes appropriate particles (は, が, を, に, で, etc.)
- [ ] Ends with appropriate sentence endings (です, ます, である, etc.)

**For Spanish Summaries**:
- [ ] Uses correct Spanish grammar and verb conjugations
- [ ] Includes appropriate accents and special characters (á, é, í, ó, ú, ñ)
- [ ] Uses proper Spanish technical vocabulary
- [ ] Maintains Spanish sentence structure and word order
- [ ] Uses appropriate articles (el, la, los, las, un, una)

**For French Summaries**:
- [ ] Uses correct French grammar and verb conjugations
- [ ] Includes appropriate accents and special characters (à, é, è, ç, ô, etc.)
- [ ] Uses proper French technical vocabulary
- [ ] Maintains French sentence structure
- [ ] Uses appropriate articles (le, la, les, un, une, des)

**For German Summaries**:
- [ ] Uses correct German grammar and noun declensions
- [ ] Includes appropriate German characters (ä, ö, ü, ß)
- [ ] Uses proper German technical vocabulary
- [ ] Maintains German sentence structure (including verb placement)
- [ ] Uses appropriate articles (der, die, das, ein, eine)

### Content Quality Verification

**For All Languages**:
- [ ] Summary captures main concepts from original text
- [ ] Summary is concise (2-3 sentences as configured)
- [ ] Summary maintains technical accuracy
- [ ] Summary flows logically and coherently
- [ ] Summary avoids redundancy and unnecessary details

### Common Issues to Watch For

**Language-Specific Issues**:
- **Japanese**: Mixing hiragana/katakana inappropriately, incorrect kanji usage
- **Spanish**: Missing accents, incorrect verb conjugations, wrong gender articles
- **French**: Incorrect accent marks, wrong verb forms, improper liaison
- **German**: Incorrect capitalization, wrong article usage, improper compound words

**Technical Issues**:
- English terms mixed into foreign language summaries
- Incorrect translation of technical terms
- Loss of meaning during translation
- Overly literal translations that don't flow naturally

## Test Execution Tips

### Before Testing
1. Clear browser cache to ensure clean state
2. Verify extension is properly loaded and configured
3. Have Google Translate or another translation service available for verification
4. Take screenshots of configurations and results

### During Testing
1. Test each language with multiple content samples
2. Verify loading messages show correct language
3. Check that summaries are grammatically correct
4. Confirm technical terms are properly translated
5. Note any inconsistencies or errors

### After Testing
1. Compare results with expected outputs
2. Verify language accuracy using native speakers if possible
3. Document any issues with specific content types
4. Test edge cases and error scenarios
5. Verify fallback behavior works correctly

## Performance Benchmarks

### Expected Response Times
- **Short content (<500 words)**: 5-15 seconds
- **Medium content (500-1500 words)**: 10-25 seconds
- **Long content (>1500 words)**: 15-35 seconds

### Quality Metrics
- **Accuracy**: >90% of technical terms correctly translated
- **Fluency**: Summaries should read naturally in target language
- **Completeness**: All main points from original should be represented
- **Conciseness**: Summary should be significantly shorter than original

## Troubleshooting Reference

### Common Error Messages and Solutions

**"Text to summarize cannot be empty"**
- Solution: Ensure the markdown content has loaded fully before clicking summarize

**"Invalid API key"**
- Solution: Verify API key is correct and has necessary permissions

**"Rate limit exceeded"**
- Solution: Wait 60 seconds before retrying

**"Summarization failed"**
- Solution: Check internet connection and try again

**"Default language is required"**
- Solution: Set a default language in the extension options

### Language-Specific Troubleshooting

**Japanese Issues**:
- Mojibake (garbled characters): Check browser encoding settings
- Mixed languages: Verify API provider supports Japanese properly

**Spanish Issues**:
- Missing accents: Check browser font rendering
- Incorrect grammar: May indicate poor API training data

**French Issues**:
- Accent rendering problems: Check browser font support
- Anglicisms: May indicate insufficient French training

**German Issues**:
- Capitalization errors: Check if API properly handles German noun capitalization
- Compound word issues: Verify proper German word formation

This test data provides concrete examples and verification criteria for thorough testing of the multi-language summary feature across different content types and languages.