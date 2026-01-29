document.addEventListener("DOMContentLoaded", () => {
  const heroTitle = document.querySelector(".hero-title");
if (heroTitle && !document.body.classList.contains("searching")) {
  const fullText = "Search for meaning";
  heroTitle.textContent = "";

  const textSpan = document.createElement("span");
  const cursor = document.createElement("span");
  cursor.className = "typewriter-cursor";

  heroTitle.appendChild(textSpan);
  heroTitle.appendChild(cursor);

  let index = 0;

  // ⏳ delay typing start (THIS GOES HERE)
  setTimeout(() => {
    const typingInterval = setInterval(() => {
      textSpan.textContent += fullText[index];
      index++;

      if (index === fullText.length) {
        clearInterval(typingInterval);

        let blinks = 0;
        const blinkInterval = setInterval(() => {
          cursor.style.opacity =
            cursor.style.opacity === "0" ? "1" : "0";
          blinks++;

          if (blinks === 7) {
            clearInterval(blinkInterval);
            textSpan.textContent += ".";
            cursor.remove();
          }
        }, 450);
      }
    }, 85);
  }, 400); // 👈 delay before typing starts
}
  
// Continue with your existing code below...
// const q = id => document.getElementById(id);
// etc...
  const q = id => document.getElementById(id);
  const searchBox = q("searchBox"), searchBtn = q("searchBtn"), voiceBtn = q("voiceBtn");
  const clearBtn = document.getElementById("clearBtn");
  let CURRENT_MODEL = "mistralai/devstral-2512:free"; //xiaomi/mimo-v2-flash:free
  let uploadedImageData = null;
  const aiIntentRegex = /\b(what|why|how|do|form|enlist|solve|tell me|facts about|recommend|detail|if|difference|explain|analyze|analyse|create|generate|summarize|summarise|which|who|when|where|can|could|would|should|is|are|was|were|define|compare|list|tell|write)\b|\?/i;
  
  // card dismiss 
  document.addEventListener("click", (e) => {
  const btn = e.target.closest(".card-dismiss");
  if (!btn) return;

  const card = btn.closest(".card");
  if (!card) return;

  card.classList.add("closing");

  setTimeout(() => {
    card.remove();
  }, 180);
});

  
  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn && navigator.share) {
  shareBtn.addEventListener("click", async () => {
    try {
      await navigator.share({
        title: "Sosein – Intelligent Search Engine",
        text: "A minimalist AI-powered search engine focused on meaning, not noise.",
        url: "https://sosein.netlify.app/"
      });
    } catch (err) {
      // user cancelled — ignore
    }
  });
} else if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText("https://sosein.netlify.app/");
    alert("Link copied to clipboard");
  });
}

// Show/hide ✖ when typing
searchBox.addEventListener("input", () => {
  const value = searchBox.value.trim();

  // Show / hide clear button
  clearBtn.style.display = value ? "block" : "none";

  // AI intent detection
  if (aiIntentRegex.test(value)) {
    searchBox.classList.add("ai-intent");
  } else {
    searchBox.classList.remove("ai-intent");
  }
});
  
document.addEventListener("click", (e) => {
  const moreBtn = e.target.closest(".dict-more span");
  if (!moreBtn) return;

  const card = moreBtn.closest(".dictionary-card");
  const extra = card.querySelector(".dict-extra-wrapper");

  const isOpen = !extra.hasAttribute("hidden");

  extra.toggleAttribute("hidden");
  moreBtn.textContent = isOpen ? "More senses →" : "Hide senses ←";
});
// Clear input when clicked
clearBtn.addEventListener("click", () => {
  searchBox.value = "";
  clearBtn.style.display = "none";
  suggUL.innerHTML = ""; // optional: hide suggestions
  searchBox.focus(); // focus back to input
});

  const suggUL = q("suggestions"), results = q("results"), loading = q("loading");
  const historyUL = q("history"), clearHist = q("clearHistory"), themeTgl = q("themeToggle"), back2Top = q("backToTop");
  const searchWrapper = document.querySelector(".search-wrapper");

// HARD guarantee: suggestions always belong to search wrapper
if (searchWrapper && suggUL) {
  searchWrapper.appendChild(suggUL);
}
  
  // 🌗 Dark mode
  if (localStorage.theme === "dark") document.body.classList.add("dark");
  themeTgl.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.theme = document.body.classList.contains("dark") ? "dark" : "light";
  };

  // 🎤 Voice search
  let recogniser;
  if ("webkitSpeechRecognition" in window) {
    recogniser = new webkitSpeechRecognition();
    recogniser.lang = "en-US";
    recogniser.onresult = e => {
  const transcript = e.results[0][0].transcript.trim();
  searchBox.value = transcript;

  // 👇 make mic behave EXACTLY like button / enter / suggestion
  suggUL.style.display = "none";
  document.body.classList.add("searching");

  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 150);

  triggerSearch(transcript);
};
  } else voiceBtn.style.display = "none";

  voiceBtn.onclick = () => {
  recogniser?.start();

  const speakPrompt = document.getElementById("speakPrompt");
  speakPrompt.style.display = "block";
  requestAnimationFrame(() => {
    speakPrompt.classList.add("show");
  });

  setTimeout(() => {
    speakPrompt.classList.remove("show");
    setTimeout(() => {
      speakPrompt.style.display = "none";
    }, 400);
  }, 1500);
};

// Add this new global variable at the top of your script, inside the DOMContentLoaded listener


