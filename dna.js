// ============================================================
// CLAY DNA 4.0
// 작품 변천사 + DNA 변화 분석
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
// 인증
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
            "CLAY DNA 4.0 로그인:",
            user.email
        );

        await loadDNAData();

    });

}


// ============================================================
// 데이터 로드
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

                        workTitle:
                            work.title || "작품",

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

        dnaWorks.sort(sortWorksByDate);

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
// 날짜
// ============================================================

function getWorkDate(work) {

    if (work.productionDate) {

        const timestamp =
            new Date(
                work.productionDate
            ).getTime();

        if (!isNaN(timestamp)) {
            return timestamp;
        }

    }

    if (
        work.createdAt &&
        typeof work.createdAt.toDate === "function"
    ) {

        return work.createdAt
            .toDate()
            .getTime();

    }

    return 0;

}


function sortWorksByDate(a, b) {

    return getWorkDate(a) - getWorkDate(b);

}


function formatDate(work) {

    if (work.productionDate) {
        return work.productionDate;
    }

    if (
        work.createdAt &&
        typeof work.createdAt.toDate === "function"
    ) {

        return work.createdAt
            .toDate()
            .toLocaleDateString(
                "ko-KR"
            );

    }

    return "날짜 미상";

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
            item => normalizeText(item)
        );

    }

    return String(value)
        .split(/[,/|·•\n]+/)
        .map(item => item.trim())
        .filter(Boolean);

}


function cleanKeyword(value) {

    if (!value) {
        return "";
    }

    let text =
        String(value).trim();

    if (text.length > 30) {

        text =
            text
                .split(/\s+/)
                .slice(0, 3)
                .join(" ");

    }

    return text;

}


// ============================================================
// 분석 찾기
// ============================================================

function getAnalysisForWork(workId) {

    return dnaAnalyses.find(
        analysis =>
            analysis.workId === workId
    );

}


// ============================================================
// 작품별 DNA 데이터
// ============================================================

function getWorkDNA(work) {

    const analysis =
        getAnalysisForWork(work.id);

    if (!analysis) {

        return {

            score: 0,

            forms: [],

            techniques: [],

            materials: [],

            expressions: [],

            tags: []

        };

    }

    return {

        score:
            Number(analysis.score) || 0,

        forms:
            normalizeText(
                analysis.formCharacter
            ),

        techniques:
            normalizeText(
                analysis.techniqueCharacter
            ),

        materials:
            normalizeText(
                analysis.materialCharacter
            ),

        expressions:
            normalizeText(
                analysis.expression
            ),

        tags:
            normalizeText(
                analysis.dnaTags
            )

    };

}


// ============================================================
// 전체 DNA
// ============================================================

function countItems(items) {

    const map = {};

    items.forEach(item => {

        const keyword =
            cleanKeyword(item);

        if (!keyword) {
            return;
        }

        map[keyword] =
            (map[keyword] || 0) + 1;

    });

    return Object.entries(map)
        .sort(
            (a, b) =>
                b[1] - a[1]
        )
        .map(
            ([name, count]) => ({
                name,
                count
            })
        );

}


function buildDNAProfile() {

    const forms = [];
    const techniques = [];
    const materials = [];
    const expressions = [];
    const tags = [];

    dnaAnalyses.forEach(analysis => {

        forms.push(
            ...normalizeText(
                analysis.formCharacter
            )
        );

        techniques.push(
            ...normalizeText(
                analysis.techniqueCharacter
            )
        );

        materials.push(
            ...normalizeText(
                analysis.materialCharacter
            )
        );

        expressions.push(
            ...normalizeText(
                analysis.expression
            )
        );

        tags.push(
            ...normalizeText(
                analysis.dnaTags
            )
        );

    });

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

    const score =
        scores.length
            ? Math.round(
                scores.reduce(
                    (a, b) => a + b,
                    0
                ) / scores.length
            )
            : 0;

    return {

        totalWorks:
            dnaWorks.length,

        analyzedWorks:
            dnaAnalyses.length,

        score,

        forms:
            countItems(forms)
                .slice(0, 8),

        techniques:
            countItems(techniques)
                .slice(0, 8),

        materials:
            countItems(materials)
                .slice(0, 8),

        expressions:
            countItems(expressions)
                .slice(0, 8),

        tags:
            countItems(tags)
                .slice(0, 15)

    };

}


