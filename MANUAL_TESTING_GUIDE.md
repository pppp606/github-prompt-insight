# Manual Testing Guide: Multi-Language Summary Feature

## Overview
This guide provides comprehensive manual testing procedures for verifying the multi-language summary functionality in the GitHub Prompt Insight Chrome extension. The feature allows users to summarize GitHub markdown content in their preferred language as configured in the extension options.

## Prerequisites

### Extension Setup
1. Build the extension: `npm run build`
2. Load the unpacked extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Test Environment Requirements
- Chrome browser with the extension installed
- Access to GitHub.com
- Valid API keys for at least one LLM provider (OpenAI, Anthropic, or Google)
- GitHub repositories with markdown content for testing

## Test Data Repository
For consistent testing, use this repository with diverse markdown content:
- **Primary Test Repository**: `https://github.com/microsoft/vscode/blob/main/README.md`
- **Secondary Test Files**:
  - `https://github.com/facebook/react/blob/main/README.md`
  - `https://github.com/nodejs/node/blob/main/README.md`
  - `https://github.com/tensorflow/tensorflow/blob/main/README.md`

## Test Scenarios

### 1. Basic Language Configuration Test

#### Test Case 1.1: Set Default Language in Options
**Objective**: Verify that users can set their preferred language in the options page

**Steps**:
1. Right-click the extension icon and select "Options"
2. Configure the following settings:
   - **LLM Provider**: Select your preferred provider (OpenAI/Anthropic/Google)
   - **API Key**: Enter your valid API key
   - **Model**: (Optional) Leave blank for default or specify a model
   - **Default Language**: Set to "Japanese"
3. Click "Save Settings"
4. Verify the success message appears

**Expected Result**: Settings saved successfully with Japanese as default language

#### Test Case 1.2: Verify Language Persistence
**Objective**: Ensure language settings persist across browser sessions

**Steps**:
1. Complete Test Case 1.1 with Japanese as default language
2. Close Chrome completely
3. Reopen Chrome and navigate to the extension options
4. Verify the Default Language field shows "Japanese"

**Expected Result**: Language setting persists across browser sessions

### 2. Multi-Language Summary Testing

#### Test Case 2.1: Japanese Summary
**Objective**: Verify summaries are generated in Japanese

**Setup**:
- Default Language: Japanese
- Test URL: `https://github.com/microsoft/vscode/blob/main/README.md`

**Steps**:
1. Navigate to the test URL
2. Wait for the page to load completely
3. Locate the "Summarize" button near the file content
4. Click "Summarize"
5. Observe the loading message: "Summarizing in Japanese: ..."
6. Wait for the summary to complete

**Expected Result**:
- Loading message shows "Summarizing in Japanese"
- Summary result is displayed in Japanese characters (hiragana, katakana, kanji)
- Summary header shows "Summary in Japanese (X sentences)"
- Content is meaningful and represents the original markdown content

**Verification Checklist**:
- [ ] Loading message mentions Japanese
- [ ] Summary contains Japanese characters
- [ ] Summary is coherent and relevant
- [ ] Summary length is appropriate (2-3 sentences)
- [ ] Provider information is displayed

#### Test Case 2.2: Spanish Summary
**Objective**: Verify summaries are generated in Spanish

**Setup**:
1. Change Default Language to "Spanish" in options
2. Test URL: `https://github.com/facebook/react/blob/main/README.md`

**Steps**:
1. Navigate to extension options and change Default Language to "Spanish"
2. Save settings
3. Navigate to the test URL
4. Click "Summarize"
5. Observe the loading message: "Summarizing in Spanish: ..."
6. Wait for the summary to complete

**Expected Result**:
- Loading message shows "Summarizing in Spanish"
- Summary result is in Spanish language
- Summary header shows "Summary in Spanish (X sentences)"
- Content uses Spanish vocabulary and grammar

**Verification Checklist**:
- [ ] Loading message mentions Spanish
- [ ] Summary contains Spanish text
- [ ] Spanish grammar and vocabulary are used
- [ ] Summary is coherent and relevant
- [ ] No English text in the summary content

#### Test Case 2.3: French Summary
**Objective**: Verify summaries are generated in French

**Setup**:
1. Change Default Language to "French" in options
2. Test URL: `https://github.com/nodejs/node/blob/main/README.md`

**Steps**:
1. Navigate to extension options and change Default Language to "French"
2. Save settings
3. Navigate to the test URL
4. Click "Summarize"
5. Observe the loading message: "Summarizing in French: ..."
6. Wait for the summary to complete

