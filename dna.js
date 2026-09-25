// ============================================================
// CLAY DNA
// 개인 도자 작업 성향 분석 모듈
// Version 1.0
// ============================================================

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
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================================
// Firebase
// ============================================================

const firebaseApp =
    getApps().length > 0
        ? getApp()
        : null;

const auth = firebaseApp
    ? getAuth(firebaseApp)
    : null;

const db = firebaseApp
    ? getFirestore(firebaseApp)
    : null;


// ============================================================
// 상태
// ============================================================

let dnaCurrentUser = null;
let dnaWorks = [];
let dnaAnalyses = [];
let dnaProfile = null;


// ============================================================
// 공통 함수
// ============================================================

function escapeHTML(value) {

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


function showDNAToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// ============================================================
// Firebase 인증
// ============================================================

if (auth) {

    onAuthStateChanged(auth, async (user) => {

        dnaCurrentUser = user;

        if (!user) {

            dnaWorks = [];
            dnaAnalyses = [];
            dnaProfile = null;

            return;
        }

        console.log(
            "CLAY DNA DNA 모듈 로그인:",
            user.email
        );

        await loadDNAData();
    });

}


// ============================================================
// 작품 + AI 분석 데이터 불러오기
// ============================================================

async function loadDNAData() {

    if (!dnaCurrentUser || !db) {
        return;
    }

    try {

        dnaWorks = [];
        dnaAnalyses = [];

        const worksRef = collection(
            db,
            "users",
            dnaCurrentUser.uid,
            "works"
        );

        const worksSnapshot =
            await getDocs(worksRef);

        for (const workDoc of worksSnapshot.docs) {

            const work = {
                id: workDoc.id,
                ...workDoc.data()
            };

            dnaWorks.push(work);

            try {

                const analysisRef = doc(
                    db,
                    "users",
                    dnaCurrentUser.uid,
                    "works",
                    workDoc.id,
                    "analysis",
                    "latest"
                );

                const analysisSnapshot =
                    await getDoc(analysisRef);

                if (analysisSnapshot.exists()) {

                    dnaAnalyses.push({
                        workId: workDoc.id,
                        workTitle: work.title || "",
                        ...analysisSnapshot.data()
                    });

                }

            } catch (analysisError) {

                console.warn(
                    "AI 분석 데이터 읽기 실패:",
                    workDoc.id,
                    analysisError
                );

            }

        }

        console.log(
            "CLAY DNA 작품:",
            dnaWorks.length
        );

        console.log(
            "CLAY DNA AI 분석:",
            dnaAnalyses.length
        );

    } catch (error) {

        console.error(
            "CLAY DNA 데이터 불러오기 오류:",
            error
        );

    }

}


// ============================================================
// DNA 화면 열기
// ============================================================

window.openCLAYDNA = async function () {

    if (!dnaCurrentUser) {

        showDNAToast(
            "로그인 후 CLAY DNA를 확인할 수 있습니다."
        );

        return;
    }

    await loadDNAData();

    createDNAModal();

    renderDNAProfile();
};


// ============================================================
// DNA 프로필 계산
// ============================================================

function buildDNAProfile() {

    if (!dnaAnalyses.length) {

        return {
            totalWorks: dnaWorks.length,
            analyzedWorks: 0,
            score: 0,
            forms: [],
            techniques: [],
            materials: [],
            expressions: [],
            tags: [],
            summary:
                "아직 AI 분석 데이터가 없습니다."
        };

    }


    const formMap = {};
    const techniqueMap = {};
    const materialMap = {};
    const expressionMap = {};
    const tagMap = {};


    dnaAnalyses.forEach((analysis) => {

        addFrequency(
            formMap,
            analysis.formCharacter
        );

        addFrequency(
            techniqueMap,
            analysis.techniqueCharacter
        );

        addFrequency(
            materialMap,
            analysis.materialCharacter
        );

        addFrequency(
            expressionMap,
            analysis.expression
        );


        if (Array.isArray(analysis.dnaTags)) {

            analysis.dnaTags.forEach((tag) => {

                addFrequency(
                    tagMap,
                    tag
                );

            });

        }

    });


    const forms =
        getTopItems(formMap, 5);

    const techniques =
        getTopItems(techniqueMap, 5);

    const materials =
        getTopItems(materialMap, 5);

    const expressions =
        getTopItems(expressionMap, 5);

    const tags =
        getTopItems(tagMap, 10);


    const scores =
        dnaAnalyses
            .map(item => Number(item.score))
            .filter(score => !isNaN(score));


    const averageScore =
        scores.length
            ? Math.round(
                scores.reduce(
                    (sum, value) => sum + value,
                    0
                ) / scores.length
            )
            : 0;


    return {

        totalWorks: dnaWorks.length,

        analyzedWorks:
            dnaAnalyses.length,

        score:
            averageScore,

        forms,

        techniques,

        materials,

        expressions,

        tags,

        summary:
            createDNASummary(
                forms,
                techniques,
                materials,
                expressions,
                tags
            )

    };

}


// ============================================================
// 빈도 계산
// ============================================================

function addFrequency(map, value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return;
    }

    const text =
        String(value).trim();

    if (!text) {
        return;
    }

    map[text] =
        (map[text] || 0) + 1;
}


