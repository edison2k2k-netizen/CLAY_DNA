// ============================================================
// CLAY DNA 2.0
// 개인 도자 작업 성향 분석 모듈
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

const auth =
    firebaseApp
        ? getAuth(firebaseApp)
        : null;

const db =
    firebaseApp
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
// 공통
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
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

    const toast =
        document.getElementById("toast");

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

    onAuthStateChanged(
        auth,
        async (user) => {

            dnaCurrentUser = user;

            if (!user) {

                dnaWorks = [];

                dnaAnalyses = [];

                dnaProfile = null;

                return;
            }

            console.log(
                "CLAY DNA 로그인:",
                user.email
            );

            await loadDNAData();

        }
    );

}


// ============================================================
// 작품 및 AI 분석 데이터 로드
// ============================================================

async function loadDNAData() {

    if (
        !dnaCurrentUser ||
        !db
    ) {
        return;
    }

    try {

        dnaWorks = [];

        dnaAnalyses = [];


        const worksRef =
            collection(
                db,
                "users",
                dnaCurrentUser.uid,
                "works"
            );


        const worksSnapshot =
            await getDocs(worksRef);


        for (
            const workDoc
            of worksSnapshot.docs
        ) {

            const work = {

                id: workDoc.id,

                ...workDoc.data()

            };


            dnaWorks.push(work);


            try {

                const analysisRef =
                    doc(
                        db,
                        "users",
                        dnaCurrentUser.uid,
                        "works",
                        workDoc.id,
                        "analysis",
                        "latest"
                    );


                const analysisSnapshot =
                    await getDoc(
                        analysisRef
                    );


                if (
                    analysisSnapshot.exists()
                ) {

                    dnaAnalyses.push({

                        workId:
                            workDoc.id,

                        workTitle:
                            work.title || "",

                        ...analysisSnapshot.data()

                    });

                }

            } catch (error) {

                console.warn(
                    "AI 분석 읽기 실패:",
                    workDoc.id,
                    error
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
            "CLAY DNA 데이터 로드 오류:",
            error
        );

    }

}


// ============================================================
// 문자열을 배열로 변환
// ============================================================

function normalizeText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return [];
    }


    if (Array.isArray(value)) {

        return value
            .flatMap(item =>
                normalizeText(item)
            );

    }


    return String(value)

        .split(/[,/|·•\n]+/)

        .map(item =>
            item.trim()
        )

        .filter(Boolean);

}


// ============================================================
// 키워드 정리
// ============================================================

function cleanKeyword(value) {

    if (!value) {
        return "";
    }


    let text =
        String(value)
            .trim();


    // 너무 긴 문장은 핵심 단어만 추출
    if (
        text.length > 30
    ) {

        const words =
            text.split(/\s+/);

        text =
            words
                .slice(0, 3)
                .join(" ");

    }


    return text;

}


// ============================================================
// 빈도 계산
// ============================================================

function addFrequency(
    map,
    value
) {

    const keyword =
        cleanKeyword(value);


    if (!keyword) {
        return;
    }


    map[keyword] =
        (map[keyword] || 0) + 1;

}


// ============================================================
// 상위 항목
// ============================================================

function getTopItems(
    map,
    limit = 8
) {

    return Object.entries(map)

        .sort(
            (a, b) =>
                b[1] - a[1]
        )

        .slice(0, limit)

        .map(
            ([name, count]) => ({

                name,

                count

            })
        );

}


// ============================================================
// DNA 키워드 추출
// ============================================================

function extractKeywords(
    analyses,
    field
) {

    const map = {};


    analyses.forEach(
        analysis => {

            const values =
                normalizeText(
                    analysis[field]
                );


            values.forEach(
                value => {

                    addFrequency(
                        map,
                        value
                    );

                }
            );

        }
    );


    return getTopItems(
        map,
        8
    );

}


// ============================================================
// DNA TAG 추출
// ============================================================

function extractTags(
    analyses
) {

    const map = {};


    analyses.forEach(
        analysis => {

            const tags =
                normalizeText(
                    analysis.dnaTags
                );


            tags.forEach(
                tag => {

                    const keyword =
                        cleanKeyword(tag);

                    if (!keyword) {
                        return;
                    }

                    map[keyword] =
                        (map[keyword] || 0) + 1;

                }
            );

        }
    );


    return getTopItems(
        map,
        15
    );

}


