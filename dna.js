// ============================================================
// CLAY DNA 3.0
// 개인 도자 작업 DNA 대시보드
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
                "CLAY DNA 3.0 로그인:",
                user.email
            );

            await loadDNAData();

        }
    );

}


// ============================================================
// 작품 + AI 분석 데이터
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


        dnaWorks.sort(
            sortWorksByDate
        );


        console.log(
            "CLAY DNA 작품:",
            dnaWorks.length
        );


        console.log(
            "CLAY DNA 분석:",
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
// 날짜 정렬
// ============================================================

function sortWorksByDate(a, b) {

    const dateA =
        getWorkDate(a);

    const dateB =
        getWorkDate(b);


    return dateA - dateB;

}


function getWorkDate(work) {

    if (
        work.createdAt &&
        typeof work.createdAt.toDate === "function"
    ) {

        return work.createdAt
            .toDate()
            .getTime();

    }


    if (work.productionDate) {

        const timestamp =
            new Date(
                work.productionDate
            ).getTime();


        if (!isNaN(timestamp)) {
            return timestamp;
        }

    }


    return 0;

}


// ============================================================
// 문자열 처리
// ============================================================

function normalizeText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return [];
    }


    if (Array.isArray(value)) {

        return value.flatMap(
            item =>
                normalizeText(item)
        );

    }


    return String(value)

        .split(/[,/|·•\n]+/)

        .map(
            item =>
                item.trim()
        )

        .filter(Boolean);

}


function cleanKeyword(value) {

    if (!value) {
        return "";
    }


    let text =
        String(value).trim();


    if (
        text.length > 30
    ) {

        text =
            text
                .split(/\s+/)
                .slice(0, 3)
                .join(" ");

    }


    return text;

}


// ============================================================
// 빈도
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
// DNA 추출
// ============================================================