// ============================================================
// 작품 타임라인
// ============================================================

function buildTimeline() {

    return dnaWorks
        .filter(
            work =>
                getAnalysisForWork(
                    work.id
                )
        )
        .map(work => {

            const dna =
                getWorkDNA(work);

            return {

                work,

                score:
                    dna.score,

                forms:
                    dna.forms,

                techniques:
                    dna.techniques,

                materials:
                    dna.materials,

                expressions:
                    dna.expressions,

                tags:
                    dna.tags

            };

        });

}


// ============================================================
// DNA 변화 계산
// ============================================================

function compareArrays(
    previous,
    current
) {

    const oldSet =
        new Set(previous);

    const newSet =
        new Set(current);

    const added =
        current.filter(
            item =>
                !oldSet.has(item)
        );

    const maintained =
        current.filter(
            item =>
                oldSet.has(item)
        );

    const disappeared =
        previous.filter(
            item =>
                !newSet.has(item)
        );

    return {

        added,
        maintained,
        disappeared

    };

}


function compareWorks(
    previousWork,
    currentWork
) {

    const previous =
        getWorkDNA(
            previousWork.work
        );

    const current =
        getWorkDNA(
            currentWork.work
        );

    return {

        scoreChange:
            current.score -
            previous.score,

        forms:
            compareArrays(
                previous.forms,
                current.forms
            ),

        techniques:
            compareArrays(
                previous.techniques,
                current.techniques
            ),

        materials:
            compareArrays(
                previous.materials,
                current.materials
            ),

        expressions:
            compareArrays(
                previous.expressions,
                current.expressions
            ),

        tags:
            compareArrays(
                previous.tags,
                current.tags
            )

    };

}


// ============================================================
// 변화 요약
// ============================================================

function getChangeSummary() {

    const timeline =
        buildTimeline();

    if (timeline.length < 2) {

        return {

            available: false,

            text:
                "작품이 2개 이상 분석되면 작업 스타일의 변화를 분석할 수 있습니다."

        };

    }

    const first =
        timeline[0];

    const latest =
        timeline[
            timeline.length - 1
        ];

    const comparison =
        compareWorks(
            first,
            latest
        );

    const added =
        [
            ...comparison.forms.added,
            ...comparison.techniques.added,
            ...comparison.materials.added,
            ...comparison.expressions.added
        ];

    const maintained =
        [
            ...comparison.forms.maintained,
            ...comparison.techniques.maintained,
            ...comparison.materials.maintained,
            ...comparison.expressions.maintained
        ];

    const scoreChange =
        comparison.scoreChange;


    let direction =
        "큰 변화 없이 작업 성향이 유지되고 있습니다.";

    if (scoreChange >= 5) {

        direction =
            "최근 작품의 분석 점수가 이전 작품보다 상승했습니다.";

    } else if (scoreChange <= -5) {

        direction =
            "최근 작품의 분석 점수가 이전 작품보다 낮게 나타났습니다.";

    }


    return {

        available: true,

        firstTitle:
            first.work.title || "첫 작품",

        latestTitle:
            latest.work.title || "최근 작품",

        scoreChange,

        added:
            [...new Set(added)]
                .slice(0, 5),

        maintained:
            [...new Set(maintained)]
                .slice(0, 5),

        direction

    };

}


// ============================================================
// 타임라인 렌더링
// ============================================================

