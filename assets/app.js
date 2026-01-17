const state = {
    works: [],
    filtered: [],
};

const elements = {
    keyword: document.getElementById("filter-keyword"),
    year: document.getElementById("filter-year"),
    tags: document.getElementById("filter-tags"),
    cards: document.getElementById("cards"),
    count: document.getElementById("result-count"),
    modal: document.getElementById("modal"),
    modalBody: document.getElementById("modal-body"),
    courseModal: document.getElementById("course-modal"),
    openCourse: document.getElementById("open-course"),
    home: document.getElementById("site-home"),
    pdfList: document.getElementById("pdf-list"),
    pdfTitle: document.getElementById("pdf-title"),
    pdfImage: document.getElementById("pdf-image"),
    pdfImagePrev: document.getElementById("pdf-image-prev"),
    pdfImageNext: document.getElementById("pdf-image-next"),
    pdfImagePrev2: document.getElementById("pdf-image-prev2"),
    pdfImageNext2: document.getElementById("pdf-image-next2"),
    pdfOpen: document.getElementById("pdf-open"),
    pdfPrev: document.getElementById("pdf-prev"),
    pdfNext: document.getElementById("pdf-next"),
    pdfCarousel: document.getElementById("pdf-carousel"),
    pdfModal: document.getElementById("pdf-modal"),
    pdfModalIframe: document.getElementById("pdf-modal-iframe"),
    pdfPagePrev: document.getElementById("pdf-page-prev"),
    pdfPageNext: document.getElementById("pdf-page-next"),
    pdfPageIndicator: document.getElementById("pdf-page-indicator"),
};

const csvPath = "data/works.csv";
const sheetId = "15SRnybSLKdCLuzwIFPHIurAHXj1NhFF0wgbODZ3-y9U";
const sheetGid = "0";
const sheetCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;
const dataSource = sheetId ? sheetCsvUrl : csvPath;

const normalizeText = (value) => (value || "").toString().trim();

const normalizePath = (value) => {
    const text = normalizeText(value);
    if (!text) return "";
    if (text.startsWith(".stl/")) return text.replace(".stl/", "stl/");
    if (text.startsWith(".images/")) return text.replace(".images/", "images/");
    if (text.startsWith(".pdf/")) return text.replace(".pdf/", "pdf/");
    return text;
};

const normalizeAssetPath = (value, type) => {
    const text = normalizePath(value);
    if (!text) return "";
    if (text.includes("/") || text.startsWith("http")) return text;
    if (type === "stl") return `stl/${text}`;
    if (type === "image") return `images/${text}`;
    if (type === "pdf") return `pdf/${text}`;
    return text;
};

const normalizePaths = (value, type) => {
    const text = normalizeText(value);
    if (!text) return [];
    return text
        .split(/[|,]/)
        .map((entry) => normalizeAssetPath(entry, type))
        .filter(Boolean);
};

const getField = (item, keys) => {
    for (const key of keys) {
        const value = normalizeText(item[key]);
        if (value) return value;
    }
    return "";
};

const parseCsv = (text) => {
    const rows = [];
    let current = "";
    let inQuotes = false;
    const pushCell = (row, cell) => {
        row.push(cell);
    };

    let row = [];
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            i += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            pushCell(row, current);
            current = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") {
                i += 1;
            }
            pushCell(row, current);
            rows.push(row);
            row = [];
            current = "";
        } else {
            current += char;
        }
    }

    if (current.length > 0 || row.length > 0) {
        pushCell(row, current);
        rows.push(row);
    }

    if (rows.length === 0) return [];
    const headers = rows[0].map((header) => normalizeText(header));

    return rows.slice(1).map((cells) => {
        const item = {};
        headers.forEach((header, idx) => {
            item[header] = normalizeText(cells[idx] || "");
        });
        return item;
    });
};

const buildFilters = (data) => {
    const years = new Set();
    const tags = new Set();

    data.forEach((work) => {
        if (work.year) years.add(work.year);
        work.tags.forEach((tag) => tags.add(tag));
    });

    const updateSelect = (select, values) => {
        const options = Array.from(values).sort().map((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            return option;
        });
        select.append(...options);
    };

    updateSelect(elements.year, years);

    const tagOptions = Array.from(tags).sort().map((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        return option;
    });
    elements.tags.append(...tagOptions);
};