// ============================================================
// DNA SCORE
// ============================================================

function calculateDNAScore() {

    if (
        dnaAnalyses.length === 0
    ) {
        return 0;
    }


    const scores =
        dnaAnalyses

            .map(
                item =>
                    Number(item.score)
            )

            .filter(
                value =>
                    !isNaN(value)
            );


    if (
        scores.length === 0
    ) {
        return 0;
    }


    return Math.round(

        scores.reduce(
            (sum, value) =>
                sum + value,
            0
        )
        /
        scores.length

    );

}


// ============================================================
// 개인 작업 성향 문장
// ============================================================

function createDNASummary(
    forms,
    techniques,
    materials,
    expressions,
    tags
) {

    const form =
        forms[0]
            ? forms[0].name
            : "다양한 형태";


    const technique =
        techniques[0]
            ? techniques[0].name
            : "다양한 기법";


    const material =
        materials[0]
            ? materials[0].name
            : "다양한 재료";


    const expression =
        expressions[0]
            ? expressions[0].name
            : "다양한 표현";


    const tag =
        tags[0]
            ? tags[0].name
            : "개성 있는 표현";


    return `
현재 등록된 작품 ${dnaWorks.length}개와
AI 분석 ${dnaAnalyses.length}개를 기준으로
<strong>${escapeHTML(form)}</strong> 형태,
<strong>${escapeHTML(technique)}</strong> 기법,
<strong>${escapeHTML(material)}</strong> 재료,
<strong>${escapeHTML(expression)}</strong> 표현이
주요 작업 성향으로 나타나고 있습니다.

반복적으로 관찰되는 대표 DNA 키워드는
<strong>${escapeHTML(tag)}</strong>입니다.
`;

}


// ============================================================
// DNA PROFILE 생성
// ============================================================

function buildDNAProfile() {

    const forms =
        extractKeywords(
            dnaAnalyses,
            "formCharacter"
        );


    const techniques =
        extractKeywords(
            dnaAnalyses,
            "techniqueCharacter"
        );


    const materials =
        extractKeywords(
            dnaAnalyses,
            "materialCharacter"
        );


    const expressions =
        extractKeywords(
            dnaAnalyses,
            "expression"
        );


    const tags =
        extractTags(
            dnaAnalyses
        );


    const score =
        calculateDNAScore();


    const summary =
        createDNASummary(
            forms,
            techniques,
            materials,
            expressions,
            tags
        );


    return {

        totalWorks:
            dnaWorks.length,

        analyzedWorks:
            dnaAnalyses.length,

        score,

        forms,

        techniques,

        materials,

        expressions,

        tags,

        summary

    };

}


// ============================================================
// DNA 프로필 저장
// ============================================================

async function saveDNAProfile(
    showMessage = true
) {

    if (
        !dnaCurrentUser ||
        !db
    ) {
        return false;
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

                updatedAt:
                    serverTimestamp(),

                version:
                    "2.0"

            },
            {
                merge: true
            }
        );


        dnaProfile =
            profile;


        console.log(
            "CLAY DNA 저장 완료:",
            profile
        );


        if (showMessage) {

            showDNAToast(
                "CLAY DNA 프로필이 업데이트되었습니다."
            );

        }


        return true;


    } catch (error) {

        console.error(
            "CLAY DNA 저장 오류:",
            error
        );


        if (showMessage) {

            showDNAToast(
                "DNA 저장 중 오류가 발생했습니다."
            );

        }


        return false;

    }

}


// ============================================================
// AI 분석 완료 후 자동 갱신
// ============================================================

window.refreshCLAYDNA =
    async function () {

        if (
            !dnaCurrentUser
        ) {

            console.log(
                "CLAY DNA 자동 갱신 대기"
            );

            return false;

        }


        await loadDNAData();


        return await saveDNAProfile(
            false
        );

    };


// ============================================================
// DNA 화면 열기
// ============================================================