function extractKeywords(
    field
) {

    const map = {};


    dnaAnalyses.forEach(
        analysis => {

            normalizeText(
                analysis[field]
            ).forEach(
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


function extractTags() {

    const map = {};


    dnaAnalyses.forEach(
        analysis => {

            normalizeText(
                analysis.dnaTags
            ).forEach(
                tag => {

                    addFrequency(
                        map,
                        tag
                    );

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
// 평균 점수
// ============================================================

function calculateDNAScore() {

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
// DNA 프로필
// ============================================================

function buildDNAProfile() {

    const forms =
        extractKeywords(
            "formCharacter"
        );


    const techniques =
        extractKeywords(
            "techniqueCharacter"
        );


    const materials =
        extractKeywords(
            "materialCharacter"
        );


    const expressions =
        extractKeywords(
            "expression"
        );


    const tags =
        extractTags();


    return {

        totalWorks:
            dnaWorks.length,

        analyzedWorks:
            dnaAnalyses.length,

        score:
            calculateDNAScore(),

        forms,
        techniques,
        materials,
        expressions,
        tags

    };

}


// ============================================================
// AI 분석 매칭
// ============================================================

function getAnalysisForWork(
    workId
) {

    return dnaAnalyses.find(
        analysis =>
            analysis.workId === workId
    );

}


// ============================================================
// 작품별 DNA
// ============================================================

function getWorkDNA(work) {

    const analysis =
        getAnalysisForWork(
            work.id
        );


    if (!analysis) {

        return {

            score: 0,

            tags: []

        };

    }


    return {

        score:
            Number(
                analysis.score
            ) || 0,

        tags:
            normalizeText(
                analysis.dnaTags
            ).slice(0, 5)

    };

}


// ============================================================
// 작업 변천 데이터
// ============================================================

function buildTimeline() {

    return dnaWorks

        .filter(
            work =>
                getAnalysisForWork(
                    work.id
                )
        )

        .map(
            work => {

                const analysis =
                    getAnalysisForWork(
                        work.id
                    );


                return {

                    id:
                        work.id,

                    title:
                        work.title ||
                        "작품",

                    date:
                        work.productionDate ||
                        "",

                    score:
                        Number(
                            analysis.score
                        ) || 0,

                    tags:
                        normalizeText(
                            analysis.dnaTags
                        ).slice(0, 3)

                };

            }
        );

}


// ============================================================
// 작업 성향 요약
// ============================================================

function createSummary(
    profile
) {

    const form =
        profile.forms[0]
            ? profile.forms[0].name
            : "다양한 형태";


    const technique =
        profile.techniques[0]
            ? profile.techniques[0].name
            : "다양한 기법";


    const material =
        profile.materials[0]
            ? profile.materials[0].name
            : "다양한 재료";


    const expression =
        profile.expressions[0]
            ? profile.expressions[0].name
            : "다양한 표현";


    return `
현재 분석된 작품에서는
<strong>${escapeHTML(form)}</strong>,
<strong>${escapeHTML(technique)}</strong>,
<strong>${escapeHTML(material)}</strong>의 특징이
상대적으로 많이 나타납니다.

표현 측면에서는
<strong>${escapeHTML(expression)}</strong> 성향이
관찰되고 있습니다.

작품이 추가될수록 이 프로필은 새로운 분석 결과를 반영하여
자동으로 업데이트됩니다.
`;

}


// ============================================================
// DNA 저장
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
                    "3.0"

            },
            {
                merge: true
            }
        );


        dnaProfile =
            profile;


        console.log(
            "CLAY DNA 프로필 저장 완료"
        );


        if (showMessage) {

            showDNAToast(
                "CLAY DNA가 업데이트되었습니다."
            );

        }


        return true;


    } catch (error) {

        console.error(
            "DNA 저장 오류:",
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
// 외부 자동 갱신
// ============================================================

window.refreshCLAYDNA =
    async function () {

        if (!dnaCurrentUser) {

            console.log(
                "DNA 자동 갱신: 로그인 필요"
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
        document.createElement(
            "div"
        );


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
                        나의 도자 작업 성향
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
// RADAR 차트
// ============================================================

function renderRadar(profile) {

    const categories = [

        {
            label: "형태",
            value: profile.forms.length
        },

        {
            label: "기법",
            value: profile.techniques.length
        },

        {
            label: "재료",
            value: profile.materials.length
        },

        {
            label: "표현",
            value: profile.expressions.length
        },

        {
            label: "태그",
            value: profile.tags.length
        }

    ];


    const max =
        Math.max(
            ...categories.map(
                item => item.value
            ),
            1
        );


    return `

        <div class="dna-radar">

            <div class="dna-radar-center">
                DNA
            </div>

            ${categories
                .map(
                    (item, index) => {

                        const angle =
                            index *
                            (360 /
                            categories.length) -
                            90;

                        const radius =
                            110;

                        const x =
                            50 +
                            Math.cos(
                                angle *
                                Math.PI /
                                180
                            ) *
                            38;

                        const y =
                            50 +
                            Math.sin(
                                angle *
                                Math.PI /
                                180
                            ) *
                            38;


                        const size =
                            Math.max(
                                12,
                                Math.round(
                                    (
                                        item.value /
                                        max
                                    ) * 30
                                )
                            );


                        return `

                            <div
                                class="dna-radar-node"
                                style="
                                    left:${x}%;
                                    top:${y}%;
                                    width:${size}px;
                                    height:${size}px;
                                "
                                title="${escapeHTML(
                                    item.label
                                )}: ${item.value}">
                            </div>

                            <div
                                class="dna-radar-label"
                                style="
                                    left:${x}%;
                                    top:${y}%;
                                "
                            >
                                ${escapeHTML(
                                    item.label
                                )}
                            </div>

                        `;

                    }
                )
                .join("")}

        </div>

    `;

}


// ============================================================
// DNA BAR
// ============================================================

function renderBars(items) {

    if (
        !items ||
        items.length === 0
    ) {

        return `
            <div class="dna-empty-small">
                데이터 없음
            </div>
        `;

    }


    const max =
        Math.max(
            ...items.map(
                item =>
                    item.count
            )
        );


    return items
        .slice(0, 6)
        .map(
            item => {

                const percent =
                    Math.max(
                        12,
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
                                style="
                                    width:${percent}%;
                                ">
                            </div>

                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


// ============================================================
// TAG
// ============================================================

function renderTags(tags) {

    if (
        !tags ||
        tags.length === 0
    ) {

        return `
            <span class="dna-empty-small">
                태그 없음
            </span>
        `;

    }


    return tags
        .map(
            tag => `

                <span
                    class="dna-tag">

                    #${escapeHTML(
                        tag.name
                    )}

                    <small>
                        ${tag.count}
                    </small>

                </span>

            `
        )
        .join("");

}


// ============================================================
// 작품별 DNA
// ============================================================

function renderWorkDNA() {

    const timeline =
        buildTimeline();


    if (
        timeline.length === 0
    ) {

        return `
            <div class="dna-empty-small">
                분석된 작품이 없습니다.
            </div>
        `;

    }


    return timeline
        .slice(-8)
        .reverse()
        .map(
            work => `

                <div
                    class="dna-work-item">

                    <div
                        class="dna-work-main">

                        <strong>
                            ${escapeHTML(
                                work.title
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                work.date
                            )}
                        </span>

                    </div>

                    <div
                        class="dna-work-score">

                        ${work.score}

                    </div>

                    <div
                        class="dna-work-tags">

                        ${
                            work.tags
                                .map(
                                    tag =>
                                        `#${escapeHTML(
                                            tag
                                        )}`
                                )
                                .join(" ")
                        }

                    </div>

                </div>

            `
        )
        .join("");

}


// ============================================================
// 전체 화면
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
                    아직 CLAY DNA가 없습니다.
                </h3>

                <p>
                    작품을 등록하고 AI 분석을 저장하면
                    개인 작업 DNA가 생성됩니다.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <!-- SCORE -->

        <section
            class="dna-hero">

            <div>

                <div
                    class="dna-score-label">
                    PERSONAL CLAY DNA
                </div>

                <h3>
                    나의 도자 작업 DNA
                </h3>

                <p>
                    ${profile.analyzedWorks}개 작품 분석
                </p>

            </div>


            <div
                class="dna-score-big">

                ${profile.score}

            </div>

        </section>


        <!-- RADAR -->

        <section
            class="dna-dashboard-card">

            <div
                class="dna-section-title">

                작업 성향 구조

            </div>

            ${renderRadar(
                profile
            )}

        </section>


        <!-- SUMMARY -->

        <section
            class="dna-summary-card">

            <div
                class="dna-section-title">

                현재 작업 성향

            </div>

            <div
                class="dna-summary">

                ${createSummary(
                    profile
                )}

            </div>

        </section>


        <!-- DNA CATEGORIES -->

        <div
            class="dna-grid">

            <section
                class="dna-section-card">

                <div
                    class="dna-section-title">
                    형태 DNA
                </div>

                ${renderBars(
                    profile.forms
                )}

            </section>


            <section
                class="dna-section-card">

                <div
                    class="dna-section-title">
                    기법 DNA
                </div>

                ${renderBars(
                    profile.techniques
                )}

            </section>


            <section
                class="dna-section-card">

                <div
                    class="dna-section-title">
                    재료 DNA
                </div>

                ${renderBars(
                    profile.materials
                )}

            </section>


            <section
                class="dna-section-card">

                <div
                    class="dna-section-title">
                    표현 DNA
                </div>

                ${renderBars(
                    profile.expressions
                )}

            </section>

        </div>


        <!-- TAG -->

        <section
            class="dna-tags-card">

            <div
                class="dna-section-title">

                대표 DNA TAG

            </div>

            <div
                class="dna-tags">

                ${renderTags(
                    profile.tags
                )}

            </div>

        </section>


        <!-- WORK TIMELINE -->

        <section
            class="dna-dashboard-card">

            <div
                class="dna-section-title">

                작품별 DNA

            </div>

            <div
                class="dna-work-list">

                ${renderWorkDNA()}

            </div>

        </section>


        <!-- DATA -->

        <div
            class="dna-info">

            <div>

                등록 작품

                <strong>
                    ${profile.totalWorks}
                </strong>

            </div>


            <div>

                AI 분석

                <strong>
                    ${profile.analyzedWorks}
                </strong>

            </div>

        </div>


        <button
            type="button"
            id="saveDNAProfileButton"
            class="dna-save-button">

            CLAY DNA 저장

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

    document
        .querySelectorAll(
            '[data-feature="dna"]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

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
                    event => {

                        event.preventDefault();

                        window.openCLAYDNA();

                    }
                );

            }
        );


    console.log(
        "CLAY DNA 3.0 버튼 연결 완료"
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
        document.createElement(
            "style"
        );


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
                rgba(0,0,0,.68);

        }


        .clay-dna-panel {

            position: relative;

            width:
                min(960px, 100%);

            max-height:
                92vh;

            overflow-y: auto;

            background:
                #fff;

            border-radius:
                24px;

            box-shadow:
                0 25px 80px
                rgba(0,0,0,.28);

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
                1px solid #eee;

            padding-bottom:
                20px;

            margin-bottom:
                20px;

        }


        .clay-dna-label {

            font-size:
                11px;

            letter-spacing:
                2px;

            color:
                #888;

        }


        .clay-dna-header h2 {

            margin:
                5px 0;

            font-size:
                30px;

        }


        .clay-dna-header p {

            margin:
                0;

            color:
                #777;

        }


        .clay-dna-header button {

            width:
                40px;

            height:
                40px;

            border:
                0;

            border-radius:
                50%;

            background:
                #f1f1f1;

            font-size:
                25px;

            cursor:
                pointer;

        }


        .dna-hero {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            padding:
                28px;

            border-radius:
                22px;

            background:
                #f4f0e9;

            margin-bottom:
                18px;

        }


        .dna-hero h3 {

            margin:
                6px 0;

            font-size:
                25px;

        }


        .dna-hero p {

            margin:
                0;

            color:
                #777;

        }


        .dna-score-label {

            font-size:
                11px;

            letter-spacing:
                2px;

            color:
                #777;

        }


        .dna-score-big {

            font-size:
                64px;

            font-weight:
                800;

        }


        .dna-dashboard-card,
        .dna-summary-card,
        .dna-tags-card {

            padding:
                22px;

            border:
                1px solid #eee;

            border-radius:
                20px;

            margin-bottom:
                18px;

        }


        .dna-section-title {

            font-weight:
                700;

            margin-bottom:
                16px;

        }


        .dna-summary {

            line-height:
                1.85;

            color:
                #555;

        }


        .dna-radar {

            position:
                relative;

            width:
                min(420px, 90vw);

            height:
                300px;

            margin:
                0 auto;

            border-radius:
                50%;

            background:
                radial-gradient(
                    circle,
                    #fafafa 0%,
                    #fff 65%
                );

        }


        .dna-radar::before,
        .dna-radar::after {

            content:
                "";

            position:
                absolute;

            left:
                50%;

            top:
                50%;

            transform:
                translate(-50%, -50%);

            border:
                1px solid #ddd;

            border-radius:
                50%;

        }


        .dna-radar::before {

            width:
                170px;

            height:
                170px;

        }


        .dna-radar::after {

            width:
                280px;

            height:
                280px;

        }


        .dna-radar-center {

            position:
                absolute;

            left:
                50%;

            top:
                50%;

            transform:
                translate(-50%, -50%);

            z-index:
                3;

            width:
                55px;

            height:
                55px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            border-radius:
                50%;

            background:
                #222;

            color:
                #fff;

            font-size:
                11px;

            font-weight:
                700;

        }


        .dna-radar-node {

            position:
                absolute;

            transform:
                translate(-50%, -50%);

            border-radius:
                50%;

            background:
                #333;

            z-index:
                4;

        }


        .dna-radar-label {

            position:
                absolute;

            transform:
                translate(-50%, -50%);

            font-size:
                12px;

            font-weight:
                600;

            z-index:
                5;

            white-space:
                nowrap;

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

            padding:
                20px;

            border:
                1px solid #eee;

            border-radius:
                18px;

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

            margin-bottom:
                6px;

            font-size:
                13px;

        }


        .dna-bar-top strong {

            color:
                #888;

        }


        .dna-bar-track {

            height:
                7px;

            background:
                #eee;

            border-radius:
                10px;

            overflow:
                hidden;

        }


        .dna-bar-fill {

            height:
                100%;

            background:
                #333;

            border-radius:
                10px;

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

            gap:
                5px;

            padding:
                8px 12px;

            border-radius:
                999px;

            background:
                #f1f1f1;

            font-size:
                13px;

        }


        .dna-tag small {

            color:
                #888;

        }


        .dna-work-list {

            display:
                flex;

            flex-direction:
                column;

            gap:
                10px;

        }


        .dna-work-item {

            display:
                grid;

            grid-template-columns:
                1fr 60px;

            gap:
                10px;

            padding:
                15px;

            border-radius:
                14px;

            background:
                #f7f7f7;

        }


        .dna-work-main {

            display:
                flex;

            flex-direction:
                column;

            gap:
                5px;

        }


        .dna-work-main strong {

            font-size:
                14px;

        }


        .dna-work-main span {

            font-size:
                11px;

            color:
                #888;

        }


        .dna-work-score {

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            font-size:
                22px;

            font-weight:
                700;

        }


        .dna-work-tags {

            grid-column:
                1 / -1;

            color:
                #666;

            font-size:
                12px;

        }


        .dna-info {

            display:
                grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap:
                12px;

            margin-bottom:
                18px;

        }


        .dna-info div {

            padding:
                16px;

            text-align:
                center;

            border-radius:
                14px;

            background:
                #f7f7f7;

            color:
                #777;

        }


        .dna-info strong {

            display:
                block;

            margin-top:
                5px;

            font-size:
                24px;

            color:
                #222;

        }


        .dna-save-button {

            width:
                100%;

            padding:
                15px;

            border:
                0;

            border-radius:
                14px;

            background:
                #222;

            color:
                #fff;

            cursor:
                pointer;

            font-size:
                15px;

        }


        .dna-empty {

            text-align:
                center;

            padding:
                70px 20px;

        }


        .dna-empty-icon {

            width:
                80px;

            height:
                80px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            margin:
                0 auto 20px;

            border-radius:
                50%;

            background:
                #f3f0ea;

            font-weight:
                700;

        }


        .dna-empty-small {

            color:
                #999;

            font-size:
                13px;

        }


        @media(max-width:650px) {

            .clay-dna-panel {

                padding:
                    18px;

                border-radius:
                    18px;

            }


            .dna-hero {

                padding:
                    22px;

            }


            .dna-score-big {

                font-size:
                    48px;

            }


            .dna-grid {

                grid-template-columns:
                    1fr;

            }


            .dna-radar {

                height:
                    270px;

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
    "CLAY DNA 3.0 모듈 준비 완료"
);