const getSelectedTags = () =>
    Array.from(elements.tags.selectedOptions).map((option) => option.value);

let allowUrlUpdate = true;

const updateUrlParams = () => {
    if (!allowUrlUpdate) return;
    const params = new URLSearchParams();
    const keyword = elements.keyword.value.trim();
    const year = elements.year.value;
    const tags = getSelectedTags();

    if (keyword) params.set("q", keyword);
    if (year) params.set("year", year);
    if (tags.length > 0) params.set("tags", tags.join(","));

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
};

const applyUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("q") || "";
    const year = params.get("year") || "";
    const tags = (params.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

    allowUrlUpdate = false;
    elements.keyword.value = keyword;
    elements.year.value = year;
    Array.from(elements.tags.options).forEach((option) => {
        option.selected = tags.includes(option.value);
    });
    allowUrlUpdate = true;
};

const matchesKeyword = (work, keyword) => {
    if (!keyword) return true;
    const source = [
        work.title,
        work.student,
        work.description,
        work.department,
        work.year,
        work.tags.join(" "),
    ]
        .join(" ")
        .toLowerCase();
    return source.includes(keyword.toLowerCase());
};

const applyFilters = () => {
    const keyword = elements.keyword.value.trim();
    const year = elements.year.value;
    const selectedTags = getSelectedTags();

    state.filtered = state.works.filter((work) => {
        if (year && work.year !== year) return false;
        if (selectedTags.length > 0 && !work.tags.some((tag) => selectedTags.includes(tag))) {
            return false;
        }
        return matchesKeyword(work, keyword);
    });

    renderCards();
    updateUrlParams();
};

const buildTagChips = (tags) =>
    tags.map((tag) => `<span class="tag">${tag}</span>`).join("");