function renderTimeline() {

    const timeline =
        buildTimeline();

    if (!timeline.length) {

        return `
            <div class="dna-empty-small">
                분석된 작품이 없습니다.
            </div>
        `;

    }

    return timeline
        .map((item, index) => {

            const dna =
                getWorkDNA(
                    item.work
                );

            const previous =
                index > 0
                    ? getWorkDNA(
                        timeline[
                            index - 1
                        ].work
                    )
                    : null;

            let scoreChange = null;

            if (previous) {

                scoreChange =
                    dna.score -
                    previous.score;

            }

            return `

                <div class="dna-timeline-item">

                    <div class="dna-timeline-line">

                        <div class="dna-timeline-dot">
                        </div>

                    </div>


                    <div class="dna-timeline-card">

                        <div class="dna-timeline-head">

                            <div>

                                <div class="dna-timeline-date">

                                    ${escapeHTML(
                                        formatDate(
                                            item.work
                                        )
                                    )}

                                </div>

                                <h4>

                                    ${escapeHTML(
                                        item.work.title ||
                                        "작품"
                                    )}

                                </h4>

                            </div>


                            <div class="dna-timeline-score">

                                ${dna.score}

                            </div>

                        </div>


                        <div class="dna-timeline-data">

                            <span>
                                형태:
                                ${escapeHTML(
                                    dna.forms
                                        .slice(0, 2)
                                        .join(", ") ||
                                    "-"
                                )}
                            </span>

                            <span>
                                기법:
                                ${escapeHTML(
                                    dna.techniques
                                        .slice(0, 2)
                                        .join(", ") ||
                                    "-"
                                )}
                            </span>

                            <span>
                                재료:
                                ${escapeHTML(
                                    dna.materials
                                        .slice(0, 2)
                                        .join(", ") ||
                                    "-"
                                )}
                            </span>

                        </div>


                        <div class="dna-timeline-tags">

                            ${
                                dna.tags
                                    .slice(0, 5)
                                    .map(
                                        tag =>
                                            `<span>
                                                #${escapeHTML(tag)}
                                            </span>`
                                    )
                                    .join("")
                            }

                        </div>


                        ${
                            scoreChange !== null
                                ? `
                                    <div class="
                                        dna-score-change
                                        ${
                                            scoreChange > 0
                                                ? "up"
                                                : scoreChange < 0
                                                    ? "down"
                                                    : ""
                                        }
                                    ">

                                        이전 작품 대비

                                        ${
                                            scoreChange > 0
                                                ? "▲"
                                                : scoreChange < 0
                                                    ? "▼"
                                                    : "—"
                                        }

                                        ${Math.abs(scoreChange)}

                                    </div>
                                `
                                : ""
                        }

                    </div>

                </div>

            `;

        })
        .join("");

}


// ============================================================
// 변화 분석 렌더링
// ============================================================

function renderChangeAnalysis() {

    const change =
        getChangeSummary();

    if (!change.available) {

        return `

            <div class="dna-change-empty">

                <div class="dna-change-icon">
                    2+
                </div>

                <h4>
                    작품 변천사 분석 준비 중
                </h4>

                <p>
                    서로 다른 시점의 작품 2개 이상을
                    AI 분석하면 작업 스타일의 변화를
                    비교할 수 있습니다.
                </p>

            </div>

        `;

    }


    const scoreText =
        change.scoreChange > 0
            ? `▲ ${change.scoreChange}`
            : change.scoreChange < 0
                ? `▼ ${Math.abs(change.scoreChange)}`
                : "—";


    return `

        <div class="dna-change-summary">

            <div class="dna-change-header">

                <div>

                    <div class="dna-change-label">
                        FIRST → LATEST
                    </div>

                    <strong>
                        ${escapeHTML(
                            change.firstTitle
                        )}
                        →
                        ${escapeHTML(
                            change.latestTitle
                        )}
                    </strong>

                </div>


                <div class="
                    dna-change-score
                    ${
                        change.scoreChange > 0
                            ? "up"
                            : change.scoreChange < 0
                                ? "down"
                                : ""
                    }
                ">

                    ${scoreText}

                </div>

            </div>


            <p class="dna-change-direction">

                ${escapeHTML(
                    change.direction
                )}

            </p>


            <div class="dna-change-grid">

                <div>

                    <span>
                        새롭게 나타난 DNA
                    </span>

                    <strong>

                        ${
                            change.added.length
                                ? change.added
                                    .map(
                                        item =>
                                            `#${escapeHTML(item)}`
                                    )
                                    .join(" ")
                                : "없음"
                        }

                    </strong>

                </div>


                <div>

                    <span>
                        계속 유지된 DNA
                    </span>

                    <strong>

                        ${
                            change.maintained.length
                                ? change.maintained
                                    .map(
                                        item =>
                                            `#${escapeHTML(item)}`
                                    )
                                    .join(" ")
                                : "없음"
                        }

                    </strong>

                </div>

            </div>

        </div>

    `;

}


// ============================================================
// DNA TAG 렌더링
// ============================================================

function renderTags(tags) {

    if (!tags.length) {

        return `
            <span class="dna-empty-small">
                태그 없음
            </span>
        `;

    }

    return tags
        .map(
            tag => `

                <span class="dna-tag">

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
// DNA BAR
// ============================================================

