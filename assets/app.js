import { initBackgroundCollage } from "./modules/background.js";
import { buildItemsFromCsv } from "./modules/csv.js";
import { buildPdfViewer } from "./modules/pdf-carousel.js";
import { openPdfModal } from "./modules/pdf-modal.js";
import { buildImageCarousel, setupImageCarousel } from "./modules/image-carousel.js";

const state = {
    works: [],
    filtered: [],
    activeWorkParam: "",
    isCourseOpen: false,
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
    courseVideo: document.querySelector("#course-modal iframe"),
    home: document.getElementById("site-home"),
    pdfList: document.getElementById("pdf-list"),
    pdfTitle: document.getElementById("pdf-title"),
    pdfImage: document.getElementById("pdf-image"),
    pdfImagePrev: document.getElementById("pdf-image-prev"),
    pdfImageNext: document.getElementById("pdf-image-next"),
    pdfImagePrev2: document.getElementById("pdf-image-prev2"),
    pdfImageNext2: document.getElementById("pdf-image-next2"),
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
const sheetId = "";
const sheetGid = "0";
const sheetCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;
const dataSource = sheetId ? sheetCsvUrl : csvPath;

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
    if (state.activeWorkParam) params.set("work", state.activeWorkParam);
    if (state.isCourseOpen) params.set("course", "1");

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

// タグ分類マッピング
const getTagCategory = (tag) => {
    const tagLower = tag.toLowerCase();
    
    // 場所系 (spatial) - パープル
    if (tagLower.includes("教室") || tagLower.includes("コモンルーム") || tagLower.includes("大学構内")) {
        return "spatial";
    }
    
    // デザイン分野系 (generation) - ブルー
    if (tagLower.includes("プロダクトデザイン") || tagLower.includes("ビジュアルデザイン") || 
        tagLower.includes("グラフィックデザイン") || tagLower.includes("インタラクションデザイン") ||
        tagLower.includes("キャラクターデザイン") || tagLower.includes("モチーフデザイン")) {
        return "generation";
    }
    
    // 技術・手法系 (expression) - オレンジ
    if (tagLower.includes("3dプリント") || tagLower.includes("レーザーカット") ||
        tagLower.includes("機構") || tagLower.includes("構造") || tagLower.includes("マグネット") ||
        tagLower.includes("連結構造") || tagLower.includes("パズル") || tagLower.includes("クリップ") ||
        tagLower.includes("カバー")) {
        return "expression";
    }
    
    // デザイン要素系 (data) - グリーン
    if (tagLower.includes("情報デザイン") || tagLower.includes("サインデザイン") ||
        tagLower.includes("人間工学") || tagLower.includes("視認性") || tagLower.includes("視覚") ||
        tagLower.includes("外装のデザイン") || tagLower.includes("装飾") || tagLower.includes("収納のデザイン") ||
        tagLower.includes("アタッチメントのデザイン") || tagLower.includes("複合機能のデザイン") ||
        tagLower.includes("ユーモアデザイン") || tagLower.includes("環境デザイン") ||
        tagLower.includes("掲示デザイン") || tagLower.includes("サイン計画")) {
        return "data";
    }
    
    // 体験・価値系 (evaluation) - レッド
    if (tagLower.includes("ユーザー体験") || tagLower.includes("使用環境改善") ||
        tagLower.includes("快適性") || tagLower.includes("整理のデザイン") || tagLower.includes("空間演出") ||
        tagLower.includes("インタラクション") || tagLower.includes("ui/ux") ||
        tagLower.includes("行動誘導") || tagLower.includes("遊びの設計") || tagLower.includes("ビジュアル設計")) {
        return "evaluation";
    }
    
    // デフォルト (用途・機能系など) - グレー
    return "default";
};

const buildTagChips = (tags) =>
    tags.map((tag) => {
        const category = getTagCategory(tag);
        return `<span class="tag tag-${category}">${tag}</span>`;
    }).join("");

const shuffleArray = (items) => {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

const getWorkParamValue = (work) => work.id || work.title || "";

const findWorkByParam = (param) => {
    if (!param) return null;
    const target = param.trim().toLowerCase();
    return (
        state.works.find((work) => (work.id || "").trim().toLowerCase() === target) ||
        state.works.find((work) => (work.title || "").trim().toLowerCase() === target)
    );
};

const applyWorkParam = () => {
    const params = new URLSearchParams(window.location.search);
    const workParam = params.get("work");
    if (!workParam) return;
    const match = findWorkByParam(workParam);
    if (match) {
        openModal(match);
    }
};

const openCourseModal = () => {
    elements.courseModal.classList.add("is-open");
    elements.courseModal.setAttribute("aria-hidden", "false");
    state.isCourseOpen = true;
    updateUrlParams();
    if (elements.courseVideo) {
        const source = elements.courseVideo.dataset.src || "";
        if (source && elements.courseVideo.getAttribute("src") !== source) {
            elements.courseVideo.setAttribute("src", source);
        }
    }
};

const closeCourseModal = () => {
    elements.courseModal.classList.remove("is-open");
    elements.courseModal.setAttribute("aria-hidden", "true");
    if (elements.courseVideo) {
        elements.courseVideo.setAttribute("src", "");
    }
    if (state.isCourseOpen) {
        state.isCourseOpen = false;
        updateUrlParams();
    }
};

const applyCourseParam = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("course") === "1") {
        openCourseModal();
    }
};