const buildPdfViewer = (items) => {
    const pdfItems = items
        .filter((item) => item.pdf)
        .map((item) => ({
            title: item.title,
            pdf: item.pdf,
            thumb: (() => {
                if (!item.pdf) return "assets/images/placeholder.svg";
                const filename = item.pdf.split("/").pop() || "";
                const base = filename.replace(/\.pdf$/i, "");
                return base ? `thumbnails/${base}.png` : "assets/images/placeholder.svg";
            })(),
        }));

    if (pdfItems.length === 0) {
        elements.pdfTitle.textContent = "PDFがありません";
        elements.pdfImage.removeAttribute("src");
        elements.pdfImagePrev.removeAttribute("src");
        elements.pdfImageNext.removeAttribute("src");
        elements.pdfImagePrev2.removeAttribute("src");
        elements.pdfImageNext2.removeAttribute("src");
        elements.pdfList.innerHTML = "";
        elements.pdfPrev.disabled = true;
        elements.pdfNext.disabled = true;
        return;
    }

    let currentIndex = 0;
    let idleTimer = null;
    let autoTimer = null;
    let isAnimating = false;

    const renderDots = () => {
        elements.pdfList.innerHTML = pdfItems
            .map(
                (_, index) =>
                    `<button class="pdf-dot${index === currentIndex ? " is-active" : ""}" type="button" data-index="${index}" aria-label="PDF ${index + 1}"></button>`,
            )
            .join("");
    };

    const setPdf = (nextIndex) => {
        currentIndex = (nextIndex + pdfItems.length) % pdfItems.length;
        const current = pdfItems[currentIndex];
        const prev = pdfItems[(currentIndex - 1 + pdfItems.length) % pdfItems.length];
        const next = pdfItems[(currentIndex + 1) % pdfItems.length];
        const prev2 = pdfItems[(currentIndex - 2 + pdfItems.length) % pdfItems.length];
        const next2 = pdfItems[(currentIndex + 2) % pdfItems.length];
        elements.pdfTitle.textContent = current.title;
        elements.pdfImage.setAttribute("src", current.thumb);
        elements.pdfImagePrev.setAttribute("src", prev.thumb);
        elements.pdfImageNext.setAttribute("src", next.thumb);
        elements.pdfImagePrev2.setAttribute("src", prev2.thumb);
        elements.pdfImageNext2.setAttribute("src", next2.thumb);
        elements.pdfOpen.onclick = () => {
            openPdfModal(current.pdf, current.title);
        };
        elements.pdfImage.onclick = () => openPdfModal(current.pdf, current.title);
        elements.pdfImagePrev.onclick = () => openPdfModal(prev.pdf, prev.title);
        elements.pdfImageNext.onclick = () => openPdfModal(next.pdf, next.title);
        elements.pdfImagePrev2.onclick = () => openPdfModal(prev2.pdf, prev2.title);
        elements.pdfImageNext2.onclick = () => openPdfModal(next2.pdf, next2.title);
        renderDots();
    };

    const animateCarousel = (direction) => {
        if (!elements.pdfCarousel || isAnimating) return Promise.resolve();
        const currentEl = elements.pdfCarousel.querySelector(".pdf-item.pdf-current");
        const targetEl = elements.pdfCarousel.querySelector(
            direction === "prev" ? ".pdf-item.pdf-prev" : ".pdf-item.pdf-next",
        );
        if (!currentEl || !targetEl) return Promise.resolve();

        const currentRect = currentEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const distance = targetRect.left - currentRect.left;
        if (!distance) return Promise.resolve();

        isAnimating = true;
        const translateX = -distance;
        const carousel = elements.pdfCarousel;
        const duration = 700;

        return new Promise((resolve) => {
            const cleanup = () => {
                carousel.removeEventListener("transitionend", onEnd);
                carousel.style.transition = "none";
                carousel.style.transform = "translateX(0)";
                isAnimating = false;
                resolve();
            };

            const onEnd = (event) => {
                if (event.propertyName === "transform") {
                    cleanup();
                }
            };

            carousel.addEventListener("transitionend", onEnd);
            carousel.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
            carousel.style.transform = `translateX(${translateX}px)`;

            window.setTimeout(cleanup, duration + 50);
        });
    };

    const userAction = (direction) => {
        animateCarousel(direction).then(() => {
            setPdf(direction === "prev" ? currentIndex - 1 : currentIndex + 1);
        });
        resetIdleTimer();
    };

    const startAuto = () => {
        if (autoTimer) return;
        autoTimer = window.setInterval(() => {
            animateCarousel("next").then(() => {
                setPdf(currentIndex + 1);
            });
        }, 6000);
    };

    const stopAuto = () => {
        if (autoTimer) {
            window.clearInterval(autoTimer);
            autoTimer = null;
        }
    };

    const resetIdleTimer = () => {
        if (idleTimer) window.clearTimeout(idleTimer);
        stopAuto();
        idleTimer = window.setTimeout(() => {
            startAuto();
        }, 10000);
    };

    elements.pdfPrev.addEventListener("click", () => userAction("prev"));
    elements.pdfNext.addEventListener("click", () => userAction("next"));
    elements.pdfList.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.dataset.index) {
            const nextIndex = Number(target.dataset.index);
            const direction = nextIndex === currentIndex ? "next" : nextIndex > currentIndex ? "next" : "prev";
            animateCarousel(direction).then(() => {
                setPdf(nextIndex);
            });
            resetIdleTimer();
        }
    });

    setPdf(0);
    resetIdleTimer();
};

const openPdfModal = (pdfUrl, title) => {
    if (!elements.pdfModal || !elements.pdfModalIframe) return;
    let currentPage = 1;
    const setPage = (page) => {
        currentPage = Math.max(1, page);
        elements.pdfModalIframe.setAttribute("src", `${pdfUrl}#page=${currentPage}&view=FitH&toolbar=1`);
        elements.pdfPageIndicator.textContent = `${currentPage}`;
    };

    elements.pdfModal.querySelector("#pdf-modal-title").textContent = title || "PDFビューア";
    elements.pdfModal.classList.add("is-open");
    elements.pdfModal.setAttribute("aria-hidden", "false");

    elements.pdfPagePrev.onclick = () => setPage(currentPage - 1);
    elements.pdfPageNext.onclick = () => setPage(currentPage + 1);
    setPage(1);
};