// Add this new event listener for the image upload button
q("imageUpload").addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const [header, base64Data] = reader.result.split(',');
        const mimeType = header.match(/:(.*?);/)[1];
        
        uploadedImageData = {
            base64: base64Data,
            mimeType: mimeType,
            fileName: file.name
        };

        // Update placeholder
        searchBox.placeholder = `Image "${file.name}" loaded. Ask a question about it...`;
        
        // Show image preview with clear button
        showImagePreview(reader.result, file.name);
    };
});

// Updated function to show image preview with better positioning
function showImagePreview(imageSrc, fileName) {
    // Remove existing preview if any
    const existingPreview = document.querySelector('.image-preview-container');
    if (existingPreview) {
        existingPreview.remove();
    }

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    previewContainer.innerHTML = `
        <div class="image-preview">
            <img src="${imageSrc}" alt="${fileName}" title="${fileName}">
            <button class="clear-image-btn" title="Remove image">×</button>
        </div>
        <div class="image-info">
            📷 ${fileName} - Click × to remove
        </div>
    `;

    // Add click event to clear button
    const clearBtn = previewContainer.querySelector('.clear-image-btn');
    clearBtn.addEventListener('click', clearUploadedImage);

    // Insert preview right after the image upload button
    const imageUploadButton = q("imageUpload");
    imageUploadButton.parentElement.insertAdjacentElement('afterend', previewContainer);
}
// Updated function to clear the uploaded image
function clearUploadedImage() {
    // Clear the uploaded image data
    uploadedImageData = null;
    
    // Reset placeholder
    searchBox.placeholder = "Ask me anything...";
    
    // Clear file input
    q("imageUpload").value = "";
    
    // Remove preview container
    const preview = document.querySelector('.image-preview-container');
    if (preview) {
        preview.remove();
    }
}

  function highlightWordsSequentially(container, durationMs) {
  const words = Array.from(container.querySelectorAll(".spoken-word"));
  if (!words.length) return;

  const perWord = Math.max(durationMs / words.length, 60);
  let index = 0;

  function step() {
    if (index > 0) {
      words[index - 1].classList.remove("active");
    }
    if (index >= words.length) return;

    words[index].classList.add("active");
    index++;
    setTimeout(step, perWord);
  }

  step();
}
  // dictionary logic
  
async function fetchDatamuse(word) {
  const [ml, trg, ant] = await Promise.all([
    fetch(`https://api.datamuse.com/words?ml=${word}&max=8`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?rel_trg=${word}&max=8`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?rel_ant=${word}&max=6`).then(r => r.json())
  ]);

  return {
    related: ml,
    contextual: trg,
    opposites: ant
  };
}
  
function extractDictionaryWord(query) {
  return query
    .toLowerCase()
    .replace(/meaning|mane|kya+hai|mean|definition|define|means|of/g, "")
    .trim()
    .split(/\s+/)[0];
}

  
function isDictionaryQuery(q) {
  return /\b(meaning|definition|define|means)\b/i.test(q);
}

function isWeatherQuery(q) {
  return /(weather|temperature|temp|rain|forecast|climate)/i.test(q);
}

async function fetchDictionary(query) {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);
  if (!res.ok) throw new Error("No definition");
  return res.json();
 }

function renderDictionaryCard(data, datamuse) {
  if (!data || !data[0]) return "";

  const entry = data[0];
  const word = entry.word;
  const meanings = entry.meanings || [];

  const firstMeaning = meanings[0];
  const def = firstMeaning.definitions[0];

  const hasMultipleSenses = meanings.length > 1;

  /* ---------- Core dictionary ---------- */

  const examplesHTML = def.example
    ? `<div class="dict-example">“${def.example}”</div>`
    : "";

  const synonymsHTML = def.synonyms?.length
    ? `<div class="dict-syn"><strong>Synonyms:</strong> ${def.synonyms.slice(0, 6).join(", ")}</div>`
    : "";

  const antonymsHTML = def.antonyms?.length
    ? `<div class="dict-ant"><strong>Antonyms:</strong> ${def.antonyms.slice(0, 6).join(", ")}</div>`
    : "";

  const extraMeaningsHTML = meanings
    .slice(1)
    .map(m => {
      const d = m.definitions[0];
      return `
        <div class="dict-extra">
          <strong>${m.partOfSpeech}</strong> — ${d.definition}
        </div>
      `;
    })
    .join("");

  const senseHint = hasMultipleSenses
    ? `<div class="dict-more">Multiple meanings exist · <span>More senses →</span></div>`
    : "";

  /* ---------- Datamuse (semantic meaning) ---------- */

  const relatedHTML = datamuse?.related?.length
    ? `<div class="dm-group">
         <div class="dm-label">Related concepts</div>
         <div class="dm-words">${datamuse.related.slice(0, 8).map(w => w.word).join(", ")}</div>
       </div>`
    : "";

  const contextualHTML = datamuse?.contextual?.length
    ? `<div class="dm-group">
         <div class="dm-label">Often associated with</div>
         <div class="dm-words">${datamuse.contextual.slice(0, 8).map(w => w.word).join(", ")}</div>
       </div>`
    : "";

  const oppositeHTML = datamuse?.opposites?.length
    ? `<div class="dm-group">
         <div class="dm-label">Opposite ideas</div>
         <div class="dm-words">${datamuse.opposites.slice(0, 8).map(w => w.word).join(", ")}</div>
       </div>`
    : "";

  const hasDatamuse =
    relatedHTML || contextualHTML || oppositeHTML;

  /* ---------- Final render ---------- */

  return `
    <div class="card dictionary-card">
      <button class="card-dismiss" aria-label="Dismiss card"></button>

      <h2>${word}</h2>

      <div class="dict-pos">
        ${firstMeaning.partOfSpeech} — ${def.definition}
      </div>

      ${examplesHTML}
      ${synonymsHTML}
      ${antonymsHTML}

      ${senseHint}

      <div class="dict-extra-wrapper" hidden>
        ${extraMeaningsHTML}
      </div>

      ${hasDatamuse ? `
        <div class="dm-section">
          <div class="dm-title">Semantic context</div>
          ${relatedHTML}
          ${contextualHTML}
          ${oppositeHTML}
        </div>
      ` : ""}
    </div>
  `;
}
  
  
function buildTMDBMovieCard(movie) {
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "";

  const director =
    movie.credits.crew.find(p => p.job === "Director")?.name || "Not listed";

  const cast = movie.credits.cast
    .slice(0, 5)
    .map(c => c.name)
    .join(", ");

  return `
    <div class="card movie-card">
    <button class="card-dismiss" aria-label="Dismiss card">➖</button>
      <div class="movie-card-inner">
        ${poster ? `<img src="${poster}" alt="${movie.title} poster">` : ""}

        <div class="movie-meta">
          <h2>🎬 ${movie.title} (${movie.release_date?.slice(0, 4) || "—"})</h2>

          <p class="movie-desc">${movie.overview || "No description available."}</p>

          <p><strong>Director:</strong> ${director}</p>
          <p><strong>Cast:</strong> ${cast}</p>

          <a href="https://www.imdb.com/title/${movie.imdb_id}" target="_blank">
            ⭐ IMDb
          </a>
        </div>
      </div>
    </div>
  `;
}
async function fetchTMDBMovie(title) {
  try {
    const res = await fetch(
      `/.netlify/functions/tmdb?q=${encodeURIComponent(title)}`
    );

    if (!res.ok) return null;

    return await res.json();
  } catch (err) {
    console.warn("TMDB frontend fetch failed", err);
    return null;
  }
}
  //wrap function hereee