**Expected Result**:
- Loading message shows "Summarizing in French"
- Summary result is in French language
- Summary header shows "Summary in French (X sentences)"
- Content uses French vocabulary and grammar

**Verification Checklist**:
- [ ] Loading message mentions French
- [ ] Summary contains French text
- [ ] French grammar and vocabulary are used
- [ ] Summary is coherent and relevant
- [ ] Proper French accents and characters are displayed

#### Test Case 2.4: German Summary
**Objective**: Verify summaries are generated in German

**Setup**:
1. Change Default Language to "German" in options
2. Test URL: `https://github.com/tensorflow/tensorflow/blob/main/README.md`

**Steps**:
1. Navigate to extension options and change Default Language to "German"
2. Save settings
3. Navigate to the test URL
4. Click "Summarize"
5. Observe the loading message: "Summarizing in German: ..."
6. Wait for the summary to complete

**Expected Result**:
- Loading message shows "Summarizing in German"
- Summary result is in German language
- Summary header shows "Summary in German (X sentences)"
- Content uses German vocabulary and grammar

**Verification Checklist**:
- [ ] Loading message mentions German
- [ ] Summary contains German text
- [ ] German grammar and vocabulary are used
- [ ] Summary is coherent and relevant
- [ ] German special characters (ä, ö, ü, ß) are displayed correctly

### 3. Fallback and Error Handling Tests

#### Test Case 3.1: English Fallback Test
**Objective**: Verify fallback to English when no language is configured

**Setup**:
1. Clear extension configuration (reinstall or reset)
2. Configure only LLM provider and API key
3. Leave Default Language empty or set to empty string

**Steps**:
1. Navigate to extension options
2. Configure LLM provider and API key
3. Leave Default Language field empty
4. Save settings
5. Navigate to test URL
6. Click "Summarize"

**Expected Result**:
- Loading message shows "Summarizing in English"
- Summary is generated in English
- Summary header shows "Summary in English (X sentences)"

#### Test Case 3.2: Invalid Language Handling
**Objective**: Verify system handles invalid language configurations gracefully

**Steps**:
1. Manually test with unsupported language (if possible through developer tools)
2. Observe system behavior

**Expected Result**:
- System should fallback to English
- No errors should prevent summarization

#### Test Case 3.3: API Error Handling
**Objective**: Verify proper error handling for API failures

**Setup**:
1. Configure with invalid API key
2. Or temporarily disable internet connection

**Steps**:
1. Set up invalid API key in options
2. Navigate to test URL
3. Click "Summarize"
4. Observe error handling

**Expected Result**:
- Clear error message displayed
- No system crashes
- User can retry after fixing configuration

### 4. Multi-Provider Language Testing

#### Test Case 4.1: OpenAI Multi-Language
**Objective**: Test multi-language summaries with OpenAI provider

**Setup**:
- Provider: OpenAI
- Model: gpt-3.5-turbo (or gpt-4)
- API Key: Valid OpenAI key

**Test Languages**: English, Japanese, Spanish, French
**Steps**: Repeat Test Cases 2.1-2.4 with OpenAI provider

#### Test Case 4.2: Anthropic Multi-Language
**Objective**: Test multi-language summaries with Anthropic provider

**Setup**:
- Provider: Anthropic
- Model: claude-3-sonnet-20240229
- API Key: Valid Anthropic key

**Test Languages**: English, Japanese, Spanish, French
**Steps**: Repeat Test Cases 2.1-2.4 with Anthropic provider

#### Test Case 4.3: Google Multi-Language
**Objective**: Test multi-language summaries with Google provider

**Setup**:
- Provider: Google
- Model: gemini-pro
- API Key: Valid Google key

**Test Languages**: English, Japanese, Spanish, French
**Steps**: Repeat Test Cases 2.1-2.4 with Google provider

### 5. Edge Cases and Stress Testing

#### Test Case 5.1: Large Content Summary
**Objective**: Test summarization of large markdown files

**Setup**:
- Use a large README file (>5000 characters)
- Test with different languages

**Steps**:
1. Navigate to a large markdown file
2. Click "Summarize"
3. Verify summary is generated in the configured language
4. Check that summary is appropriately condensed

#### Test Case 5.2: Code-Heavy Content
**Objective**: Test summarization of markdown with lots of code blocks

**Setup**:
- Use a README with significant code examples
- Test with different languages

**Steps**:
1. Navigate to a code-heavy markdown file
2. Click "Summarize"
3. Verify summary focuses on documentation, not code
4. Check language accuracy

