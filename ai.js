// =============================================
// CLAY DNA - AI 작품 분석
// AI Analysis Module
// =============================================

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =============================================
// Firebase 연결
// =============================================

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "clay-dna.firebaseapp.com",
    projectId: "clay-dna",
    storageBucket: "clay-dna.firebasestorage.app",
    messagingSenderId: "456070145020",
    appId: "1:456070145020:web:2bcfc864817e2efa728879",
    measurementId: "G-30DNQX0P85"
};


// 기존 Firebase 앱이 있으면 사용
const firebaseApp =
    getApps().length > 0
        ? getApp()
        : null;


// 기존 app.js가 초기화한 Firebase를 사용
const auth =
    firebaseApp
        ? getAuth(firebaseApp)
        : null;

const db =
    firebaseApp
        ? getFirestore(firebaseApp)
        : null;


// =============================================
// 상태
// =============================================

let aiCurrentUser = null;
let aiWorks = [];
let aiSelectedWork = null;
let aiSelectedAnalysis = null;


// =============================================
// HTML 안전 처리
// =============================================

function escapeHtml(value) {

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
// 스타일
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
            z-index: 99999;
            padding: 20px;
            box-sizing: border-box;
        }

        .ai-modal {
            width: 100%;
            max-width: 760px;
            max-height: 90vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 20px;
            padding: 28px;
            box-sizing: border-box;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
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
            font-size: 30px;
            cursor: pointer;
            color: #555;
        }

        .ai-work-selector {
            display: grid;
            gap: 10px;
        }

        .ai-work-button {
            width: 100%;
            padding: 16px;
            border: 1px solid #ddd;
            border-radius: 12px;
            background: #fafafa;
            text-align: left;
            cursor: pointer;
            transition: 0.2s;
        }

        .ai-work-button:hover {
            background: #eeeeee;
            transform: translateY(-1px);
        }

        .ai-work-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .ai-work-info {
            color: #777;
            font-size: 13px;
        }

        .ai-analysis-card {
            margin-top: 20px;
            padding: 22px;
            border-radius: 16px;
            background: #f7f7f7;
        }

        .ai-score {
            font-size: 42px;
            font-weight: 700;
            margin: 10px 0 22px;
        }

        .ai-result-row {
            display: grid;
            grid-template-columns: 110px 1fr;
            gap: 15px;
            padding: 13px 0;
            border-bottom: 1px solid #ddd;
            line-height: 1.5;
        }

        .ai-result-row:last-child {
            border-bottom: 0;
        }

        .ai-label {
            font-weight: 700;
        }

        .ai-description {
            margin-top: 20px;
            line-height: 1.7;
        }

        .ai-tags {
            margin-top: 12px;
        }

        .ai-tag {
            display: inline-block;
            margin: 4px;
            padding: 7px 12px;
            border-radius: 20px;
            background: #e8e8e8;
            font-size: 13px;
        }

        .ai-main-button {
            width: 100%;
            padding: 15px;
            border: 0;
            border-radius: 12px;
            background: #222;
            color: #fff;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
        }

        .ai-main-button:hover {
            opacity: 0.85;
        }

        .ai-empty {
            text-align: center;
            padding: 40px 20px;
            color: #777;
            line-height: 1.7;
        }

        .ai-loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        @media (max-width: 600px) {

            .ai-modal {
                padding: 20px;
            }

            .ai-result-row {
                grid-template-columns: 1fr;
                gap: 5px;
            }

        }

    `;

    document.head.appendChild(style);
}


// =============================================
// 로그인 상태 감시
// =============================================

if (auth) {

    onAuthStateChanged(auth, async function(user) {

        aiCurrentUser = user;

        if (user) {

            console.log(
                "AI 모듈 로그인 확인:",
                user.email
            );

            await loadAIWorks();

        } else {

            aiWorks = [];

            console.log(
                "AI 모듈: 로그인되지 않음"
            );
        }

    });

}


// =============================================
// 작품 데이터 불러오기
// =============================================

async function loadAIWorks() {

    if (!aiCurrentUser || !db) {
        return;
    }

    try {

        const worksRef =
            collection(
                db,
                "users",
                aiCurrentUser.uid,
                "works"
            );

        const q =
            query(
                worksRef,
                orderBy("createdAt", "desc")
            );

        const snapshot =
            await getDocs(q);

        aiWorks =
            snapshot.docs.map(function(doc) {

                return {
                    id: doc.id,
                    ...doc.data()
                };

            });

        console.log(
            "AI 모듈 작품:",
            aiWorks.length
        );

    } catch (error) {

        console.error(
            "AI 작품 불러오기 오류:",
            error
        );

        // createdAt 정렬 문제가 있을 경우
        // 기본 조회로 한 번 더 시도

        try {

            const worksRef =
                collection(
                    db,
                    "users",
                    aiCurrentUser.uid,
                    "works"
                );

            const snapshot =
                await getDocs(worksRef);

            aiWorks =
                snapshot.docs.map(function(doc) {

                    return {
                        id: doc.id,
                        ...doc.data()
                    };

                });

        } catch (retryError) {

            console.error(
                "AI 작품 재조회 오류:",
                retryError
            );
        }
    }
}


// =============================================
// AI 분석 화면 열기
// =============================================

window.openAIAnalysis = async function() {

    createAIStyle();

    // 로그인 확인
    if (!aiCurrentUser) {

        if (typeof window.showToast === "function") {

            window.showToast(
                "먼저 로그인해주세요."
            );

        } else {

            alert(
                "먼저 로그인해주세요."
            );
        }

        return;
    }


    // 최신 작품 다시 불러오기
    await loadAIWorks();


    // 기존 창 제거
    const oldModal =
        document.getElementById(
            "aiAnalysisModal"
        );

    if (oldModal) {
        oldModal.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.className =
        "ai-modal-overlay";

    overlay.id =
        "aiAnalysisModal";


    overlay.innerHTML = `

        <div class="ai-modal">

            <div class="ai-header">

                <h2>
                    CLAY DNA AI 분석
                </h2>

                <button
                    type="button"
                    class="ai-close"
                    id="aiCloseButton">

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


    document
        .getElementById("aiCloseButton")
        .addEventListener(
            "click",
            window.closeAIAnalysis
        );


    renderAIWorkSelector();

};