function wrapWords(text) {
  return text
    .split(/\s+/)
    .map(word => `<span class="spoken-word">${word}</span>`)
    .join(" ");
}
  
// Alternative positioning method if the above doesn't work perfectly
function showImagePreviewAlternative(imageSrc, fileName) {
    // Remove existing preview if any
    const existingPreview = document.querySelector('.image-preview-container');
    if (existingPreview) {
        existingPreview.remove();
    }

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    previewContainer.innerHTML = `
        <div class="image-preview">
            <img src="${imageSrc}" alt="${fileName}" title="${fileName}">
            <button class="clear-image-btn" title="Remove image">×</button>
        </div>
        <div class="image-info">
            📷 ${fileName} - Click × to remove
        </div>
    `;

    // Add click event to clear button
    const clearBtn = previewContainer.querySelector('.clear-image-btn');
    clearBtn.addEventListener('click', clearUploadedImage);

    // Find a better insertion point - look for suggestions or results area
    const suggestions = document.getElementById('suggestions');
    const results = document.getElementById('results');
    
    // Insert before suggestions if they exist, otherwise before results
    if (suggestions) {
        suggestions.parentElement.insertBefore(previewContainer, suggestions);
    } else if (results) {
        results.parentElement.insertBefore(previewContainer, results);
    } else {
        // Fallback: insert after search container
        const searchContainer = searchBox.parentElement;
        searchContainer.insertAdjacentElement('afterend', previewContainer);
    }
}
// Optional: Add a function to clear image when starting a new non-image search
function clearImageOnNewSearch() {
    if (uploadedImageData) {
        const userWantsToClear = confirm("You have an image loaded. Do you want to clear it for this new search?");
        if (userWantsToClear) {
            clearUploadedImage();
        }
    }
}
  
