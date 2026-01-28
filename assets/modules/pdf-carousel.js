const buildPdfItems = (items) =>
    items
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

export const buildPdfViewer = ({ items, elements, openPdfModal }) => {
    const pdfItems = buildPdfItems(items);

    if (pdfItems.length === 0) {
        elements.pdfTitle.textContent = "PDFがありません";
        elements.pdfList.innerHTML = "";
        return;
    }

    let currentIndex = 0;
    let idleTimer = null;
    let autoTimer = null;

    // Slick.js用のスライドHTMLを生成
    const createSlides = () => {
        return pdfItems.map((item, index) => {
            return `
                <div class="pdf-slide" data-index="${index}">
                    <img src="${item.thumb}" alt="${item.title}" loading="lazy" />
                </div>
            `;
        }).join("");
    };

    // カルーセルを初期化
    const $carousel = $(elements.pdfCarousel);
    $carousel.html(createSlides());

    // Slick.jsを初期化
    $carousel.slick({
        centerMode: true,
        centerPadding: "10%",
        slidesToShow: 1,
        infinite: true,
        speed: 650,
        cssEase: "ease",
        prevArrow: '<button type="button" class="pdf-overlay prev" aria-label="前のPDF">‹</button>',
        nextArrow: '<button type="button" class="pdf-overlay next" aria-label="次のPDF">›</button>',
        dots: false,
        adaptiveHeight: false,
        focusOnSelect: true,
    });

    // スライド変更時のイベント
    $carousel.on("afterChange", (event, slick, currentSlide) => {
        currentIndex = currentSlide;
        const current = pdfItems[currentIndex];
        elements.pdfTitle.textContent = current.title;
        renderDots();
        resetIdleTimer();
    });

    // ドットをレンダリング
    const renderDots = () => {
        elements.pdfList.innerHTML = pdfItems
            .map(
                (_, index) =>
                    `<button class="pdf-dot${index === currentIndex ? " is-active" : ""}" type="button" data-index="${index}" aria-label="PDF ${index + 1}"></button>`,
            )
            .join("");
    };

    // 初期表示
    const current = pdfItems[0];
    elements.pdfTitle.textContent = current.title;
    renderDots();

    // スライドのクリックイベント（PDFモーダルを開く）
    $carousel.on("click", ".pdf-slide", function () {
        const slideIndex = $(this).data("index");
        const item = pdfItems[slideIndex];
        openPdfModal(elements, item.pdf, item.title);
    });

    // ドットクリックイベント
    elements.pdfList.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.dataset.index) {
            const nextIndex = Number(target.dataset.index);
            $carousel.slick("slickGoTo", nextIndex);
            resetIdleTimer();
        }
    });

    const startAuto = () => {
        if (autoTimer) return;
        autoTimer = window.setInterval(() => {
            $carousel.slick("slickNext");
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

    resetIdleTimer();
};