const buildSlideshow = (images, title) => {
    const safeImages = images.length > 0 ? images : ["assets/images/placeholder.svg"];
    const slides = safeImages
        .map(
            (src, index) =>
                `<img src="${src}" alt="${title}" class="slide-image${index === 0 ? " is-active" : ""}" data-index="${index}" />`,
        )
        .join("");
    const dots = safeImages
        .map(
            (_, index) =>
                `<button class="slide-dot${index === 0 ? " is-active" : ""}" type="button" data-index="${index}" aria-label="画像${index + 1}"></button>`,
        )
        .join("");

    return `
    <div class="slideshow" data-count="${safeImages.length}">
      <button class="slide-nav prev" type="button" aria-label="前へ">‹</button>
      <div class="slide-track">${slides}</div>
      <button class="slide-nav next" type="button" aria-label="次へ">›</button>
      <div class="slide-dots">${dots}</div>
    </div>
  `;
};

const setupSlideshow = (root) => {
    const slideshow = root.querySelector(".slideshow");
    if (!slideshow) return;
    const slides = Array.from(slideshow.querySelectorAll(".slide-image"));
    const dots = Array.from(slideshow.querySelectorAll(".slide-dot"));
    const prev = slideshow.querySelector(".slide-nav.prev");
    const next = slideshow.querySelector(".slide-nav.next");

    let index = 0;

    const update = (nextIndex) => {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => {
            slide.classList.toggle("is-active", i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === index);
        });
    };

    prev.addEventListener("click", () => update(index - 1));
    next.addEventListener("click", () => update(index + 1));
    dots.forEach((dot) => {
        dot.addEventListener("click", () => update(Number(dot.dataset.index)));
    });
};