function wrapTables(container) {
  const tables = container.querySelectorAll("table");

  tables.forEach(table => {
    // Wrap table
    if (!table.parentElement.classList.contains("table-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    // Count columns (use first row)
    const firstRow = table.querySelector("tr");
    if (!firstRow) return;

    const colCount = firstRow.children.length;

    // ✅ ONLY fix layout for 2-column tables
    if (colCount <= 2) {
      table.style.tableLayout = "fixed";
      table.style.minWidth = "0";
    } else {
      // ✅ Multi-column tables scroll naturally
      table.style.tableLayout = "auto";
      table.style.minWidth = "max-content";
    }
  });
}

  // 🔍 Trigger search
  searchBtn.onclick = () => triggerSearch(searchBox.value.trim());
searchBox.addEventListener("keypress", e => {
  if (e.key === "Enter") triggerSearch(searchBox.value.trim());
});

  async function triggerSearch(term) {
    // This check now prevents a search if both the text and image are empty
    //const query = searchBox.value.trim().toLowerCase();
  
    if (!term && !uploadedImageData) return;
    document.body.classList.add("search-active");
    
    suggUL.innerHTML = "";
    saveHistory(term);
    results.innerHTML = "";
    loading.classList.add("show");
    // 📖 DICTIONARY (HIGH PRIORITY)
    if (isDictionaryQuery(term)) {
    try {
    const word = extractDictionaryWord(term);
    if (!word) throw new Error("No word extracted");

    const dict = await fetchDictionary(word);
    const datamuse = await fetchDatamuse(word);

    results.innerHTML = renderDictionaryCard(dict, datamuse);
    loading.classList.remove("show");
    return; // ⛔ STOP AI + WIKI
  } catch (err) {
    console.warn("Dictionary/Datamuse failed", err);
    // silent fail → fallback continues
  }
    }

    // --- THIS IS THE UPDATED LOGIC ---
    const isImageQuery = !!uploadedImageData; // Will be true if an image is uploaded
    const questionWords = ["is", "what", "how", "why", "would", "define", "if", "are", "can", "could", "should", "when", 
      "who", "?", "write", "review", "summary", "give", "will", "where", "was", "which", "explain", 
      "summarize", "compare", "list", "create", "generate", "suggest", "recommend", "calculate", 
      "translate", "solve", "draft", "outline", "analyze", "how to", "what is the", "what are the","best", "top", "vs", "difference between", 
      "meaning of", "facts about", "tell me", "meaning", "state", "is there", "*", "do", "enlist"];
     const isTextQuestion = questionWords.includes(term.split(" ")[0].toLowerCase());                       
    
    //const isTextQuestion = questionWords.some(w => term.toLowerCase().includes(w));
    // The AI will now be called if it's a text question OR if an image has been uploaded
    if (isTextQuestion || isImageQuery) {
        const aiAnswer = await fetchAIAnswer(term, uploadedImageData);
        
        // --- IMPORTANT: Reset image data after the search is done ---
  
        if (aiAnswer && !aiAnswer.includes("Sorry")) {
            const formattedAnswer = formatAIAnswer(aiAnswer);
            // Your complete AI card and copy button logic remains here
            results.innerHTML = `
                <div class="card ai-answer-card">
                <button class="card-dismiss" aria-label="Dismiss card">➖</button>
                  <div class="ai-card-header">
                    <h3>✦︎ Sosein AI</h3>
                    <div class="copy-container">
                        <span class="copy-btn" title="Copy Answer">🗒</span>
                    </div>
                  </div>
                  <div id="ai-answer-text" 
                  class="ai-markdown">${formattedAnswer}</div>
                </div>
            `;
             addCopyButtons(); // ✅ MUST be here
          
  const aiContainer = 
  document.getElementById("ai-answer-text");

  if (aiContainer) {
  requestAnimationFrame(() => {
// 1️⃣ Wrap tables so ONLY tables scroll
  wrapTables(aiContainer);

// 2️⃣ FORCE layout reflow (THIS fixes dark mode + mobile)  
aiContainer.offsetHeight;  

// 3️⃣ Render math AFTER layout is locked  
if (window.renderMathInElement) {  
  renderMathInElement(aiContainer, {  
    delimiters: [  
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
    ],  
    throwOnError: false  
  });  
}
});
}
          
function formatAIAnswer(text) {
  if (!text) return "";

  let safeText = text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/<\/?(iframe|object|embed)[^>]*>/gi, "");

  return marked.parse(safeText, {
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false
  });
  }  
          

      // This is the NEW code
       document.querySelector(".copy-btn").onclick = (e) => {
        const copyButton = e.target;
        const copyContainer = copyButton.parentElement; // This is our new container
        const text = document.getElementById("ai-answer-text").innerText;

        navigator.clipboard.writeText(text).then(() => {
            // Prevent multiple "Copied!" messages
            if (copyContainer.querySelector('.copy-feedback')) return;

            const feedback = document.createElement('div'); // Use a div for better layout
            feedback.textContent = 'Copied!';
            feedback.className = 'copy-feedback';
            
            // Add the feedback text inside the container
            copyContainer.append(feedback);
            
            // Remove it after 2 seconds
            setTimeout(() => {
                feedback.remove();
            }, 2000);
        });
    };
      loading.classList.remove("show");
      return; // ✅ Skip wiki, cricket, book, etc.
    }
  } //

  // 📚 Normal search flow
  await fetchAll(term);
  
  const lowerTerm = term.toLowerCase();
  const bookKeywords = ["book", "novel", "by", "author", "volume", "literature"];
  const isBookSearch = bookKeywords.some(k => lowerTerm.includes(k));
  if (isBookSearch) detectAndFetchBook(term);

  loading.classList.remove("show");
}


  // 📦 Fetch Wikipedia + Entity + YouTube + News
function classifyAndEnhance(title, summary) {
  const lower = summary.toLowerCase();
  const encoded = encodeURIComponent(title);

  if (lower.includes("singer") || lower.includes("vocalist") || lower.includes("playback singer")) {
    return {
      type: "singer",
      spotifyLink: `https://open.spotify.com/search/${encoded}`
    };
  } else if (lower.includes("film") || lower.includes("movie") || lower.includes("cinema") || lower.includes("directed by")) {
    return {
      type: "movie",
      imdbRating: "⭐ 8.4/10 (testing)", // Static for now
      imdbLink: `https://www.imdb.com/find?q=${encoded}`
    };
  } else if (lower.includes("actor") || lower.includes("actress")) {
    return {
      type: "actor",
      famousWorks: [
        `${title} – Famous Work 1`,
        `${title} – Famous Work 2`,
        `${title} – Famous Work 3`
      ],
      imdbLink: `https://www.imdb.com/find?q=${encoded}`
    };
  }
  return null;
}

async function fetchAll(term) {
  results.innerHTML = "";
  loading.classList.add("show");


  try {
    const cleanTerm = term
   .replace(/\?/g, "")
   .replace(/\s*\(.*?film.*?\)$/i, "")// 👈 THIS FIX
   .trim();
    const wikiURL = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`;

    const wikiRes = await fetch(wikiURL);
    if (!wikiRes.ok) throw "Wiki Not Found";
    const wikiData = await wikiRes.json();
    // ================================
    // 🎬 TMDB MOVIE CARD (FIRST)
    // ================================
    const tmdbMovie = await fetchTMDBMovie(cleanTerm);
    console.log("TMDB RESULT:", tmdbMovie);

    if (tmdbMovie && tmdbMovie.title) {
      results.innerHTML += buildTMDBMovieCard(tmdbMovie);
    }
    
    results.innerHTML += buildWikiCard(wikiData, wikiData.title);
    
    let entityType = null;
    if (wikiData.wikibase_item) {
      entityType = await fetchEntityType(wikiData.wikibase_item);
    }
    
    
    
    // 🧩 Additional Media Enrichment
    if (entityType === "human") {
      if (/singer|musician|vocalist/i.test(wikiData.description)) {
    // Embed Spotify
      results.innerHTML += `
      <div class="card">
      <button class="card-dismiss" aria-label="Dismiss card">➖</button>
        <h3>🎧 Listen on Spotify</h3>
        <iframe style="border-radius:12px" src="https://open.spotify.com/embed/search/${encodeURIComponent(term)}" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>
      </div>`;
   } else if (/actor|actress/i.test(wikiData.description)) {
    // Top 3 Famous Works from Wiki data
    const works = wikiData.extract.match(/known for[^.]+/i);
    if (works) {
      results.innerHTML += `
        <div class="card">
        <button class="card-dismiss" aria-label="Dismiss card">➖</button>
          <h3>🎬 Famous Works</h3>
          <p>${works[0]}</p>
        </div>`;
    }
  }
} else if (entityType === "film") {
  // IMDb Rating via unofficial OMDB API (or provide search link)

  const imdbSearchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(wikiData.title)}&s=tt`;
  results.innerHTML += `
    <div class="card">
    <button class="card-dismiss" aria-label="Dismiss card">➖</button>
      <h3>🎞 IMDb Info</h3>
      <p><a href="${imdbSearchUrl}" target="_blank">🔗 Search "${term}" on IMDb</a></p>
    </div>`;
}

    
    setTimeout(() => {
    const readMoreLink = document.getElementById("readMoreLink");
    const collapseLink = document.getElementById("collapseLink");
    const expandedContent = document.getElementById("expandedContent");
    const summaryText = document.querySelector(".wiki-summary");

  if (readMoreLink && collapseLink && expandedContent) {
    readMoreLink.addEventListener("click", async (e) => {
      e.preventDefault();
      readMoreLink.textContent = "Loading more...";

      try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=extracts&format=json&explaintext=true&titles=${encodeURIComponent(wikiData.title)}`);
        const data = await res.json();
        const page = Object.values(data.query.pages)[0];
        const fullExtract = page.extract;

        const paragraphs = fullExtract.split("\n").filter(p => p.trim() !== "");
        const shortExtract = paragraphs.slice(0, 4).join("<br><br>"); // Show first 4 paragraphs

        expandedContent.innerHTML = `<p>${shortExtract}</p>`;
        expandedContent.style.display = "block";
        collapseLink.style.display = "inline-block";
        readMoreLink.remove();
      } catch (err) {
        expandedContent.innerHTML = `<p>Could not fetch additional information.</p>`;
        expandedContent.style.display = "block";
        collapseLink.style.display = "none";
        readMoreLink.remove();
      }
    });

    collapseLink.addEventListener("click", () => {
      expandedContent.style.display = "none";
      collapseLink.style.display = "none";
    });
  }
}, 300);





    const enhance = classifyAndEnhance(wikiData.title, wikiData.extract);
if (enhance) {
  let html = "";
  if (enhance.type === "singer") {
    html = `<div class="card"><h3>🎵 Spotify</h3><a href="${enhance.spotifyLink}" target="_blank">${wikiData.title} on Spotify</a></div>`;
  } else if (enhance.type === "movie") {
    html = `<div class="card">
              <button class="card-dismiss" aria-label="Dismiss card">➖</button>
              <h3>🎬 IMDb Info</h3>
              <p>Rating: ${enhance.imdbRating}</p>
              <a href="${enhance.imdbLink}" target="_blank">View on IMDb</a>
            </div>`;
  } else if (enhance.type === "actor") {
    html = `<div class="card">
              <button class="card-dismiss" aria-label="Dismiss card">➖</button>
              <h3>🎭 Famous Works</h3>
              <ul>${enhance.famousWorks.map(work => `<li>${work}</li>`).join("")}</ul>
              <a href="${enhance.imdbLink}" target="_blank">View on IMDb</a>
            </div>`;
  }
  results.innerHTML += html;
}


    if (!wikiData?.extract || wikiData.extract.length < 20) {
      suggestCorrection(term); // typo handling
    }

    // 🔧 FETCH all in parallel (NO aiHTML here!)
    const [ytHTML] = await Promise.all([
      fetchYouTube(term),
    ]);

    if (ytHTML) results.innerHTML += ytHTML;

  } catch (err) {
    console.warn("Wikipedia fetch failed:", err);
    results.innerHTML = "";
    suggestCorrection(term);
  } finally {
    loading.classList.remove("show");
  }
}
  


  // 🧠 Detect Entity Type from Wikidata
  async function fetchEntityType(qid) {
  try {
    // 1️⃣ Fetch the page entity
    const res = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`
    );
    const data = await res.json();
    const entity = data.entities[qid];

    // 2️⃣ Get P31 (instance of)
    const P31 = entity.claims.P31?.[0]?.mainsnak?.datavalue?.value?.id;
    if (!P31) return null;

    // 3️⃣ Fetch the P31 entity itself
    const res2 = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${P31}.json`
    );
    const data2 = await res2.json();

    return (
      data2.entities[P31]?.labels?.en?.value?.toLowerCase() || null
    );
  } catch (err) {
    console.warn("Entity type fetch failed", err);
    return null;
  }
}

  // 📄 Build Wiki Card (with news-wrapper container)
  function buildWikiCard(d, term) {
  const img = d.thumbnail?.source ? `<img src="${d.thumbnail.source}" alt="${d.title}">` : "";
  return `
    <div class="card">
    <button class="card-dismiss" aria-label="Dismiss card">➖</button>
      <h2>${d.title || term}
   <button
  class="speak-btn"
  data-title="${encodeURIComponent(d.title)}"
  data-state="idle"
  aria-label="Read aloud"
>
  <svg viewBox="0 0 24 24" class="speak-icon">
    <path d="M5 9v6h4l5 5V4L9 9H5z"></path>
  </svg>
</button>
      </h2>
      <p class="wiki-summary" data-raw-text="${encodeURIComponent(d.extract || "")}">
      ${wrapWords(d.extract || "No summary available")}
      </p>
      ${img}
      <div class="wiki-expand-control">
        <button class="read-more-btn" data-title="${encodeURIComponent(d.title)}">Read more</button>
        <button class="collapse-btn" style="display:none;">Collapse</button>
      </div>
      <div class="expanded-content" style="display:none; margin-top: 1rem;"></div>
      <br><a href="${d.content_urls.desktop.page}" target="_blank">Read on Wikipedia</a>
    </div>
  `;
}
  async function detectAndFetchBook(term) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(term)}`);
    const data = await res.json();

    if (data.totalItems > 0 && data.items) {
      const book = data.items.find(b => b.volumeInfo?.description || b.searchInfo?.textSnippet) || data.items[0];
      const info = book.volumeInfo;
      const snippet = book.searchInfo?.textSnippet;

      const title = info.title || term;
      const authors = info.authors ? info.authors.join(", ") : "Unknown author";
      const description = info.description || snippet || "No description available.";
      const thumbnail = info.imageLinks?.thumbnail || "";
      const previewLink = info.previewLink || "#";

      const bookCard = `
        <div class="card">
        <button class="card-dismiss" aria-label="Dismiss card">➖</button>
          <h2>📚 ${title}</h2>
          <p><strong>Author(s):</strong> ${authors}</p>
          <p>${description}</p>
          ${thumbnail ? `<img src="${thumbnail}" alt="Book Cover">` : ""}
          <br><a href="${previewLink}" target="_blank">🔗 Preview Book</a>
        </div>
      `;

      results.innerHTML += bookCard;
    }
  } catch (err) {
    console.error("Book API failed", err);
  }
}
//here brahhhhhhhh sattaksh


  // script.js

// Replace your old fetchAIAnswer with this one

// In your main script.js

// examples later:
// "deepseek/deepseek-r1"
// "openai/gpt-4o-mini"
// "anthropic/claude-3.5-sonnet"
  
  

async function fetchAIAnswer(question, imageData) {
  const FALLBACK_MODELS = [
    CURRENT_MODEL,// whatever user selected
    "nvidia/nemotron-3-nano-30b-a3b:free", 
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "z-ai/glm-4.5-air:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "xiaomi/mimo-v2-flash:free"
     // fast & reliable
    // last-resort thinker
  ];

  const modelsToTry = [...new Set(FALLBACK_MODELS)].filter(Boolean);

  for (const model of modelsToTry) {
    try {
      console.log("🤖 Trying model:", model);

      const payload = {
        question,
        modelName: model
      };

      if (imageData) {
        payload.imageBase64 = imageData.base64;
        payload.imageMimeType = imageData.mimeType;
      }

      const response = await fetch("/.netlify/functions/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn("❌ Model failed:", model);
        continue;
      }

      const data = await response.json();

      if (data?.answer) {
        console.log("✅ Answered by:", model);
        CURRENT_MODEL = model; // promote winner
        return data.answer.trim();
      }

    } catch (err) {
      console.warn("🔥 Error with model:", model, err.message);
    }
  }

  return "❌ The AI is currently overloaded. Please try again later.";
}
  
async function fetchYouTube(term) {
    try {
        const url = `/.netlify/functions/youtube?q=${encodeURIComponent(term)}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Server function failed with status ${res.status}`);
        }

        const data = await res.json();
        
        // The YouTube data is now directly available
        if (!data.items || data.items.length === 0) return "";
        return `<div class="card"> 
                <button class="card-dismiss" aria-label="Dismiss card">➖</button>
                <h3>🎥 Related Videos</h3><ul>${data.items.map(v => `<li><a href="https://www.youtube.com/watch?v=${v.id.videoId}" target="_blank">${v.snippet.title}</a></li>`).join("")}</ul></div>`;
    } catch(err) {
        console.error("Error fetching YouTube videos:", err);
        return ""; // Return empty string on error
    }
}

async function suggestCorrection(term) {
  console.log("✅ suggestCorrection() triggered for:", term);

  const url = `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&format=json&search=${encodeURIComponent(term)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("🔁 Suggestion API responded:", data);

    const suggestions = data[1].filter(s => s.toLowerCase() !== term.toLowerCase());

    if (suggestions.length) {
      const firstSuggestion = suggestions[0];
      console.log("💡 Suggesting correction for:", firstSuggestion);  // ✅ Add this line

      const suggestionHTML = `
        <div class="card" style="background:#fff3cd; border-left: 4px solid #ffc107;">
          <p>🤔 Did you mean 
            <a href="#" id="didYouMeanLink">${firstSuggestion}</a>?
          </p>
        </div>
      `;
      results.innerHTML += suggestionHTML;

      document.getElementById("didYouMeanLink").onclick = e => {
        e.preventDefault();
        searchBox.value = firstSuggestion;
        triggerSearch(firstSuggestion);
      };
    }
  } catch (err) {
    console.warn("🛑 Suggestion fetch failed:", err);
  }
}


  // 🕘 Save and render search history
  // 🕘 Save search history
function saveHistory(t) {
  let h = JSON.parse(localStorage.searchHistory || "[]").filter(x => x !== t);
  h.unshift(t);
  if (h.length > 10) h.pop();
  localStorage.searchHistory = JSON.stringify(h);
  renderHistory(); 
}

// 🧾 Render history
function renderHistory() {
  const h = JSON.parse(localStorage.searchHistory || "[]");
  historyUL.innerHTML = h.map(t => `<li>${t}</li>`).join("");
  [...historyUL.children].forEach(li => li.onclick = () => {
    searchBox.value = li.textContent;
    triggerSearch(li.textContent);
  });
}

// ✅ Bind the Clear History button once at the top level
clearHist.onclick = () => {
  localStorage.removeItem("searchHistory");
  renderHistory();
};

// 🔁 Render on page load
renderHistory();


  // ✍️ Autocomplete with better UI behavior
searchBox.addEventListener("input", () => {
  const query = searchBox.value.trim();
  if (!query) {
    suggUL.innerHTML = "";
    suggUL.style.display = "none";  // hide when empty
    idx = -1;
    return;
  }

  // 👇 this line makes suggestions reappear
  suggUL.style.display = "block";

  fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&format=json&search=${encodeURIComponent(query)}`)
    .then(r => r.json())
    .then(data => {
      const suggestions = data[1].slice(0, 7);
      suggUL.innerHTML = suggestions.map(item => `<li>${item}</li>`).join("");
      idx = -1;

      [...suggUL.children].forEach((li, i) => {
        li.onclick = () => {
          searchBox.value = li.textContent;
          suggUL.innerHTML = "";
          suggUL.style.display = "none"; // still hide after selecting
          triggerSearch(li.textContent);
        };
      });
    });
});