// =============================================
// 작품 선택 목록
// =============================================

function renderAIWorkSelector() {

    const container =
        document.getElementById(
            "aiWorkSelector"
        );

    if (!container) {
        return;
    }


    if (
        !Array.isArray(aiWorks) ||
        aiWorks.length === 0
    ) {

        container.innerHTML = `

            <div class="ai-empty">

                등록된 작품이 없습니다.

                <br><br>

                먼저
                <strong>
                    작품 등록하기
                </strong>
                에서 작품을 등록해주세요.

            </div>

        `;

        return;
    }


    container.innerHTML =
        aiWorks.map(function(work) {

            return `

                <button
                    type="button"
                    class="ai-work-button"
                    data-work-id="${escapeHtml(work.id)}">

                    <div class="ai-work-title">

                        ${escapeHtml(
                            work.title ||
                            "제목 없음"
                        )}

                    </div>

                    <div class="ai-work-info">

                        ${escapeHtml(
                            work.type ||
                            "종류 미입력"
                        )}

                        ·

                        ${escapeHtml(
                            work.technique ||
                            "기법 미입력"
                        )}

                        ${
                            work.clay
                                ? " · " +
                                  escapeHtml(work.clay)
                                : ""
                        }

                    </div>

                </button>

            `;

        }).join("");


    container
        .querySelectorAll(".ai-work-button")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    const workId =
                        button.dataset.workId;

                    selectAIWork(workId);

                }
            );

        });

}


// =============================================
// 작품 선택
// =============================================

function selectAIWork(workId) {

    const work =
        aiWorks.find(function(item) {

            return item.id === workId;

        });


    if (!work) {

        alert(
            "작품 정보를 찾을 수 없습니다."
        );

        return;
    }


    aiSelectedWork = work;

    runAIAnalysis(work);
}


// =============================================
// 분석 실행
// =============================================