window.openCLAYDNA =
    async function () {

        if (
            !dnaCurrentUser
        ) {

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
// DNA 모달
// ============================================================

function createDNAModal() {

    if (
        document.getElementById(
            "clayDNAModal"
        )
    ) {
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


    document.body.appendChild(
        modal
    );


    modal
        .querySelector(
            ".clay-dna-overlay"
        )
        .addEventListener(
            "click",
            closeDNAModal
        );


    document
        .getElementById(
            "closeCLAYDNAModal"
        )
        .addEventListener(
            "click",
            closeDNAModal
        );

}


// ============================================================
// 모달 닫기
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
// DNA BAR
// ============================================================

function renderDNAItems(
    items
) {

    if (
        !items ||
        items.length === 0
    ) {

        return `
            <div class="dna-list-empty">
                아직 데이터가 없습니다.
            </div>
        `;

    }


    const max =
        Math.max(
            ...items.map(
                item => item.count
            )
        );


    return items
        .map(
            item => {

                const percent =
                    Math.max(
                        15,
                        Math.round(
                            (
                                item.count /
                                max
                            ) * 100
                        )
                    );


                return `

                    <div
                        class="dna-bar-item">

                        <div
                            class="dna-bar-top">

                            <span>
                                ${escapeHTML(
                                    item.name
                                )}
                            </span>

                            <strong>
                                ${item.count}
                            </strong>

                        </div>

                        <div
                            class="dna-bar-track">

                            <div
                                class="dna-bar-fill"
                                style="width:${percent}%">
                            </div>

                        </div>

                    </div>

                `;

            }
        )
        .join("");

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


    if (
        profile.analyzedWorks === 0
    ) {

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

        <!-- SCORE -->

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


        <!-- SUMMARY -->

        <div class="dna-summary-card">

            <div class="dna-section-title">
                나의 작업 성향
            </div>

            <div class="dna-summary">
                ${profile.summary}
            </div>

        </div>


        <!-- DNA GRID -->

        <div class="dna-grid">

            <div class="dna-section-card">

                <div class="dna-section-title">
                    형태 DNA
                </div>

                <div class="dna-bars">
                    ${renderDNAItems(
                        profile.forms
                    )}
                </div>

            </div>


            <div class="dna-section-card">

                <div class="dna-section-title">
                    기법 DNA
                </div>

                <div class="dna-bars">
                    ${renderDNAItems(
                        profile.techniques
                    )}
                </div>

            </div>


            <div class="dna-section-card">

                <div class="dna-section-title">
                    재료 DNA
                </div>

                <div class="dna-bars">
                    ${renderDNAItems(
                        profile.materials
                    )}
                </div>

            </div>


            <div class="dna-section-card">

                <div class="dna-section-title">
                    표현 DNA
                </div>

                <div class="dna-bars">
                    ${renderDNAItems(
                        profile.expressions
                    )}
                </div>

            </div>

        </div>


        <!-- TAG -->

        <div class="dna-tags-card">

            <div class="dna-section-title">
                반복되는 DNA TAG
            </div>

            <div class="dna-tags">

                ${
                    profile.tags.length

                    ?

                    profile.tags
                        .map(
                            item => `

                                <span
                                    class="dna-tag">

                                    #${escapeHTML(
                                        item.name
                                    )}

                                    <small>
                                        ${item.count}
                                    </small>

                                </span>

                            `
                        )
                        .join("")

                    :

                    `
                        <span>
                            아직 태그가 없습니다.
                        </span>
                    `
                }

            </div>

        </div>


        <!-- DATA -->

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


        <!-- SAVE -->

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
            async () => {

                await saveDNAProfile(
                    true
                );

            }
        );

    }

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
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        window.openCLAYDNA();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '[data-nav="dna"]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        window.openCLAYDNA();

                    }
                );

            }
        );


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

            width:
                min(920px, 100%);

            max-height:
                90vh;

            overflow-y: auto;

            background:
                #ffffff;

            border-radius:
                24px;

            box-shadow:
                0 20px 60px
                rgba(0,0,0,0.25);

            padding:
                28px;

        }


        .clay-dna-header {

            display: flex;

            justify-content:
                space-between;

            align-items:
                flex-start;

            border-bottom:
                1px solid #eeeeee;

            padding-bottom:
                20px;

            margin-bottom:
                24px;

        }


        .clay-dna-label {

            font-size:
                11px;

            letter-spacing:
                2px;

            color:
                #888888;

            margin-bottom:
                6px;

        }


        .clay-dna-header h2 {

            margin:
                0;

            font-size:
                30px;

        }


        .clay-dna-header p {

            margin:
                6px 0 0;

            color:
                #777777;

        }


        .clay-dna-header button {

            width:
                40px;

            height:
                40px;

            border:
                none;

            border-radius:
                50%;

            background:
                #f2f2f2;

            font-size:
                25px;

            cursor:
                pointer;

        }


        .dna-score-card {

            text-align:
                center;

            padding:
                30px;

            border-radius:
                20px;

            background:
                #f5f1ea;

            margin-bottom:
                18px;

        }


        .dna-score-label {

            font-size:
                12px;

            letter-spacing:
                2px;

            color:
                #777777;

        }


        .dna-score {

            font-size:
                64px;

            font-weight:
                700;

            margin:
                8px 0;

        }


        .dna-score-desc {

            color:
                #777777;

        }


        .dna-summary-card {

            padding:
                22px;

            border:
                1px solid #eeeeee;

            border-radius:
                18px;

            margin-bottom:
                18px;

        }


        .dna-section-title {

            font-weight:
                700;

            margin-bottom:
                14px;

        }


        .dna-summary {

            line-height:
                1.8;

            color:
                #555555;

        }


        .dna-grid {

            display:
                grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap:
                15px;

            margin-bottom:
                18px;

        }


        .dna-section-card {

            border:
                1px solid #eeeeee;

            border-radius:
                18px;

            padding:
                20px;

        }


        .dna-bar-item {

            margin-bottom:
                15px;

        }


        .dna-bar-item:last-child {

            margin-bottom:
                0;

        }


        .dna-bar-top {

            display:
                flex;

            justify-content:
                space-between;

            gap:
                10px;

            margin-bottom:
                6px;

            font-size:
                13px;

        }


        .dna-bar-top strong {

            color:
                #888888;

        }


        .dna-bar-track {

            width:
                100%;

            height:
                7px;

            border-radius:
                10px;

            background:
                #eeeeee;

            overflow:
                hidden;

        }


        .dna-bar-fill {

            height:
                100%;

            border-radius:
                10px;

            background:
                #333333;

        }


        .dna-tags-card {

            border:
                1px solid #eeeeee;

            border-radius:
                18px;

            padding:
                20px;

        }


        .dna-tags {

            display:
                flex;

            flex-wrap:
                wrap;

            gap:
                8px;

        }


        .dna-tag {

            display:
                inline-flex;

            align-items:
                center;

            gap:
                5px;

            padding:
                8px 12px;

            border-radius:
                999px;

            background:
                #f2f2f2;

            font-size:
                13px;

        }


        .dna-tag small {

            color:
                #888888;

        }


        .dna-info {

            display:
                grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap:
                12px;

            margin-top:
                18px;

        }


        .dna-info div {

            padding:
                16px;

            border-radius:
                14px;

            background:
                #f7f7f7;

            text-align:
                center;

            color:
                #777777;

        }


        .dna-info strong {

            display:
                block;

            font-size:
                24px;

            color:
                #222222;

            margin-top:
                5px;

        }


        .dna-save-button {

            width:
                100%;

            margin-top:
                18px;

            padding:
                15px;

            border:
                none;

            border-radius:
                14px;

            background:
                #222222;

            color:
                #ffffff;

            font-size:
                15px;

            cursor:
                pointer;

        }


        .dna-empty {

            text-align:
                center;

            padding:
                70px 20px;

        }


        .dna-empty-icon {

            display:
                inline-flex;

            align-items:
                center;

            justify-content:
                center;

            width:
                80px;

            height:
                80px;

            border-radius:
                50%;

            background:
                #f3f0ea;

            font-weight:
                700;

            margin-bottom:
                20px;

        }


        .dna-empty h3 {

            margin-bottom:
                10px;

        }


        .dna-empty p {

            color:
                #777777;

            line-height:
                1.7;

        }


        @media (
            max-width: 650px
        ) {

            .clay-dna-panel {

                padding:
                    20px;

                border-radius:
                    18px;

            }


            .dna-grid {

                grid-template-columns:
                    1fr;

            }


            .dna-score {

                font-size:
                    52px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


// ============================================================
// 초기화
// ============================================================

createDNAStyle();

connectDNAButtons();


console.log(
    "CLAY DNA 2.0 모듈 준비 완료"
);
