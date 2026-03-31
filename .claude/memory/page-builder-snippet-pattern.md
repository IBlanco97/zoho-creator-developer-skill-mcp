---
name: Page Builder HTML Snippet embed pattern
description: How to programmatically embed an HTML Snippet (dsp element) into a Zoho Creator page via API — the storeFunction + updateTemplateContent two-step pattern
type: feedback
---

## Pattern: Embed HTML Snippet in Page Builder via API

**Why:** Drag-and-drop in Playwright fails on complex canvas UIs. The UI calls two APIs in sequence that can be replicated directly.

**How to apply:** Use this whenever you need to add a new HTML Snippet to a Zoho Creator page programmatically.

---

### Step 1 — Call `storeFunction` to create the snippet

```javascript
const snippetCode = `htmlpage SnippetLinkName(param1,param2)
displayname="SnippetLinkName"
content
<%{
  html_ = thisapp.Namespace.FunctionName();
  %>
<%=html_%>
<%
}%>`;

const params = new URLSearchParams({
  appLinkName: BuilderConstants.appLinkName,
  text: snippetCode,
  zohoruntime: Date.now().toString(),
  zccpn: BuilderConstants.csrfparamValue,
  parentPageId: BuilderConstants.pageComponentId,  // ← page's componentId
  scripttype: 'htmlpageadd'
});

const resp = await fetch(PageUrls.getStoreFunctionURL(), {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params.toString()
});
const result = JSON.parse(await resp.text());
// result.htmlViewId  ← use in step 2
// result.htmlViewLinkName
// result.workflowid
```

### Step 2 — Immediately call `updateTemplateContent` with `newElemType=html_snippet`

```javascript
const currentZml = PageBuilder.getZmlContent();
const dspRow = `<row id="row_N"><column width="100%"><dsp id="${result.htmlViewLinkName}" htmlViewId="${result.htmlViewId}" bgColor="#FFFFFF" elementName="My Snippet"/></column></row>`;
const modifiedZml = currentZml.replace('</layout></zml>', dspRow + '</layout></zml>');
const processedZml = ZCPageDataObj.changeParamValuesToIDs(modifiedZml);

const body = 'pageContent=' + encodeURIComponent(processedZml)
           + '&newElemType=html_snippet'    // ← CRITICAL — without this → {"status":"Failed!"}
           + '&trackingType=html_snippet'
           + '&' + $PB.component.getCSRFParam();

const resp2 = await fetch(BuilderConstants.URL, {  // .../pageName/updateTemplateContent
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body
});
const saved = await resp2.text();
// {"status":"Saved"} = success
```

---

### Critical rules

1. **Both calls must be in the SAME browser session** — a `storeFunction` result from a previous session is invalid. The server does not recognize old `htmlViewId`s from prior navigation.
2. **`newElemType=html_snippet` is mandatory** in the `updateTemplateContent` POST body. Without it, the server returns `{"status":"Failed!"}`.
3. **`parentPageId` must be `BuilderConstants.pageComponentId`** (the page's component ID, not `pageFuncWfId`).
4. **Must navigate to the target page's Page Builder first** (`/pagebuilder/{pageLinkName}/edit`) so `BuilderConstants` and `PageUrls` are initialized for that page.
5. **The `htmlpage` header must match the page's parameters** in the signature (`htmlpage Name(param1,param2)` where param names match `BuilderConstants.parameters`).

### The `<dsp>` element format
```xml
<dsp id="SnippetLinkName" htmlViewId="4790826000001031053" bgColor="#FFFFFF" elementName="Display Name"/>
```
- `id` = the `htmlViewLinkName` returned by `storeFunction`
- `htmlViewId` = the `htmlViewId` returned by `storeFunction`

### Why the prior session failed (lesson learned)
In prior session: `storeFunction` was called to get `htmlViewId=4790826000001031047`, then the session navigated away. In the new session, `updateTemplateContent` was called with the old `htmlViewId` but returned `{"status":"Failed!"}`. Root cause: the server invalidates the `htmlViewId` association if `updateTemplateContent` isn't called in the same session immediately after `storeFunction`.