const openModal = (work) => {
    const links = [];
    if (work.stl) {
        links.push(
            `<a class="link-button" href="${work.stl}" download><i class="fa-solid fa-download"></i>STLダウンロード</a>`,
        );
    }
    if (work.pdf) {
        links.push(
            `<a class="link-button" href="${work.pdf}" target="_blank" rel="noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i>PDF</a>`,
        );
    }
    if (work.tinkercad) {
        links.push(
            `<a class="link-button" href="${work.tinkercad}" target="_blank" rel="noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i>Tinkercad</a>`,
        );
    }

    const imageSection = buildImageCarousel(work.images || [], work.title);
    const stlSection = work.stl
        ? `
    <div class="viewer-section">
      <div class="viewer-header">3Dデータ</div>
      <div id="stl-viewer" class="stl-viewer">
        <div class="viewer-placeholder">STLファイルがありません。</div>
      </div>
    </div>
  `
        : "";

    state.activeWorkParam = getWorkParamValue(work);
    updateUrlParams();

    elements.modalBody.innerHTML = `
    <h2 id="modal-title">${work.title}</h2>
    <div class="meta">${work.department || "学年未設定"} / ${work.year || "年度未設定"}</div>
    <div class="card-tags">${buildTagChips(work.tags)}</div>
    <div class="links">${links.join("") || "<span>リンクはまだありません。</span>"}</div>
    ${imageSection}
    ${stlSection}
  `;
    elements.modal.classList.add("is-open");
    elements.modal.setAttribute("aria-hidden", "false");

    if (imageSection) {
        setupImageCarousel(elements.modalBody, work.images || []);
    }
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
    if (state.activeWorkParam) {
        state.activeWorkParam = "";
        updateUrlParams();
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
            closeCourseModal();
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
                closeCourseModal();
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
        initBackgroundCollage();
        if (elements.courseVideo && !elements.courseVideo.dataset.src) {
            elements.courseVideo.dataset.src = elements.courseVideo.getAttribute("src") || "";
        }

        const response = await fetch(dataSource);
        const text = await response.text();
        const items = buildItemsFromCsv(text);

        state.works = shuffleArray(items);
        state.filtered = state.works;
        buildFilters(items);
        buildPdfViewer({ items, elements, openPdfModal });
        applyUrlParams();
        renderCards();
        applyWorkParam();
        applyCourseParam();

        ["input", "change"].forEach((eventName) => {
            elements.keyword.addEventListener(eventName, applyFilters);
            elements.year.addEventListener(eventName, applyFilters);
            elements.tags.addEventListener(eventName, applyFilters);
        });

        elements.openCourse.addEventListener("click", openCourseModal);

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