// ============================================================
// 상위 데이터 추출
// ============================================================

function getTopItems(map, limit) {

    return Object.entries(map)

        .sort((a, b) => b[1] - a[1])

        .slice(0, limit)

        .map(([name, count]) => ({
            name,
            count
        }));

}


// ============================================================
// DNA 요약문
// ============================================================

function createDNASummary(
    forms,
    techniques,
    materials,
    expressions,
    tags
) {

    const form =
        forms.length
            ? forms[0].name
            : "다양한 형태";

    const technique =
        techniques.length
            ? techniques[0].name
            : "다양한 기법";

    const material =
        materials.length
            ? materials[0].name
            : "다양한 재료";

    const expression =
        expressions.length
            ? expressions[0].name
            : "다양한 표현";

    return `
현재까지 등록된 작품에서는
<strong>${escapeHTML(form)}</strong> 형태와
<strong>${escapeHTML(technique)}</strong> 기법,
<strong>${escapeHTML(material)}</strong> 재료의 특징이
상대적으로 많이 나타납니다.

작품의 표현에서는
<strong>${escapeHTML(expression)}</strong> 성향이
반복적으로 관찰됩니다.

이 결과는 현재 등록된 작품과 AI 분석 데이터를 기반으로
계산된 개인 작업 성향의 초기 DNA입니다.
`;

}


// ============================================================
// DNA 프로필 저장
// ============================================================

async function saveDNAProfile() {

    if (!dnaCurrentUser || !db) {
        return;
    }

    try {

        const profile =
            buildDNAProfile();

        const profileRef =
            doc(
                db,
                "users",
                dnaCurrentUser.uid,
                "dna",
                "profile"
            );

        await setDoc(
            profileRef,
            {
                ...profile,
                updatedAt: serverTimestamp(),
                version: "1.0"
            }
        );

        dnaProfile = profile;

        showDNAToast(
            "CLAY DNA 프로필이 저장되었습니다."
        );

        console.log(
            "CLAY DNA 저장 완료:",
            profile
        );

    } catch (error) {

        console.error(
            "CLAY DNA 저장 오류:",
            error
        );

        showDNAToast(
            "DNA 저장 중 오류가 발생했습니다."
        );

    }

}


// ============================================================
// DNA 모달 생성
// ============================================================

function createDNAModal() {

    if (document.getElementById("clayDNAModal")) {
        return;
    }


    const modal =
        document.createElement("div");

    modal.id =
        "clayDNAModal";

    modal.className =
        "clay-dna-modal";


    modal.innerHTML = `

        <div class="clay-dna-overlay"></div>

        <div class="clay-dna-panel">

            <div class="clay-dna-header">

                <div>
                    <div class="clay-dna-label">
                        PERSONAL CERAMIC IDENTITY
                    </div>

                    <h2>
                        CLAY DNA
                    </h2>

                    <p>
                        나의 도자 작업 성향 분석
                    </p>
                </div>

                <button
                    type="button"
                    id="closeCLAYDNAModal">
                    ×
                </button>

            </div>


            <div
                id="clayDNAContent"
                class="clay-dna-content">
            </div>

        </div>
    `;


    document.body.appendChild(modal);


    modal
        .querySelector(".clay-dna-overlay")
        .addEventListener(
            "click",
            closeDNAModal
        );


    document
        .getElementById("closeCLAYDNAModal")
        .addEventListener(
            "click",
            closeDNAModal
        );

}


// ============================================================
// DNA 모달 닫기
// ============================================================

function closeDNAModal() {

    const modal =
        document.getElementById(
            "clayDNAModal"
        );

    if (modal) {
        modal.remove();
    }

}