// 🔻 Hide suggestions when scrolling
window.addEventListener("scroll", () => {
  suggUL.style.display = "none";
});

// 🔻 Hide suggestions when clicking search or pressing Enter
searchBtn.onclick = () => {
  suggUL.style.display = "none";
  triggerSearch(searchBox.value.trim());
};

searchBox.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    suggUL.style.display = "none";
    triggerSearch(searchBox.value.trim());
  }
});

  // ⌨️ Arrow nav in suggestions
  let idx = -1;
  searchBox.addEventListener("keydown", e => {
    const items = suggUL.children;
    if (!items.length) return;
    if (["ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      idx = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      [...items].forEach((li, i) => li.classList.toggle("active", i === idx));
    } else if (e.key === "Enter" && idx > -1) {
      e.preventDefault(); items[idx].click();
    }
  });

  // ⬆️ Scroll to top
  back2Top.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  window.addEventListener("scroll", () => back2Top.style.display = scrollY > 200 ? "block" : "none");
});

// 🧠 Toggle "Read more" summary
document.addEventListener("click", async (e) => {
  const card = e.target.closest(".card");
  const expandedDiv = card?.querySelector(".expanded-content");
  const readMoreBtn = card?.querySelector(".read-more-btn");
  const collapseBtn = card?.querySelector(".collapse-btn");

  if (e.target.classList.contains("read-more-btn")) {
    const title = e.target.dataset.title;

    try {
      readMoreBtn.textContent = "Read more";
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${title}&format=json&origin=*`);
      const data = await res.json();

      const htmlContent = data.parse?.text["*"];
      const doc = new DOMParser().parseFromString(htmlContent, "text/html");
      const paragraphs = [...doc.querySelectorAll("p")].slice(0,6); // 4 paras

      expandedDiv.innerHTML = paragraphs.map(p => `<p>${p.textContent}</p>`).join("");
      expandedDiv.style.display = "block";
      readMoreBtn.style.display = "none";
      collapseBtn.style.display = "inline-block";
    } catch (err) {
      console.error("Wiki fetch failed", err);
      readMoreBtn.textContent = "Read more";
      expandedDiv.innerHTML = `<p>Failed to fetch extended content. Try visiting the Wikipedia link instead.</p>`;
      expandedDiv.style.display = "block";
    }
  }

  if (e.target.classList.contains("collapse-btn")) {
    expandedDiv.innerHTML = "";
    expandedDiv.style.display = "none";
    collapseBtn.style.display = "none";
    readMoreBtn.style.display = "inline-block";
  }
});



// 🔊 Handle 'Read the article' speak button
// 🔊 Speak full Wikipedia extract when clicking "Read the article" button
let isSpeaking = false;
let currentUtterance = null;

document.addEventListener("click", (e) => {
  const speakBtn = e.target.closest(".speak-btn");
  if (!speakBtn) return;

  e.stopPropagation();

  if (!("speechSynthesis" in window)) return;

  // TOGGLE OFF
  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
    speakBtn.dataset.state = "idle";
    return;
  }

  // TOGGLE ON
  isSpeaking = true;
  speakBtn.dataset.state = "speaking";

  // Gesture-safe preload
  currentUtterance = new SpeechSynthesisUtterance("Loading article.");
  currentUtterance.lang = "en-US";

  speechSynthesis.cancel();
  speechSynthesis.speak(currentUtterance);

  const title = speakBtn.dataset.title;
  if (!title) return;

  fetch(
    `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&explaintext=true&titles=${title}&origin=*`
  )
    .then(res => res.json())
    .then(data => {
      const page = Object.values(data.query.pages)[0];
      if (!page?.extract) throw new Error("No extract");

      const text = page.extract.replace(/\n+/g, " ").slice(0, 3500);

      const articleUtterance = new SpeechSynthesisUtterance(text);
      articleUtterance.lang = "en-US";

      articleUtterance.onend = () => {
        isSpeaking = false;
        speakBtn.dataset.state = "idle";
      };

      articleUtterance.onerror = () => {
        isSpeaking = false;
        speakBtn.dataset.state = "idle";
      };

      speechSynthesis.speak(articleUtterance);
    })
    .catch(() => {
      speechSynthesis.cancel();
      isSpeaking = false;
      speakBtn.dataset.state = "idle";
    });
});
// Add this code to your existing script.js file

// Function to handle search initiation - called from all search triggers
function initiateSearch() {
  // Add 'searching' class to body for CSS transitions
  document.body.classList.add('searching');
  
  // Scroll to top smoothly after a brief delay to allow the collapse animation
  setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, 150);
}

// Function to reset search state (when clearing search or going back to home)
function resetSearchState() {
  document.body.classList.remove('searching');
}

// ========================================
// HOOK INTO ALL SEARCH TRIGGERS
// ========================================

// 1. Search Button Click
if (searchBtn) {
  // Store original click handler if it exists
  const originalHandler = searchBtn.onclick;
  
  searchBtn.addEventListener('click', function(e) {
    initiateSearch();
    
    // Call original handler if it exists
    if (originalHandler) {
      originalHandler.call(this, e);
    }
  });
}

// 2. Enter Key Press in Search Box
if (searchBox) {
  searchBox.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      initiateSearch();
      // Your existing search logic will be triggered automatically
    }
  });
}

// 3. Suggestion Click (hook into suggestions list)
// This uses event delegation to catch clicks on suggestion items
const suggestionsContainer = document.getElementById('suggestions');
if (suggestionsContainer) {
  suggestionsContainer.addEventListener('click', function(e) {
    // Check if a suggestion item was clicked
    const suggestionItem = e.target.closest('li');
    if (suggestionItem) {
      initiateSearch();
      // Your existing suggestion click handler will be triggered
    }
  });
}

// 4. Voice/Mic Button - Hook into speech recognition
const voiceBtn = document.getElementById('voiceBtn');
if (voiceBtn) {
  // Store original click handler if it exists
  const originalVoiceHandler = voiceBtn.onclick;
  
  // Listen for when speech recognition completes
  // This will trigger when voice input is processed
  voiceBtn.addEventListener('click', function(e) {
    // Call original handler first to start voice recognition
    if (originalVoiceHandler) {
      originalVoiceHandler.call(this, e);
    }
    
    // We need to wait for speech recognition to complete and populate the search box
    // Set up a listener for when the search box value changes from voice input
    if (searchBox) {
      // Use MutationObserver to detect when search box is populated by voice
      const observer = new MutationObserver(function(mutations) {
        if (searchBox.value.trim() !== '') {
          // Voice input has populated the search box
          // Small delay to ensure voice recognition has finished
          setTimeout(() => {
            initiateSearch();
          }, 500);
          
          // Disconnect observer after first trigger
          observer.disconnect();
        }
      });
      
      // Alternative: Listen for input event
      const handleVoiceInput = function() {
        if (searchBox.value.trim() !== '') {
          // Voice has populated search box, initiate search after brief delay
          setTimeout(() => {
            initiateSearch();
          }, 800);
          
          // Remove listener after first trigger
          searchBox.removeEventListener('input', handleVoiceInput);
        }
      };
      
      // Add listener when voice button is clicked
      searchBox.addEventListener('input', handleVoiceInput);
      
      // Clean up listener after 10 seconds if not triggered
      setTimeout(() => {
        searchBox.removeEventListener('input', handleVoiceInput);
      }, 10000);
    }
  });
}

// Alternative approach: If you have a specific function that handles voice input completion
// Hook into it like this:
/*
function onVoiceInputComplete(transcript) {
  initiateSearch(); // Add this line
  
  // Your existing voice handling code...
  searchBox.value = transcript;
  performSearch(transcript);
}
*/

// If your voice recognition triggers search automatically, you can also hook into
// the SpeechRecognition API directly:
/*
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  // Your existing recognition setup...
  
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    searchBox.value = transcript;
    
    // Add this line before or after your search logic
    initiateSearch();
    
    // Your existing search logic...
    performSearch(transcript);
  };
}
*/

// ========================================
// OPTIONAL: CLEAR/RESET HANDLERS
// ========================================

// Reset when clear button is clicked
if (clearBtn) {
  clearBtn.addEventListener('click', function() {
    resetSearchState();
  });
}

// Reset when clearing history
const clearHistoryBtn = document.getElementById('clearHistory');
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', function() {
    resetSearchState();
  });
}
function addCopyButtons() {
  document.querySelectorAll(".ai-markdown pre").forEach(pre => {
    if (pre.querySelector(".code-copy-btn")) return;

    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.textContent = "Copy";

    btn.addEventListener("click", () => {
      const code = pre.innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "Copied";
        btn.classList.add("copied");

        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1500);
      });
    });

    pre.appendChild(btn);
  });
}
// ========================================
// INTEGRATE WITH YOUR EXISTING CODE
// ========================================

/*
RECOMMENDED APPROACH FOR VOICE:

If you have a centralized function that gets called after voice recognition completes,
add initiateSearch() there. For example:

// Your existing voice recognition code
recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  searchBox.value = transcript;
  
  // Add this line
  initiateSearch();
  
  // Then trigger your search
  performSearch(transcript);
};

OR if voice automatically triggers search through your existing search function:

function performSearch(query) {
  if (!query) return;
  
  initiateSearch(); // This will handle all search types including voice
  
  // Your existing search logic...
  showLoading();
  fetchResults(query);
  displayResults();
}
*/

// ========================================
// DEBUGGING (Remove in production)
// ========================================

// Uncomment to see when initiateSearch is called
/*
const originalInitiateSearch = initiateSearch;
initiateSearch = function() {
  console.log('🔍 Search initiated - scrolling up');
  originalInitiateSearch();
};
*/
                           
