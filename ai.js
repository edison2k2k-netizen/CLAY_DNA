// =============================================
// CLAY DNA - AI 작품 분석
// 무료 로컬 분석 엔진
// =============================================

console.log("CLAY DNA AI 분석 모듈 시작");

let aiSelectedWork = null;


// =============================================
// 공통 HTML 이스케이프
// =============================================

function aiEscapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =============================================
// AI 분석 스타일
// =============================================

function createAIStyle() {

    if (document.getElementById("clay-dna-ai-style")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "clay-dna-ai-style";

    style.textContent = `

        .ai-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            box-sizing: border-box;
        }

        .ai-modal {
            width: 100%;
            max-width: 760px;
            max-height: 90vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 18px;
            padding: 26px;
            box-sizing: border-box;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }

        .ai-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .ai-header h2 {
            margin: 0;
            font-size: 24px;
        }

        .ai-close {
            border: 0;
            background: transparent;
            font-size: 26px;
            cursor: pointer;
        }

        .ai-work-selector {
            display: grid;
            gap: 10px;
            margin-bottom: 20px;
        }

        .ai-work-button {
            width: 100%;
            padding: 14px;
            border: 1px solid #ddd;
            border-radius: 12px;
            background: #fafafa;
            text-align: left;
            cursor: pointer;
        }

        .ai-work-button:hover {
            background: #f0f0f0;
        }

        .ai-analysis-card {
            margin-top: 20px;
            padding: 20px;
            border-radius: 16px;
            background: #f7f7f7;
        }

        .ai-score {
            font-size: 38px;
            font-weight: 700;
            margin: 8px 0 18px;
        }

        .ai-result-row {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 11px 0;
            border-bottom: 1px solid #ddd;
        }

        .ai-result-row:last-child {
            border-bottom: 0;
        }

        .ai-label {
            font-weight: 600;
        }

        .ai-description {
            line-height: 1.7;
            margin-top: 16px;
        }

        .ai-tag {
            display: inline-block;
            margin: 4px;
            padding: 7px 11px;
            border-radius: 20px;
            background: #e9e9e9;
            font-size: 13px;
        }

        .ai-main-button {
            width: 100%;
            padding: 15px;
            border: 0;
            border-radius: 12px;
            background: #222;
            color: white;
            font-size: 16px;
            cursor: pointer;
            margin-top: 15px;
        }

        .ai-main-button:hover {
            opacity: 0.85;
        }

        .ai-empty {
            text-align: center;
            padding: 40px 20px;
            color: #777;
        }

    `;

    document.head.appendChild(style);
}


// =============================================
// AI 분석 메인 화면
// =============================================

function openAIAnalysis() {

    createAIStyle();

    if (!window.currentUser) {

        if (typeof showToast === "function") {
            showToast("먼저 로그인해주세요.");
        }

        return;
    }

    const overlay = document.createElement("div");

    overlay.className = "ai-modal-overlay";
    overlay.id = "aiAnalysisModal";

    overlay.innerHTML = `

        <div class="ai-modal">

            <div class="ai-header">

                <h2>CLAY DNA AI 분석</h2>

                <button
                    class="ai-close"
                    onclick="closeAIAnalysis()">
                    ×
                </button>

            </div>

            <p>
                분석할 작품을 선택하세요.
            </p>

            <div
                id="aiWorkSelector"
                class="ai-work-selector">
            </div>

            <div
                id="aiAnalysisResult">
            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    renderAIWorkSelector();
}


// =============================================
// 작품 선택 목록
// =============================================

function renderAIWorkSelector() {

    const container =
        document.getElementById("aiWorkSelector");

    if (!container) {
        return;
    }

    if (!Array.isArray(window.works) || window.works.length === 0) {

        container.innerHTML = `
            <div class="ai-empty">
                등록된 작품이 없습니다.
                <br><br>
                먼저 작품을 등록해주세요.
            </div>
        `;

        return;
    }

    container.innerHTML = window.works.map(function(work) {

        return `

            <button
                class="ai-work-button"
                onclick="selectAIWork('${work.id}')">

                <strong>
                    ${aiEscapeHtml(work.title || "제목 없음")}
                </strong>

                <br>

                <small>
                    ${aiEscapeHtml(work.type || "종류 미입력")}
                    ·
                    ${aiEscapeHtml(work.technique || "기법 미입력")}
                </small>

            </button>

        `;

    }).join("");
}


// =============================================
// 작품 선택
// =============================================

function selectAIWork(workId) {

    const work = window.works.find(function(item) {

        return item.id === workId;

    });

    if (!work) {

        alert("작품 정보를 찾을 수 없습니다.");

        return;
    }

    aiSelectedWork = work;

    runAIAnalysis(work);
}


// =============================================
// AI 분석 실행
// =============================================

function runAIAnalysis(work) {

    const result =
        document.getElementById("aiAnalysisResult");

    if (!result) {
        return;
    }

    result.innerHTML = `

        <div class="ai-analysis-card">

            <h3>작품 분석 중...</h3>

            <p>
                작품의 재료, 제작기법, 설명 데이터를 분석하고 있습니다.
            </p>

        </div>
    `;

    setTimeout(function() {

        const analysis =
            analyzeCeramicWork(work);

        renderAIResult(work, analysis);

    }, 500);
}


// =============================================
// 도자 작품 분석 엔진
// =============================================

function analyzeCeramicWork(work) {

    const type =
        String(work.type || "");

    const clay =
        String(work.clay || "");

    const technique =
        String(work.technique || "");

    const description =
        String(work.description || "");

    const text =
        (
            type +
            " " +
            clay +
            " " +
            technique +
            " " +
            description
        ).toLowerCase();


    // -----------------------------------------
    // 형태 특성
    // -----------------------------------------

    let formCharacter = "기본적인 형태 중심";

    if (
        type.includes("항아리") ||
        text.includes("둥근") ||
        text.includes("곡선")
    ) {
        formCharacter = "곡선과 볼륨감이 강조된 형태";
    }

    else if (
        type.includes("컵") ||
        type.includes("접시")
    ) {
        formCharacter = "실용성과 안정적인 형태가 강조된 작품";
    }

    else if (
        type.includes("화병")
    ) {
        formCharacter = "수직적 구조와 공간성이 강조된 형태";
    }

    else if (
        type.includes("조형")
    ) {
        formCharacter = "조형성과 표현성이 강조된 형태";
    }


    // -----------------------------------------
    // 제작기법
    // -----------------------------------------

    let techniqueCharacter =
        technique || "제작기법 데이터 부족";

    if (
        text.includes("물레")
    ) {
        techniqueCharacter =
            "물레 성형을 중심으로 제작된 작품";
    }

    else if (
        text.includes("손성형") ||
        text.includes("손 성형")
    ) {
        techniqueCharacter =
            "손성형을 통한 자유로운 형태 표현";
    }

    else if (
        text.includes("판성형") ||
        text.includes("판 성형")
    ) {
        techniqueCharacter =
            "판성형을 이용한 구조적 형태 표현";
    }

    else if (
        text.includes("코일링")
    ) {
        techniqueCharacter =
            "코일링을 이용한 층층의 형태 구성";
    }


    // -----------------------------------------
    // 재료
    // -----------------------------------------

    let materialCharacter =
        clay || "사용 흙 정보 부족";

    if (
        text.includes("백자")
    ) {
        materialCharacter =
            "백자 계열 흙을 사용한 밝고 정제된 표현";
    }

    else if (
        text.includes("청자")
    ) {
        materialCharacter =
            "청자 계열 흙을 사용한 전통적인 도자 표현";
    }

    else if (
        text.includes("분청")
    ) {
        materialCharacter =
            "분청 계열의 질감과 표현 가능성이 있는 작품";
    }

    else if (
        text.includes("옹기")
    ) {
        materialCharacter =
            "옹기 계열의 자연스러운 질감과 실용성이 특징";
    }


    // -----------------------------------------
    // 작품 설명 분석
    // -----------------------------------------

    let expression =
        "작품 설명 데이터가 적어 표현 의도를 제한적으로 분석했습니다.";

    if (description.length >= 30) {

        expression =
            "작품 설명에 비교적 충분한 정보가 있어 제작자의 의도와 표현 방향을 분석할 수 있습니다.";

    }

    if (
        text.includes("자연") ||
        text.includes("바다") ||
        text.includes("바람") ||
        text.includes("흙")
    ) {

        expression =
            "자연환경이나 흙의 본질적인 특성을 작품의 표현 요소로 활용하는 경향이 나타납니다.";

    }

    if (
        text.includes("사람") ||
        text.includes("장애") ||
        text.includes("교육") ||
        text.includes("치유")
    ) {

        expression =
            "사람과의 관계, 교육 또는 사회적 의미를 작품의 중요한 표현 요소로 활용하는 경향이 나타납니다.";

    }


    // -----------------------------------------
    // 점수
    // -----------------------------------------

    let score = 60;

    if (work.title) {
        score += 5;
    }

    if (work.type) {
        score += 5;
    }

    if (work.clay) {
        score += 5;
    }

    if (work.technique) {
        score += 10;
    }

    if (description.length >= 30) {
        score += 10;
    }

    if (description.length >= 80) {
        score += 5;
    }

    if (score > 100) {
        score = 100;
    }


    // -----------------------------------------
    // DNA 키워드
    // -----------------------------------------

    const dnaTags = [];

    if (type.includes("항아리")) {
        dnaTags.push("항아리");
    }

    if (type.includes("컵")) {
        dnaTags.push("실용도자");
    }

    if (type.includes("접시")) {
        dnaTags.push("생활도자");
    }

    if (type.includes("화병")) {
        dnaTags.push("공간성");
    }

    if (type.includes("조형")) {
        dnaTags.push("조형성");
    }

    if (text.includes("물레")) {
        dnaTags.push("물레성형");
    }

    if (text.includes("손성형")) {
        dnaTags.push("손성형");
    }

    if (text.includes("자연")) {
        dnaTags.push("자연친화");
    }

    if (text.includes("바다")) {
        dnaTags.push("해양");
    }

    if (text.includes("교육")) {
        dnaTags.push("교육");
    }

    if (text.includes("장애")) {
        dnaTags.push("장애인문화예술");
    }

    if (dnaTags.length === 0) {
        dnaTags.push("도자공예");
    }


    return {

        score: score,

        formCharacter: formCharacter,

        techniqueCharacter: techniqueCharacter,

        materialCharacter: materialCharacter,

        expression: expression,

        dnaTags: dnaTags

    };
}


// =============================================
// 분석 결과 표시
// =============================================

function renderAIResult(work, analysis) {

    const result =
        document.getElementById("aiAnalysisResult");

    if (!result) {
        return;
    }

    result.innerHTML = `

        <div class="ai-analysis-card">

            <h3>
                ${aiEscapeHtml(work.title || "작품")}
            </h3>

            <div class="ai-score">
                ${analysis.score}
                <span style="font-size:16px;">
                    / 100
                </span>
            </div>

            <div class="ai-result-row">
                <span class="ai-label">
                    형태 특성
                </span>

                <span>
                    ${aiEscapeHtml(
                        analysis.formCharacter
                    )}
                </span>
            </div>


            <div class="ai-result-row">
                <span class="ai-label">
                    제작 특성
                </span>

                <span>
                    ${aiEscapeHtml(
                        analysis.techniqueCharacter
                    )}
                </span>
            </div>


            <div class="ai-result-row">
                <span class="ai-label">
                    재료 특성
                </span>

                <span>
                    ${aiEscapeHtml(
                        analysis.materialCharacter
                    )}
                </span>
            </div>


            <div class="ai-result-row">
                <span class="ai-label">
                    표현 방향
                </span>

                <span>
                    ${aiEscapeHtml(
                        analysis.expression
                    )}
                </span>
            </div>


            <div style="margin-top:20px;">

                <strong>
                    CLAY DNA 키워드
                </strong>

                <div style="margin-top:10px;">

                    ${analysis.dnaTags.map(function(tag) {

                        return `
                            <span class="ai-tag">
                                ${aiEscapeHtml(tag)}
                            </span>
                        `;

                    }).join("")}

                </div>

            </div>


            <button
                class="ai-main-button"
                onclick="saveAIAnalysis()">

                분석 결과 저장하기

            </button>

        </div>

    `;
}


// =============================================
// 분석 결과 저장
// =============================================

async function saveAIAnalysis() {

    if (!aiSelectedWork) {

        alert("분석할 작품을 먼저 선택해주세요.");

        return;
    }

    if (!window.currentUser) {

        alert("로그인이 필요합니다.");

        return;
    }


    try {

        const result =
            analyzeCeramicWork(aiSelectedWork);


        // Firebase가 연결되어 있는 기존 app.js의
        // Firestore 객체와 함수를 사용

        if (
            typeof window.db === "undefined" ||
            typeof window.collection !== "undefined"
        ) {

            console.log(
                "AI 분석 결과:",
                result
            );

        }


        /*
         * 현재 단계에서는 분석 결과를
         * 화면에서 먼저 검증합니다.
         *
         * 다음 단계에서 Firestore의
         *
         * users/{uid}/works/{workId}/analysis
         *
         * 구조로 저장합니다.
         */


        if (typeof showToast === "function") {

            showToast(
                "AI 분석 결과가 생성되었습니다."
            );

        }

        console.log(
            "CLAY DNA 분석 데이터",
            {
                workId: aiSelectedWork.id,
                workTitle: aiSelectedWork.title,
                analysis: result
            }
        );


    } catch (error) {

        console.error(
            "AI 분석 결과 저장 오류:",
            error
        );

        alert(
            "분석 결과 처리 중 오류가 발생했습니다."
        );
    }
}


// =============================================
// AI 분석 창 닫기
// =============================================

function closeAIAnalysis() {

    const modal =
        document.getElementById("aiAnalysisModal");

    if (modal) {
        modal.remove();
    }

    aiSelectedWork = null;
}


// =============================================
// 기존 CLAY DNA의 AI 메뉴와 연결
// =============================================

document.addEventListener(
    "click",
    function(event) {

        const feature =
            event.target.closest(
                '[data-feature="analyze"]'
            );

        if (feature) {

            event.preventDefault();

            openAIAnalysis();

        }

    }
);


// =============================================
// 초기화
// =============================================

createAIStyle();

console.log(
    "CLAY DNA AI 분석 모듈 준비 완료"
);