#### Test Case 5.3: Rapid Language Switching
**Objective**: Test changing languages quickly and verifying immediate effect

**Steps**:
1. Set language to Japanese, summarize content
2. Immediately change to Spanish, summarize same content
3. Change to French, summarize same content
4. Verify each summary is in the correct language

### 6. User Experience Testing

#### Test Case 6.1: Loading States
**Objective**: Verify loading states show correct language information

**Verification Points**:
- Loading message displays target language
- Loading message shows content preview
- Loading time is reasonable (< 30 seconds)

#### Test Case 6.2: Result Formatting
**Objective**: Verify summary results are well-formatted

**Verification Points**:
- Summary header shows correct language
- Content is readable and well-formatted
- Provider information is displayed
- Original content preview is shown

#### Test Case 6.3: Button Integration
**Objective**: Verify Summarize button integrates well with GitHub UI

**Verification Points**:
- Button appears in correct location
- Button styling matches GitHub design
- Button is easily discoverable
- Button works on different GitHub page layouts

## Test Data Examples

### Expected Japanese Summary Example
**Original**: "Visual Studio Code is a lightweight but powerful source code editor..."
**Expected Japanese**: "Visual Studio Code は軽量でありながら強力なソースコードエディタです..."

### Expected Spanish Summary Example
**Original**: "React is a JavaScript library for building user interfaces..."
**Expected Spanish**: "React es una biblioteca de JavaScript para construir interfaces de usuario..."

### Expected French Summary Example
**Original**: "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine..."
**Expected French**: "Node.js est un environnement d'exécution JavaScript basé sur le moteur V8 de Chrome..."

### Expected German Summary Example
**Original**: "TensorFlow is an open source machine learning framework..."
**Expected German**: "TensorFlow ist ein Open-Source-Framework für maschinelles Lernen..."

## Test Execution Checklist

### Pre-Test Setup
- [ ] Extension built and loaded
- [ ] Valid API keys configured
- [ ] Test repositories identified
- [ ] Browser in clean state

### During Testing
- [ ] Record all test results
- [ ] Screenshot any issues
- [ ] Note response times
- [ ] Verify language accuracy
- [ ] Check error handling

### Post-Test Verification
- [ ] All test cases executed
- [ ] Results documented
- [ ] Issues identified and reported
- [ ] Performance metrics recorded

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Summary not in expected language
**Possible Causes**:
- Language setting not saved properly
- Browser cache issues
- API provider language limitations

**Solutions**:
1. Clear browser cache and reload
2. Verify settings are saved in options
3. Try different LLM provider
4. Check API key validity

#### Issue: Summarize button not appearing
**Possible Causes**:
- Not on GitHub blob page
- Page not fully loaded
- Extension not properly initialized

**Solutions**:
1. Ensure you're on a GitHub `/blob/` URL
2. Refresh the page
3. Check extension is enabled
4. Verify API configuration

#### Issue: API errors or timeouts
**Possible Causes**:
- Invalid API key
- Rate limiting
- Network connectivity

**Solutions**:
1. Verify API key in options
2. Wait and retry
3. Check internet connection
4. Try different LLM provider

## Test Report Template

```
Test Date: [Date]
Tester: [Name]
Extension Version: [Version]
Browser: [Chrome Version]

Test Results:
- Language Configuration: [Pass/Fail]
- Japanese Summary: [Pass/Fail]
- Spanish Summary: [Pass/Fail]
- French Summary: [Pass/Fail]
- German Summary: [Pass/Fail]
- Fallback Behavior: [Pass/Fail]
- Error Handling: [Pass/Fail]
- Multi-Provider Testing: [Pass/Fail]

Issues Found:
[List any issues with steps to reproduce]

Performance Notes:
[Response times, loading behavior, etc.]

Overall Assessment:
[Summary of test results and recommendations]
```

## Acceptance Criteria

The multi-language summary feature passes testing if:

1. **Language Configuration Works**: Users can set and persist language preferences
2. **Accurate Translation**: Summaries are generated in the configured language
3. **Proper Fallback**: System defaults to English when no language is configured
4. **Error Handling**: Graceful handling of API errors and invalid configurations
5. **Multi-Provider Support**: Feature works with OpenAI, Anthropic, and Google providers
6. **User Experience**: Loading states and results are clearly displayed
7. **Performance**: Summaries generate within reasonable time limits
8. **Compatibility**: Works across different GitHub page layouts and content types

By following this comprehensive testing guide, testers can thoroughly verify the multi-language summary functionality and ensure it meets user expectations across different languages and scenarios.