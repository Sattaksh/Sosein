/* =========================================================
   SOSEIN SEARCH — CLEAN, FINAL, WORKING SCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ===================== GLOBAL STATE ===================== */
  const $ = id => document.getElementById(id);

  const searchBox = $("searchBox");
  const searchBtn = $("searchBtn");
  const voiceBtn  = $("voiceBtn");
  const clearBtn  = $("clearBtn");
  const suggUL    = $("suggestions");
  const results   = $("results");
  const loading   = $("loading");
  const historyUL = $("history");
  const clearHist = $("clearHistory");
  const themeTgl  = $("themeToggle");
  const back2Top  = $("backToTop");

  let CURRENT_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";
  let uploadedImageData = null;
  let LAST_WIKI_SUGGESTIONS = [];
  let LAST_QUERY_FROM_SUGGESTION = false;

  /* ===================== THEME ===================== */
  if (localStorage.theme === "dark") document.body.classList.add("dark");
  themeTgl.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.theme = document.body.classList.contains("dark") ? "dark" : "light";
  };

  /* ===================== INPUT UX ===================== */
  searchBox.addEventListener("input", () => {
    clearBtn.style.display = searchBox.value ? "block" : "none";
    handleSuggestions(searchBox.value.trim());
  });

  clearBtn.onclick = () => {
    searchBox.value = "";
    clearBtn.style.display = "none";
    suggUL.innerHTML = "";
    suggUL.style.display = "none";
    searchBox.focus();
  };

  /* ===================== VOICE SEARCH ===================== */
  let recogniser = null;
  if ("webkitSpeechRecognition" in window) {
    recogniser = new webkitSpeechRecognition();
    recogniser.lang = "en-US";
    recogniser.onresult = e => {
      const text = e.results[0][0].transcript.trim();
      searchBox.value = text;
      suggUL.style.display = "none";
      initiateSearch(text);
    };
  } else {
    voiceBtn.style.display = "none";
  }

  voiceBtn.onclick = () => recogniser?.start();

  /* ===================== IMAGE UPLOAD ===================== */
  $("imageUpload").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const [h, b64] = reader.result.split(",");
      uploadedImageData = {
        base64: b64,
        mimeType: h.match(/:(.*?);/)[1]
      };
      searchBox.placeholder = `Image "${file.name}" loaded. Ask a question…`;
    };
    reader.readAsDataURL(file);
  });

  /* ===================== SEARCH ENTRY ===================== */
  searchBtn.onclick = () => initiateSearch(searchBox.value.trim());
  searchBox.addEventListener("keypress", e => {
    if (e.key === "Enter") initiateSearch(searchBox.value.trim());
  });

  function initiateSearch(term) {
    if (!term && !uploadedImageData) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    performSearch(term);
  }

  /* ===================== SEARCH MODE ===================== */
  function decideSearchMode(term) {
    const q = term.toLowerCase();
    const questionWords = [
      "why","how","what","compare","difference","explain","calculate","solve",
      "vs","is","are","can","should","when","who","define","write","list"
    ];
    const looksLikeQuestion = questionWords.some(w => q.includes(w)) || q.endsWith("?");

    if (LAST_QUERY_FROM_SUGGESTION && !looksLikeQuestion) return "WIKI";
    if (looksLikeQuestion) return "AI";
    if (q.split(" ").length <= 4) return "WIKI";
    return "AI";
  }

  /* ===================== MAIN SEARCH ===================== */
  async function performSearch(term) {
    loading.classList.add("show");
    results.innerHTML = "";
    suggUL.innerHTML = "";

    const MODE = decideSearchMode(term);
    LAST_QUERY_FROM_SUGGESTION = false;

    if (MODE === "AI" || uploadedImageData) {
      const answer = await fetchAIAnswer(term, uploadedImageData);
      if (answer && !answer.includes("Sorry")) renderAIAnswer(answer);
      uploadedImageData = null;
      loading.classList.remove("show");
      return;
    }

    await fetchWiki(term);
    loading.classList.remove("show");
  }

  /* ===================== AI RENDER ===================== */
  function renderAIAnswer(answer) {
    const html = marked.parse(answer, { gfm:true, breaks:true });
    results.innerHTML = `
      <div class="card ai-answer-card">
        <div class="ai-card-header">
          <h3>✦︎ Sosein AI</h3>
          <span class="copy-btn">🗒</span>
        </div>
        <div id="ai-answer-text" class="ai-markdown">${html}</div>
      </div>
    `;

    const container = $("ai-answer-text");

    requestAnimationFrame(() => {
      wrapTables(container);
      container.offsetHeight;

      if (window.renderMathInElement) {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      }
    });

    document.querySelector(".copy-btn").onclick = () =>
      navigator.clipboard.writeText(container.innerText);
  }

  /* ===================== TABLE FIX ===================== */
  function wrapTables(container) {
    container.querySelectorAll("table").forEach(table => {
      if (table.parentElement.classList.contains("table-wrapper")) return;
      const wrap = document.createElement("div");
      wrap.className = "table-wrapper";
      table.before(wrap);
      wrap.appendChild(table);
    });
  }

  /* ===================== WIKI ===================== */
  async function fetchWiki(term) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
      );
      if (!res.ok) throw 0;
      const d = await res.json();
      results.innerHTML = `
        <div class="card">
          <h2>${d.title}</h2>
          <p>${d.extract}</p>
          ${d.thumbnail ? `<img src="${d.thumbnail.source}">` : ""}
          <br><a href="${d.content_urls.desktop.page}" target="_blank">Read on Wikipedia</a>
        </div>
      `;
    } catch {
      results.innerHTML = `<div class="card">No results found.</div>`;
    }
  }

  /* ===================== AI FETCH ===================== */
  async function fetchAIAnswer(question, image) {
    try {
      const payload = { question, modelName: CURRENT_MODEL };
      if (image) {
        payload.imageBase64 = image.base64;
        payload.imageMimeType = image.mimeType;
      }
      const r = await fetch("/.netlify/functions/ask-ai", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      return d.answer;
    } catch {
      return "❌ Sorry, the AI could not answer right now.";
    }
  }

  /* ===================== SUGGESTIONS ===================== */
  async function handleSuggestions(q) {
    if (!q) return suggUL.style.display = "none";
    const r = await fetch(
      `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&format=json&search=${encodeURIComponent(q)}`
    );
    const d = await r.json();
    const items = d[1].slice(0,7);
    LAST_WIKI_SUGGESTIONS = items.map(i=>i.toLowerCase());
    suggUL.innerHTML = items.map(i=>`<li>${i}</li>`).join("");
    suggUL.style.display = "block";
    [...suggUL.children].forEach(li=>{
      li.onclick = () => {
        LAST_QUERY_FROM_SUGGESTION = true;
        searchBox.value = li.innerText;
        suggUL.style.display = "none";
        initiateSearch(li.innerText);
      };
    });
  }

  /* ===================== HISTORY ===================== */
  function saveHistory(t) {
    let h = JSON.parse(localStorage.searchHistory || "[]").filter(x=>x!==t);
    h.unshift(t); if (h.length>10) h.pop();
    localStorage.searchHistory = JSON.stringify(h);
    renderHistory();
  }

  function renderHistory() {
    const h = JSON.parse(localStorage.searchHistory || "[]");
    historyUL.innerHTML = h.map(t=>`<li>${t}</li>`).join("");
    [...historyUL.children].forEach(li =>
      li.onclick = () => initiateSearch(li.innerText)
    );
  }

  clearHist.onclick = () => {
    localStorage.removeItem("searchHistory");
    renderHistory();
  };

  renderHistory();

  /* ===================== BACK TO TOP ===================== */
  back2Top.onclick = () => window.scrollTo({top:0,behavior:"smooth"});
  window.addEventListener("scroll", () =>
    back2Top.style.display = scrollY > 200 ? "block" : "none"
  );

});