// ============================================================
// DNA 화면 출력
// ============================================================

function renderDNAProfile() {

    const container =
        document.getElementById(
            "clayDNAContent"
        );

    if (!container) {
        return;
    }


    const profile =
        buildDNAProfile();


    dnaProfile =
        profile;


    if (!profile.analyzedWorks) {

        container.innerHTML = `

            <div class="dna-empty">

                <div class="dna-empty-icon">
                    DNA
                </div>

                <h3>
                    아직 CLAY DNA가 만들어지지 않았습니다.
                </h3>

                <p>
                    작품을 등록하고 AI 분석 결과를 저장하면
                    나만의 도자 작업 DNA가 만들어집니다.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML = `

        <div class="dna-score-card">

            <div class="dna-score-label">
                CLAY DNA SCORE
            </div>

            <div class="dna-score">
                ${profile.score}
            </div>

            <div class="dna-score-desc">
                ${profile.analyzedWorks}개 작품 분석
            </div>

        </div>


        <div class="dna-summary-card">

            <div class="dna-section-title">
                나의 작업 성향
            </div>

            <div class="dna-summary">
                ${profile.summary}
            </div>

        </div>


        <div class="dna-grid">

            ${renderDNASection(
                "선호 형태",
                profile.forms
            )}

            ${renderDNASection(
                "선호 기법",
                profile.techniques
            )}

            ${renderDNASection(
                "선호 재료",
                profile.materials
            )}

            ${renderDNASection(
                "주요 표현",
                profile.expressions
            )}

        </div>


        <div class="dna-tags-card">

            <div class="dna-section-title">
                반복되는 DNA TAG
            </div>

            <div class="dna-tags">

                ${
                    profile.tags.length
                        ? profile.tags.map(item => `
                            <span class="dna-tag">
                                #${escapeHTML(item.name)}
                                <small>
                                    ${item.count}
                                </small>
                            </span>
                        `).join("")
                        : "<span>아직 태그가 없습니다.</span>"
                }

            </div>

        </div>


        <div class="dna-info">

            <div>
                등록 작품
                <strong>
                    ${profile.totalWorks}
                </strong>
            </div>

            <div>
                AI 분석 작품
                <strong>
                    ${profile.analyzedWorks}
                </strong>
            </div>

        </div>


        <button
            type="button"
            id="saveDNAProfileButton"
            class="dna-save-button">

            CLAY DNA 프로필 저장

        </button>

    `;


    const saveButton =
        document.getElementById(
            "saveDNAProfileButton"
        );

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveDNAProfile
        );

    }

}


// ============================================================
// DNA 항목 출력
// ============================================================

function renderDNASection(
    title,
    items
) {

    return `

        <div class="dna-section-card">

            <div class="dna-section-title">
                ${title}
            </div>

            <div class="dna-list">

                ${
                    items.length
                        ? items.map(item => `

                            <div class="dna-list-item">

                                <span>
                                    ${escapeHTML(item.name)}
                                </span>

                                <strong>
                                    ${item.count}
                                </strong>

                            </div>

                        `).join("")
                        : `
                            <div class="dna-list-empty">
                                데이터 없음
                            </div>
                        `
                }

            </div>

        </div>

    `;

}


// ============================================================
// 버튼 연결
// ============================================================

function connectDNAButtons() {

    console.log(
        "CLAY DNA 버튼 연결 시작"
    );


    document
        .querySelectorAll(
            '[data-feature="dna"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.openCLAYDNA();

                }
            );

        });


    document
        .querySelectorAll(
            '[data-nav="dna"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.openCLAYDNA();

                }
            );

        });


    console.log(
        "CLAY DNA 버튼 연결 완료"
    );

}


// ============================================================
// CSS
// ============================================================

function createDNAStyle() {

    if (
        document.getElementById(
            "clayDNAStyle"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "clayDNAStyle";


    style.textContent = `

        .clay-dna-modal {

            position: fixed;
            inset: 0;
            z-index: 99999;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

        }


        .clay-dna-overlay {

            position: absolute;
            inset: 0;

            background:
                rgba(0,0,0,0.65);

        }


        .clay-dna-panel {

            position: relative;

            width: min(
                920px,
                100%
            );

            max-height: 90vh;

            overflow-y: auto;

            background:
                #ffffff;

            border-radius: 24px;

            box-shadow:
                0 20px 60px
                rgba(0,0,0,0.25);

            padding: 28px;

        }


        .clay-dna-header {

            display: flex;
            justify-content: space-between;
            align-items: flex-start;

            border-bottom:
                1px solid #eeeeee;

            padding-bottom: 20px;

            margin-bottom: 24px;

        }


        .clay-dna-label {

            font-size: 11px;

            letter-spacing:
                2px;

            color:
                #888888;

            margin-bottom: 6px;

        }


        .clay-dna-header h2 {

            margin: 0;

            font-size: 30px;

        }


        .clay-dna-header p {

            margin:
                6px 0 0;

            color:
                #777777;

        }


        .clay-dna-header button {

            width: 40px;
            height: 40px;

            border: none;

            border-radius: 50%;

            background:
                #f2f2f2;

            font-size: 25px;

            cursor: pointer;

        }


        .dna-score-card {

            text-align: center;

            padding: 30px;

            border-radius: 20px;

            background:
                #f5f1ea;

            margin-bottom: 18px;

        }


        .dna-score-label {

            font-size: 12px;

            letter-spacing:
                2px;

            color:
                #777777;

        }


        .dna-score {

            font-size: 64px;

            font-weight: 700;

            margin:
                8px 0;

        }


        .dna-score-desc {

            color:
                #777777;

        }


        .dna-summary-card {

            padding: 22px;

            border:
                1px solid #eeeeee;

            border-radius: 18px;

            margin-bottom: 18px;

        }


        .dna-section-title {

            font-weight: 700;

            margin-bottom: 14px;

        }


        .dna-summary {

            line-height: 1.8;

            color:
                #555555;

        }


        .dna-grid {

            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 15px;

            margin-bottom: 18px;

        }


        .dna-section-card {

            border:
                1px solid #eeeeee;

            border-radius: 18px;

            padding: 20px;

        }


        .dna-list-item {

            display: flex;

            justify-content:
                space-between;

            align-items: center;

            padding:
                10px 0;

            border-bottom:
                1px solid #f1f1f1;

        }


        .dna-list-item:last-child {

            border-bottom:
                none;

        }


        .dna-list-item strong {

            font-size: 13px;

            color:
                #888888;

        }


        .dna-list-empty {

            color:
                #999999;

            padding:
                10px 0;

        }


        .dna-tags-card {

            border:
                1px solid #eeeeee;

            border-radius: 18px;

            padding: 20px;

        }


        .dna-tags {

            display: flex;

            flex-wrap: wrap;

            gap: 8px;

        }


        .dna-tag {

            display: inline-flex;

            align-items: center;

            gap: 5px;

            padding:
                8px 12px;

            border-radius: 999px;

            background:
                #f2f2f2;

            font-size: 13px;

        }


        .dna-tag small {

            color:
                #888888;

        }


        .dna-info {

            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 12px;

            margin-top: 18px;

        }


        .dna-info div {

            padding: 16px;

            border-radius: 14px;

            background:
                #f7f7f7;

            text-align: center;

            color:
                #777777;

        }


        .dna-info strong {

            display: block;

            font-size: 24px;

            color:
                #222222;

            margin-top: 5px;

        }


        .dna-save-button {

            width: 100%;

            margin-top: 18px;

            padding: 15px;

            border: none;

            border-radius: 14px;

            background:
                #222222;

            color:
                #ffffff;

            font-size: 15px;

            cursor: pointer;

        }


        .dna-empty {

            text-align: center;

            padding:
                70px 20px;

        }


        .dna-empty-icon {

            display: inline-flex;

            align-items: center;
            justify-content: center;

            width: 80px;
            height: 80px;

            border-radius: 50%;

            background:
                #f3f0ea;

            font-weight: 700;

            margin-bottom: 20px;

        }


        .dna-empty h3 {

            margin-bottom: 10px;

        }


        .dna-empty p {

            color:
                #777777;

            line-height: 1.7;

        }


        @media (
            max-width: 650px
        ) {

            .clay-dna-panel {

                padding: 20px;

                border-radius: 18px;

            }


            .dna-grid {

                grid-template-columns:
                    1fr;

            }


            .dna-score {

                font-size: 52px;

            }

        }

    `;


    document.head.appendChild(style);

}


// ============================================================
// 초기화
// ============================================================

createDNAStyle();

connectDNAButtons();

console.log(
    "CLAY DNA 개인 DNA 모듈 준비 완료"
);