const renderCards = () => {
    elements.cards.innerHTML = "";
    elements.count.textContent = `${state.filtered.length} 件`;

    if (state.filtered.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "該当する作品がありません。";
        elements.cards.appendChild(empty);
        return;
    }

    state.filtered.forEach((work) => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
      <div class="card-media">
        <img src="${work.image || "assets/images/placeholder.svg"}" alt="${work.title}" />
        <div class="card-title-overlay">${work.title}</div>
      </div>
      <div class="card-body">
        <div class="card-tags">${buildTagChips(work.tags)}</div>
        <div class="card-meta-label">${work.department || "学年未設定"} / ${work.year || "年度未設定"}</div>
      </div>
    `;
        card.addEventListener("click", () => openModal(work));
        elements.cards.appendChild(card);
    });
};

const openModal = (work) => {
    const links = [];
    if (work.stl) {
        links.push(`<a class="link-button" href="${work.stl}" download>STLダウンロード</a>`);
    }
    if (work.pdf) {
        links.push(`<a class="link-button" href="${work.pdf}" target="_blank" rel="noreferrer">PDF</a>`);
    }
    if (work.tinkercad) {
        links.push(`<a class="link-button" href="${work.tinkercad}" target="_blank" rel="noreferrer">Tinkercad</a>`);
    }

    elements.modalBody.innerHTML = `
    <h2 id="modal-title">${work.title}</h2>
    <div class="meta">${work.department || "学年未設定"} / ${work.year || "年度未設定"}</div>
    <div class="card-tags">${buildTagChips(work.tags)}</div>
    <div class="links">${links.join("") || "<span>リンクはまだありません。</span>"}</div>
    ${buildSlideshow(work.images || [], work.title)}
    <div class="viewer-section">
      <div class="viewer-header">STLプレビュー</div>
      <div id="stl-viewer" class="stl-viewer">
        <div class="viewer-placeholder">STLファイルがありません。</div>
      </div>
    </div>
  `;
    elements.modal.classList.add("is-open");
    elements.modal.setAttribute("aria-hidden", "false");

    setupSlideshow(elements.modalBody);
    if (window.StlViewer && work.stl) {
        window.StlViewer.render({ containerId: "stl-viewer", url: work.stl });
    }
};

const closeModal = () => {
    elements.modal.classList.remove("is-open");
    elements.modal.setAttribute("aria-hidden", "true");
    if (window.StlViewer) {
        window.StlViewer.dispose();
    }
};

const setupModal = () => {
    elements.modal.addEventListener("click", (event) => {
        if (event.target.dataset.close) {
            closeModal();
        }
    });
    elements.courseModal.addEventListener("click", (event) => {
        if (event.target.dataset.close) {
            elements.courseModal.classList.remove("is-open");
            elements.courseModal.setAttribute("aria-hidden", "true");
        }
    });
    elements.pdfModal.addEventListener("click", (event) => {
        if (event.target.dataset.close) {
            elements.pdfModal.classList.remove("is-open");
            elements.pdfModal.setAttribute("aria-hidden", "true");
            elements.pdfModalIframe.removeAttribute("src");
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
            if (elements.courseModal.classList.contains("is-open")) {
                elements.courseModal.classList.remove("is-open");
                elements.courseModal.setAttribute("aria-hidden", "true");
            }
            if (elements.pdfModal.classList.contains("is-open")) {
                elements.pdfModal.classList.remove("is-open");
                elements.pdfModal.setAttribute("aria-hidden", "true");
                elements.pdfModalIframe.removeAttribute("src");
            }
        }
    });
};

const init = async () => {
    try {
        const response = await fetch(dataSource);
        const text = await response.text();
        const items = parseCsv(text)
            .map((item) => {
                const tagsText = getField(item, ["tags", "タグ", "TAGS"]);
                const title = getField(item, ["title", "制作物", "TITLE"]) || "無題";
                const student = getField(item, ["student", "氏名", "NAME_JA"]);
                const year = getField(item, ["year", "年度", "YEAR"]);
                const department = getField(item, ["department", "所属学年", "COURSE_YEAR"]);
                const description = getField(item, ["description", "説明"]);
                const images = normalizePaths(
                    getField(item, ["image", "images", "IMAGES_FILENAME"]),
                    "image",
                );
                const image = images[0] || "";
                const stl = normalizeAssetPath(getField(item, ["stl", "STL", "STL_FILENAME"]), "stl");
                const pdf = normalizeAssetPath(getField(item, ["pdf", "PDF", "PDF_FILENAME"]), "pdf");
                const tinkercad = getField(item, ["tinkercad", "URL"]);
                const presentFlag = getField(item, ["発表", "PRESENTATION"]);

                return {
                    id: getField(item, ["id", "No.", "学籍番号", "ID"]),
                    title,
                    student,
                    year,
                    department,
                    description,
                    image,
                    images,
                    stl,
                    pdf,
                    tinkercad,
                    presentFlag,
                    tags: tagsText
                        .split(/[\|,]/)
                        .map((tag) => normalizeText(tag))
                        .filter(Boolean),
                };
            })
            .filter((item) => item.title)
            .filter((item) => item.presentFlag && item.presentFlag.toLowerCase() === "true");

        state.works = items;
        state.filtered = items;
        buildFilters(items);
        buildPdfViewer(items);
        applyUrlParams();
        renderCards();

        ["input", "change"].forEach((eventName) => {
            elements.keyword.addEventListener(eventName, applyFilters);
            elements.year.addEventListener(eventName, applyFilters);
            elements.tags.addEventListener(eventName, applyFilters);
        });

        elements.openCourse.addEventListener("click", () => {
            elements.courseModal.classList.add("is-open");
            elements.courseModal.setAttribute("aria-hidden", "false");
        });

        elements.home.addEventListener("click", () => {
            elements.keyword.value = "";
            elements.year.value = "";
            Array.from(elements.tags.options).forEach((option) => {
                option.selected = false;
            });
            applyFilters();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    } catch (error) {
        elements.cards.innerHTML = `<div class="empty-state">CSVの読み込みに失敗しました。</div>`;
        console.error(error);
    }
};

setupModal();
init();