function renderBars(items) {

    if (!items.length) {

        return `
            <div class="dna-empty-small">
                데이터 없음
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
        .slice(0, 6)
        .map(item => {

            const percent =
                Math.max(
                    10,
                    Math.round(
                        item.count /
                        max *
                        100
                    )
                );

            return `

                <div class="dna-bar-item">

                    <div class="dna-bar-top">

                        <span>
                            ${escapeHTML(
                                item.name
                            )}
                        </span>

                        <strong>
                            ${item.count}
                        </strong>

                    </div>

                    <div class="dna-bar-track">

                        <div
                            class="dna-bar-fill"
                            style="
                                width:${percent}%;
                            ">
                        </div>

                    </div>

                </div>

            `;

        })
        .join("");

}


// ============================================================
// DNA 모달
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
                        나의 도자 작업 변천사
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
// 전체 DNA 화면
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

        <!-- ==================================================
             SCORE
        =================================================== -->

        <section class="dna-hero">

            <div>

                <div class="dna-score-label">
                    PERSONAL CLAY DNA
                </div>

                <h3>
                    나의 도자 작업 DNA
                </h3>

                <p>
                    ${profile.analyzedWorks}
                    개 작품 분석
                </p>

            </div>


            <div class="dna-score-big">
                ${profile.score}
            </div>

        </section>


        <!-- ==================================================
             CHANGE ANALYSIS
        =================================================== -->

        <section class="dna-dashboard-card">

            <div class="dna-section-title">
                작업 스타일 변화
            </div>

            ${renderChangeAnalysis()}

        </section>


        <!-- ==================================================
             TIMELINE
        =================================================== -->

        <section class="dna-dashboard-card">

            <div class="dna-section-title">
                작품 변천사
            </div>

            <div class="dna-timeline">

                ${renderTimeline()}

            </div>

        </section>


        <!-- ==================================================
             DNA CATEGORIES
        =================================================== -->

        <div class="dna-grid">

            <section class="dna-section-card">

                <div class="dna-section-title">
                    형태 DNA
                </div>

                ${renderBars(
                    profile.forms
                )}

            </section>


            <section class="dna-section-card">

                <div class="dna-section-title">
                    기법 DNA
                </div>

                ${renderBars(
                    profile.techniques
                )}

            </section>


            <section class="dna-section-card">

                <div class="dna-section-title">
                    재료 DNA
                </div>

                ${renderBars(
                    profile.materials
                )}

            </section>


            <section class="dna-section-card">

                <div class="dna-section-title">
                    표현 DNA
                </div>

                ${renderBars(
                    profile.expressions
                )}

            </section>

        </div>


        <!-- ==================================================
             TAG
        =================================================== -->

        <section class="dna-tags-card">

            <div class="dna-section-title">
                대표 DNA TAG
            </div>

            <div class="dna-tags">

                ${renderTags(
                    profile.tags
                )}

            </div>

        </section>


        <!-- ==================================================
             INFO
        =================================================== -->

        <div class="dna-info">

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
// DNA 저장
// ============================================================

async function saveDNAProfile(
    showMessage = true
) {

    if (!dnaCurrentUser || !db) {
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
                    "4.0"

            },
            {
                merge: true
            }
        );

        dnaProfile =
            profile;

        console.log(
            "CLAY DNA 4.0 프로필 저장 완료"
        );

        if (showMessage) {

            showDNAToast(
                "CLAY DNA가 저장되었습니다."
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
// AI 분석 후 자동 갱신
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
// 버튼 연결
// ============================================================

function connectDNAButtons() {

    document
        .querySelectorAll(
            '[data-feature="dna"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

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
                event => {

                    event.preventDefault();

                    window.openCLAYDNA();

                }
            );

        });


    console.log(
        "CLAY DNA 4.0 버튼 연결 완료"
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
            background: rgba(0,0,0,.68);
        }

        .clay-dna-panel {
            position: relative;
            width: min(960px,100%);
            max-height: 92vh;
            overflow-y: auto;
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 25px 80px rgba(0,0,0,.28);
            padding: 28px;
        }

        .clay-dna-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .clay-dna-label {
            font-size: 11px;
            letter-spacing: 2px;
            color: #888;
        }

        .clay-dna-header h2 {
            margin: 5px 0;
            font-size: 30px;
        }

        .clay-dna-header p {
            margin: 0;
            color: #777;
        }

        .clay-dna-header button {
            width: 40px;
            height: 40px;
            border: 0;
            border-radius: 50%;
            background: #f1f1f1;
            font-size: 25px;
            cursor: pointer;
        }

        .dna-hero {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 28px;
            border-radius: 22px;
            background: #f4f0e9;
            margin-bottom: 18px;
        }

        .dna-hero h3 {
            margin: 6px 0;
            font-size: 25px;
        }

        .dna-hero p {
            margin: 0;
            color: #777;
        }

        .dna-score-label {
            font-size: 11px;
            letter-spacing: 2px;
            color: #777;
        }

        .dna-score-big {
            font-size: 64px;
            font-weight: 800;
        }

        .dna-dashboard-card,
        .dna-tags-card {
            padding: 22px;
            border: 1px solid #eee;
            border-radius: 20px;
            margin-bottom: 18px;
        }

        .dna-section-title {
            font-weight: 700;
            margin-bottom: 16px;
        }

        .dna-change-summary {
            padding: 18px;
            border-radius: 16px;
            background: #f7f7f7;
        }

        .dna-change-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
        }

        .dna-change-label {
            font-size: 10px;
            letter-spacing: 1.5px;
            color: #999;
            margin-bottom: 5px;
        }

        .dna-change-score {
            font-size: 25px;
            font-weight: 800;
        }

        .dna-change-score.up,
        .dna-score-change.up {
            color: #287a43;
        }

        .dna-change-score.down,
        .dna-score-change.down {
            color: #a33b3b;
        }

        .dna-change-direction {
            line-height: 1.7;
            color: #555;
        }

        .dna-change-grid {
            display: grid;
            grid-template-columns: repeat(2,1fr);
            gap: 10px;
        }

        .dna-change-grid > div {
            padding: 14px;
            border-radius: 12px;
            background: #fff;
        }

        .dna-change-grid span {
            display: block;
            font-size: 11px;
            color: #999;
            margin-bottom: 7px;
        }

        .dna-change-grid strong {
            font-size: 13px;
            line-height: 1.7;
        }

        .dna-change-empty {
            text-align: center;
            padding: 30px 15px;
        }

        .dna-change-icon {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
            border-radius: 50%;
            background: #f3f0ea;
            font-weight: 800;
        }

        .dna-change-empty h4 {
            margin: 8px 0;
        }

        .dna-change-empty p {
            margin: 0;
            color: #777;
            line-height: 1.7;
            font-size: 13px;
        }

        .dna-timeline {
            position: relative;
        }

        .dna-timeline-item {
            display: grid;
            grid-template-columns: 28px 1fr;
            gap: 10px;
            min-height: 130px;
        }

        .dna-timeline-line {
            position: relative;
        }

        .dna-timeline-line::after {
            content: "";
            position: absolute;
            left: 13px;
            top: 15px;
            bottom: -15px;
            width: 2px;
            background: #ddd;
        }

        .dna-timeline-item:last-child
        .dna-timeline-line::after {
            display: none;
        }

        .dna-timeline-dot {
            position: relative;
            z-index: 2;
            width: 12px;
            height: 12px;
            margin-top: 15px;
            border-radius: 50%;
            background: #333;
        }

        .dna-timeline-card {
            margin-bottom: 12px;
            padding: 17px;
            border-radius: 16px;
            background: #f7f7f7;
        }

        .dna-timeline-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .dna-timeline-date {
            font-size: 11px;
            color: #999;
            margin-bottom: 4px;
        }

        .dna-timeline-card h4 {
            margin: 0;
            font-size: 15px;
        }

        .dna-timeline-score {
            font-size: 26px;
            font-weight: 800;
        }

        .dna-timeline-data {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 13px;
        }

        .dna-timeline-data span {
            padding: 6px 9px;
            border-radius: 8px;
            background: #fff;
            font-size: 11px;
            color: #666;
        }

        .dna-timeline-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 10px;
        }

        .dna-timeline-tags span {
            font-size: 11px;
            color: #777;
        }

        .dna-score-change {
            margin-top: 10px;
            font-size: 11px;
            font-weight: 700;
        }

        .dna-grid {
            display: grid;
            grid-template-columns: repeat(2,1fr);
            gap: 15px;
            margin-bottom: 18px;
        }

        .dna-section-card {
            padding: 20px;
            border: 1px solid #eee;
            border-radius: 18px;
        }

        .dna-bar-item {
            margin-bottom: 15px;
        }

        .dna-bar-item:last-child {
            margin-bottom: 0;
        }

        .dna-bar-top {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 13px;
        }

        .dna-bar-top strong {
            color: #888;
        }

        .dna-bar-track {
            height: 7px;
            background: #eee;
            border-radius: 10px;
            overflow: hidden;
        }

        .dna-bar-fill {
            height: 100%;
            background: #333;
            border-radius: 10px;
        }

        .dna-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .dna-tag {
            display: inline-flex;
            gap: 5px;
            padding: 8px 12px;
            border-radius: 999px;
            background: #f1f1f1;
            font-size: 13px;
        }

        .dna-tag small {
            color: #888;
        }

        .dna-info {
            display: grid;
            grid-template-columns: repeat(2,1fr);
            gap: 12px;
            margin-bottom: 18px;
        }

        .dna-info div {
            padding: 16px;
            text-align: center;
            border-radius: 14px;
            background: #f7f7f7;
            color: #777;
        }

        .dna-info strong {
            display: block;
            margin-top: 5px;
            font-size: 24px;
            color: #222;
        }

        .dna-save-button {
            width: 100%;
            padding: 15px;
            border: 0;
            border-radius: 14px;
            background: #222;
            color: #fff;
            cursor: pointer;
            font-size: 15px;
        }

        .dna-empty {
            text-align: center;
            padding: 70px 20px;
        }

        .dna-empty-icon {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            border-radius: 50%;
            background: #f3f0ea;
            font-weight: 700;
        }

        .dna-empty-small {
            color: #999;
            font-size: 13px;
        }

        @media(max-width:650px) {

            .clay-dna-panel {
                padding: 18px;
                border-radius: 18px;
            }

            .dna-hero {
                padding: 22px;
            }

            .dna-score-big {
                font-size: 48px;
            }

            .dna-grid {
                grid-template-columns: 1fr;
            }

            .dna-change-grid {
                grid-template-columns: 1fr;
            }

            .dna-timeline-item {
                grid-template-columns: 20px 1fr;
            }

            .dna-timeline-line::after {
                left: 9px;
            }

            .dna-timeline-dot {
                width: 10px;
                height: 10px;
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
    "CLAY DNA 4.0 모듈 준비 완료"
);