function runAIAnalysis(work) {

    const result =
        document.getElementById(
            "aiAnalysisResult"
        );

    if (!result) {
        return;
    }


    result.innerHTML = `

        <div class="ai-analysis-card">

            <div class="ai-loading">

                작품 데이터를 분석하고 있습니다...

            </div>

        </div>

    `;


    setTimeout(function() {

        const analysis =
            analyzeCeramicWork(work);

        aiSelectedAnalysis =
            analysis;

        renderAIResult(
            work,
            analysis
        );

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


    // 형태
    let formCharacter =
        "기본적인 형태 중심의 작품";


    if (
        type.includes("항아리") ||
        text.includes("둥근") ||
        text.includes("곡선")
    ) {

        formCharacter =
            "곡선과 볼륨감이 강조된 형태";

    }

    else if (
        type.includes("컵") ||
        type.includes("접시")
    ) {

        formCharacter =
            "실용성과 안정적인 형태가 강조된 작품";

    }

    else if (
        type.includes("화병")
    ) {

        formCharacter =
            "수직적 구조와 공간성이 강조된 형태";

    }

    else if (
        type.includes("조형")
    ) {

        formCharacter =
            "조형성과 표현성이 강조된 작품";
    }


    // 제작기법
    let techniqueCharacter =
        technique ||
        "제작기법 정보 부족";


    if (text.includes("물레")) {

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
            "코일링을 이용한 형태 구성";
    }


    // 재료
    let materialCharacter =
        clay ||
        "사용 흙 정보 부족";


    if (text.includes("백자")) {

        materialCharacter =
            "백자 계열 흙을 사용한 밝고 정제된 표현";

    }

    else if (text.includes("청자")) {

        materialCharacter =
            "청자 계열 흙을 사용한 전통적인 도자 표현";

    }

    else if (text.includes("분청")) {

        materialCharacter =
            "분청 계열의 질감과 표현 가능성이 특징";

    }

    else if (text.includes("옹기")) {

        materialCharacter =
            "옹기 계열의 자연스러운 질감과 실용성이 특징";
    }


    // 표현
    let expression =
        "현재 등록된 작품 데이터를 기반으로 기본적인 특성을 분석했습니다.";


    if (description.length >= 30) {

        expression =
            "작품 설명에 비교적 충분한 정보가 있어 제작 의도와 표현 방향을 분석할 수 있습니다.";

    }


    if (
        text.includes("자연") ||
        text.includes("바다") ||
        text.includes("바람") ||
        text.includes("흙")
    ) {

        expression =
            "자연환경 또는 흙의 특성을 작품의 표현 요소로 활용하는 경향이 나타납니다.";

    }


    if (
        text.includes("교육") ||
        text.includes("장애") ||
        text.includes("치유") ||
        text.includes("사람")
    ) {

        expression =
            "사람과의 관계, 교육 또는 사회적 의미를 작품의 표현 요소로 활용하는 경향이 나타납니다.";
    }


    // 분석 충실도
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


    // DNA 태그
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

    if (
        text.includes("손성형") ||
        text.includes("손 성형")
    ) {
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

        score,

        formCharacter,

        techniqueCharacter,

        materialCharacter,

        expression,

        dnaTags

    };

}


// =============================================
// 분석 결과 표시
// =============================================

function renderAIResult(
    work,
    analysis
) {

    const result =
        document.getElementById(
            "aiAnalysisResult"
        );

    if (!result) {
        return;
    }


    result.innerHTML = `

        <div class="ai-analysis-card">

            <h3>

                ${escapeHtml(
                    work.title ||
                    "작품"
                )}

            </h3>


            <div class="ai-score">

                ${analysis.score}

                <span
                    style="
                        font-size:16px;
                        font-weight:400;
                    ">

                    / 100

                </span>

            </div>


            <div class="ai-result-row">

                <span class="ai-label">
                    형태 특성
                </span>

                <span>
                    ${escapeHtml(
                        analysis.formCharacter
                    )}
                </span>

            </div>


            <div class="ai-result-row">

                <span class="ai-label">
                    제작 특성
                </span>

                <span>
                    ${escapeHtml(
                        analysis.techniqueCharacter
                    )}
                </span>

            </div>


            <div class="ai-result-row">

                <span class="ai-label">
                    재료 특성
                </span>

                <span>
                    ${escapeHtml(
                        analysis.materialCharacter
                    )}
                </span>

            </div>


            <div class="ai-result-row">

                <span class="ai-label">
                    표현 방향
                </span>

                <span>
                    ${escapeHtml(
                        analysis.expression
                    )}
                </span>

            </div>


            <div
                class="ai-description">

                <strong>
                    CLAY DNA 키워드
                </strong>


                <div class="ai-tags">

                    ${analysis.dnaTags
                        .map(function(tag) {

                            return `

                                <span class="ai-tag">

                                    ${escapeHtml(tag)}

                                </span>

                            `;

                        })
                        .join("")}

                </div>

            </div>


            <button
                type="button"
                class="ai-main-button"
                id="saveAIAnalysisButton">

                분석 결과 저장

            </button>

        </div>

    `;


    document
        .getElementById(
            "saveAIAnalysisButton"
        )
        .addEventListener(
            "click",
            saveAIAnalysis
        );

}


// =============================================
// 현재는 저장 테스트
// 다음 단계에서 Firestore 저장 연결
// =============================================

async function saveAIAnalysis() {

    if (
        !aiSelectedWork ||
        !aiSelectedAnalysis
    ) {

        alert(
            "먼저 작품을 분석해주세요."
        );

        return;
    }


    console.log(
        "CLAY DNA 분석 결과:",
        {
            workId:
                aiSelectedWork.id,

            workTitle:
                aiSelectedWork.title,

            analysis:
                aiSelectedAnalysis
        }
    );


    if (typeof window.showToast === "function") {

        window.showToast(
            "AI 분석 결과가 생성되었습니다."
        );

    } else {

        alert(
            "AI 분석 결과가 생성되었습니다."
        );

    }

}


// =============================================
// 닫기
// =============================================

window.closeAIAnalysis =
    function() {

        const modal =
            document.getElementById(
                "aiAnalysisModal"
            );

        if (modal) {
            modal.remove();
        }

        aiSelectedWork = null;
        aiSelectedAnalysis = null;
    };


// =============================================
// AI 버튼 자동 연결
// =============================================

function connectAIButtons() {

    console.log(
        "CLAY DNA AI 버튼 연결 시작"
    );


    // -----------------------------------------
    // data-feature="analyze"
    // -----------------------------------------

    document
        .querySelectorAll(
            '[data-feature="analyze"]'
        )
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    window.openAIAnalysis();

                }
            );

        });


    // -----------------------------------------
    // data-nav="ai"
    // -----------------------------------------

    document
        .querySelectorAll(
            '[data-nav="ai"]'
        )
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    window.openAIAnalysis();

                }
            );

        });


    // -----------------------------------------
    // AI 메뉴 버튼이 별도 속성이 없는 경우
    // bottom navigation에서 텍스트 검사
    // -----------------------------------------

    document
        .querySelectorAll(
            "button, a"
        )
        .forEach(function(button) {

            const text =
                (button.textContent || "")
                .trim();

            if (
                text === "AI" ||
                text === "AI 분석" ||
                text.includes("AI 분석")
            ) {

                if (
                    !button.dataset.aiConnected
                ) {

                    button.dataset.aiConnected =
                        "true";

                    button.addEventListener(
                        "click",
                        function(event) {

                            event.preventDefault();
                            event.stopPropagation();

                            window.openAIAnalysis();

                        }
                    );

                }

            }

        });


    console.log(
        "CLAY DNA AI 버튼 연결 완료"
    );

}


// =============================================
// 초기화
// =============================================

createAIStyle();


// DOM이 이미 만들어진 경우
if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        connectAIButtons
    );

} else {

    connectAIButtons();

}


// app.js가 먼저 로딩되는 경우를 대비
setTimeout(
    connectAIButtons,
    1000
);


console.log(
    "CLAY DNA AI 분석 모듈 준비 완료"
);
