# Testing Instructions for Issue #8

## Manual Testing Guide

### Prerequisites
1. Build the extension: `npx vite build`
2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Test Cases

#### 1. Test Summary Positioning (Primary Feature)
1. Navigate to any GitHub repository with a README.md file
2. Configure the extension with a valid API key (Options page)
3. Click the "Summarize" button on the README content
4. **Expected Result**: The summary should appear **at the top** of the markdown content, not at the bottom
5. **Verify**: The summary has proper spacing below it (margin-bottom: 12px)

#### 2. Test Translation Positioning (Consistency)
1. On the same GitHub page, click the "Translate" button
2. **Expected Result**: The translation should also appear **at the top** of the markdown content
3. **Verify**: Both features use consistent positioning

#### 3. Test Result Replacement
1. Click "Summarize" button again
2. **Expected Result**: The old summary should be replaced with the new one (no duplicates)
3. **Verify**: Only one result div exists at the top

#### 4. Test Loading State
1. Click "Summarize" button and observe the loading state
2. **Expected Result**: The loading message should appear at the top
3. **Verify**: Loading state is consistent with final result placement

#### 5. Test Multiple Markdown Elements
1. Navigate to a GitHub issue or discussion with multiple markdown elements
2. Test both Summarize and Translate on different elements
3. **Expected Result**: Each element shows its result at the top of its respective content area

### Visual Verification
- Results should appear immediately visible without scrolling
- Spacing should look natural with margin-bottom
- No visual inconsistencies between Summary and Translation features
- Loading states should appear in the same position as final results

### Testing Files
- Run automated tests: `npx vitest run src/content.summary-positioning.test.ts`
- All tests should pass, confirming the implementation works correctly

## Notes
- This change improves UX by making results immediately visible
- Both Summary and Translation features maintain consistency
- No regression in existing functionality