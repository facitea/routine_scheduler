import * as Vue from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import { loadModule } from "https://cdn.jsdelivr.net/npm/vue3-sfc-loader@0.9.5/dist/vue3-sfc-loader.esm.js";
import * as appCore from "../app.js?v=20260721h";

const options = {
  moduleCache: {
    vue: Vue,
  },
  async getFile(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${url} ${response.status}`);
    }
    return {
      getContentData: (asBinary) => (asBinary ? response.arrayBuffer() : response.text()),
    };
  },
  addStyle(textContent) {
    const style = Object.assign(document.createElement("style"), { textContent });
    const ref = document.head.getElementsByTagName("style")[0] || null;
    document.head.insertBefore(style, ref);
  },
};

try {
  window.__OFFICE_TOOLBOX_CORE__ = appCore;
  const App = await loadModule("/src/App.vue", options);
  Vue.createApp(App).mount("#app");
} catch (error) {
  const target = document.querySelector("#app");
  if (target) {
    target.innerHTML = `
      <div style="padding:24px;font-family:system-ui,sans-serif;white-space:pre-wrap;line-height:1.5">
        <strong>앱 로딩 오류</strong>
        <div style="margin-top:12px">${String(error?.stack || error)}</div>
      </div>
    `;
  }
  console.error(error);
}
