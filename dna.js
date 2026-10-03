// ============================================================
// CLAY DNA
// 개인 창작 스타일 + 작업 스타일 변화 분석
// ============================================================

import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================================
// 상태
// ============================================================

let dnaProfile = null;
let allWorks = [];
let allAnalyses = [];


// ============================================================
// 시작
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    createDNAInterface();

    connectDNAButtons();

});


// ============================================================
// DNA 화면
// ============================================================

function createDNAInterface() {

    if (document.getElementById("dnaModal")) {
        return;
    }

    const modal = document.createElement("div");

    modal.id = "dnaModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:9998;
        background:rgba(0,0,0,0.55);
        display:none;
        align-items:center;
        justify-content:center;
        padding:20px;
        box-sizing:border-box;
    `;

    modal.innerHTML = `

        <div
            style="
                width:min(800px,100%);
                max-height:92vh;
                overflow-y:auto;
                background:white;
                border-radius:22px;
                padding:24px;
                box-sizing:border-box;
                box-shadow:0 20px 60px rgba(0,0,0,0.25);
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:20px;
                "
            >

                <div>

                    <h2 style="margin:0 0 6px;">
                        🧬 나의 CLAY DNA
                    </h2>

                    <p
                        id="dnaSubtitle"
                        style="
                            margin:0;
                            color:#666;
                        "
                    >
                        나의 도자기 창작 스타일
                    </p>

                </div>

                <button
                    id="closeDNAModal"
                    type="button"
                    style="
                        border:0;
                        background:#f1f1f1;
                        width:40px;
                        height:40px;
                        border-radius:50%;
                        cursor:pointer;
                        font-size:20px;
                    "
                >
                    ×
                </button>

            </div>


            <!-- DNA 없음 -->

            <div
                id="dnaEmpty"
                style="
                    text-align:center;
                    padding:35px 15px;
                    background:#f7f7f7;
                    border-radius:16px;
                "
            >

                <div
                    style="
                        font-size:45px;
                        margin-bottom:12px;
                    "
                >
                    🧬
                </div>

                <h3>
                    아직 CLAY DNA가 없습니다.
                </h3>

                <p
                    style="
                        color:#666;
                        line-height:1.6;
                    "
                >
                    AI 작품 분석을 저장하면
                    나의 창작 DNA를 만들 수 있습니다.
                </p>

            </div>


            <!-- DNA 내용 -->

            <div
                id="dnaContent"
                style="
                    display:none;
                "
            >

                <div
                    id="dnaSummary"
                    style="
                        background:#f7f7f7;
                        border-radius:16px;
                        padding:20px;
                        margin-bottom:18px;
                    "
                ></div>


                <div id="dnaCards"></div>


                <!-- =================================================
                     작업 스타일 변화
                ================================================= -->

                <div
                    id="styleChangeSection"
                    style="
                        margin-top:24px;
                        border-top:1px solid #eee;
                        padding-top:24px;
                    "
                >

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            margin-bottom:12px;
                        "
                    >

                        <div>

                            <h3
                                style="
                                    margin:0 0 5px;
                                "
                            >
                                작업 스타일 변화
                            </h3>

                            <p
                                style="
                                    margin:0;
                                    color:#666;
                                    font-size:14px;
                                "
                            >
                                시간에 따른 나의 창작 변화
                            </p>

                        </div>

                        <strong
                            id="styleChangeCount"
                            style="
                                font-size:20px;
                            "
                        >
                            0+
                        </strong>

                    </div>


                    <div
                        id="styleChangeContent"
                    ></div>


                    <button
                        id="openStyleChange"
                        type="button"
                        style="
                            width:100%;
                            margin-top:14px;
                            padding:14px;
                            border:1px solid #ddd;
                            border-radius:12px;
                            background:white;
                            cursor:pointer;
                            font-size:15px;
                        "
                    >
                        📈 작품 변천사 자세히 보기
                    </button>

                </div>


                <div
                    style="
                        margin-top:20px;
                        padding:15px;
                        background:#fafafa;
                        border-radius:14px;
                        color:#666;
                        font-size:13px;
                        line-height:1.6;
                    "
                >

                    현재 DNA는 저장된 작품의 AI 분석 결과를
                    기반으로 만들어집니다.
                    작품과 분석 데이터가 늘어날수록
                    개인 창작 스타일을 더 구체적으로 확인할 수 있습니다.

                </div>


                <button
                    id="refreshDNA"
                    type="button"
                    style="
                        width:100%;
                        margin-top:18px;
                        padding:15px;
                        border:0;
                        border-radius:12px;
                        background:#222;
                        color:white;
                        cursor:pointer;
                        font-size:16px;
                    "
                >
                    🔄 DNA 다시 분석하기
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);


    document
        .getElementById("closeDNAModal")
        .addEventListener(
            "click",
            closeDNAModal
        );


    document
        .getElementById("refreshDNA")
        .addEventListener(
            "click",
            generateDNA
        );


    document
        .getElementById("openStyleChange")
        .addEventListener(
            "click",
            showStyleChangeDetail
        );

}


// ============================================================
// 버튼 연결
// ============================================================

function connectDNAButtons() {

    document
        .querySelectorAll('[data-feature="dna"]')
        .forEach(button => {

            button.addEventListener(
                "click",
                openDNA
            );

        });


    document
        .querySelectorAll('[data-nav="dna"]')
        .forEach(button => {

            button.addEventListener(
                "click",
                openDNA
            );

        });

}


// ============================================================
// DNA 열기
// ============================================================

async function openDNA() {

    const user = auth.currentUser;

    if (!user) {

        showDNAToast(
            "먼저 로그인해 주세요."
        );

        return;

    }

    const modal =
        document.getElementById(
            "dnaModal"
        );

    modal.style.display = "flex";

    await loadDNA();

}


// ============================================================
// DNA 불러오기
// ============================================================

async function loadDNA() {

    const user = auth.currentUser;

    if (!user) {
        return;
    }


    try {

        allWorks =
            await getUserWorks(
                user.uid
            );


        allAnalyses =
            await getAllAnalyses(
                user.uid,
                allWorks
            );


        const profileRef =
            doc(
                db,
                "users",
                user.uid,
                "clayDNA",
                "profile"
            );


        const snapshot =
            await getDoc(
                profileRef
            );


        if (snapshot.exists()) {

            dnaProfile =
                snapshot.data();

            displayDNA(
                dnaProfile
            );

        } else {

            showEmptyDNA();

        }

    } catch (error) {

        console.error(
            "DNA 불러오기 오류:",
            error
        );

        showDNAToast(
            "DNA 정보를 불러오지 못했습니다."
        );

    }

}


// ============================================================
// DNA 생성
// ============================================================

async function generateDNA() {

    const user = auth.currentUser;

    if (!user) {

        showDNAToast(
            "로그인이 필요합니다."
        );

        return;

    }


    const refreshButton =
        document.getElementById(
            "refreshDNA"
        );


    refreshButton.disabled = true;

    refreshButton.textContent =
        "🧬 작품 분석 데이터를 모으는 중...";


    try {

        allWorks =
            await getUserWorks(
                user.uid
            );


        if (!allWorks.length) {

            showDNAToast(
                "먼저 작품을 등록해 주세요."
            );

            return;

        }


        allAnalyses =
            await getAllAnalyses(
                user.uid,
                allWorks
            );


        if (!allAnalyses.length) {

            showDNAToast(
                "먼저 AI 작품 분석을 저장해 주세요."
            );

            return;

        }


        const profile =
            buildDNAProfile(
                allWorks,
                allAnalyses
            );


        await saveDNAProfile(
            user.uid,
            profile
        );


        dnaProfile =
            profile;


        displayDNA(
            profile
        );


        showDNAToast(
            "CLAY DNA가 업데이트되었습니다."
        );


    } catch (error) {

        console.error(
            "DNA 생성 오류:",
            error
        );

        showDNAToast(
            "DNA 생성 중 오류가 발생했습니다."
        );

    } finally {

        refreshButton.disabled = false;

        refreshButton.textContent =
            "🔄 DNA 다시 분석하기";

    }

}


// ============================================================
// 작품 가져오기
// ============================================================

async function getUserWorks(uid) {

    const worksRef =
        collection(
            db,
            "users",
            uid,
            "works"
        );


    const worksQuery =
        query(
            worksRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );


    const snapshot =
        await getDocs(
            worksQuery
        );


    const works = [];


    snapshot.forEach(
        docSnap => {

            works.push({

                id:
                    docSnap.id,

                ...docSnap.data()

            });

        }
    );


    return works;

}


// ============================================================
// AI 분석 전체 가져오기
// ============================================================

async function getAllAnalyses(
    uid,
    works
) {

    const analyses = [];


    for (
        const work
        of works
    ) {

        const analysisRef =
            collection(
                db,
                "users",
                uid,
                "works",
                work.id,
                "aiAnalyses"
            );


        const snapshot =
            await getDocs(
                analysisRef
            );


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.analysis
                ) {

                    analyses.push({

                        id:
                            docSnap.id,

                        workId:
                            work.id,

                        workTitle:
                            work.title || "",

                        productionDate:
                            work.productionDate || "",

                        analysis:
                            data.analysis,

                        createdAt:
                            data.createdAt || null

                    });

                }

            }
        );

    }


    return analyses;

}


// ============================================================
// DNA 프로필 생성
// ============================================================

function buildDNAProfile(
    works,
    analyses
) {

    return {

        analyzedWorkCount:
            works.length,

        analyzedAnalysisCount:
            analyses.length,

        formDNA:
            combineValues(
                collectValues(
                    analyses,
                    "form"
                )
            ),

        materialDNA:
            combineValues(
                collectValues(
                    analyses,
                    "material"
                )
            ),

        techniqueDNA:
            combineValues(
                collectValues(
                    analyses,
                    "technique"
                )
            ),

        moodDNA:
            combineValues(
                collectValues(
                    analyses,
                    "mood"
                )
            ),

        formativeDNA:
            combineValues(
                collectValues(
                    analyses,
                    "formative"
                )
            ),

        artistIdentity:
            combineValues(
                collectValues(
                    analyses,
                    "artistCharacteristic"
                )
            ),

        development:
            combineValues(
                collectValues(
                    analyses,
                    "development"
                )
            ),

        updatedAt:
            serverTimestamp()

    };

}


// ============================================================
// 분석 항목 추출
// ============================================================

function collectValues(
    analyses,
    field
) {

    return analyses

        .map(
            item =>
                item.analysis?.[field]
        )

        .filter(
            value =>
                value &&
                String(value).trim()
        )

        .map(
            value =>
                String(value).trim()
        );

}


// ============================================================
// 중복 제거 후 결합
// ============================================================

function combineValues(values) {

    if (!values.length) {

        return "아직 충분한 분석 데이터가 없습니다.";

    }


    const unique = [];


    values.forEach(
        value => {

            if (
                !unique.includes(value)
            ) {

                unique.push(value);

            }

        }
    );


    return unique.join(" ");

}


// ============================================================
// DNA 저장
// ============================================================

async function saveDNAProfile(
    uid,
    profile
) {

    const profileRef =
        doc(
            db,
            "users",
            uid,
            "clayDNA",
            "profile"
        );


    await setDoc(
        profileRef,
        profile,
        {
            merge: true
        }
    );

}


// ============================================================
// DNA 화면 표시
// ============================================================

function displayDNA(profile) {

    document.getElementById(
        "dnaEmpty"
    ).style.display = "none";


    document.getElementById(
        "dnaContent"
    ).style.display = "block";


    const summary =
        document.getElementById(
            "dnaSummary"
        );


    summary.innerHTML = `

        <div
            style="
                font-size:13px;
                color:#777;
                margin-bottom:8px;
            "
        >
            분석된 작품
        </div>

        <div
            style="
                font-size:32px;
                font-weight:bold;
            "
        >
            ${profile.analyzedWorkCount || 0}
        </div>

        <div
            style="
                margin-top:6px;
                color:#666;
            "
        >
            작품에서 발견된 나의 창작 특징
        </div>

    `;


    const items = [

        [
            "형태 DNA",
            profile.formDNA
        ],

        [
            "재료 DNA",
            profile.materialDNA
        ],

        [
            "기법 DNA",
            profile.techniqueDNA
        ],

        [
            "분위기 DNA",
            profile.moodDNA
        ],

        [
            "조형 DNA",
            profile.formativeDNA
        ],

        [
            "작가 특징",
            profile.artistIdentity
        ],

        [
            "발전 방향",
            profile.development
        ]

    ];


    let html = "";


    items.forEach(
        ([title, value]) => {

            html += `

                <div
                    style="
                        border:1px solid #e5e5e5;
                        border-radius:15px;
                        padding:17px;
                        margin-bottom:12px;
                    "
                >

                    <h3
                        style="
                            margin:0 0 9px;
                            font-size:17px;
                        "
                    >
                        ${title}
                    </h3>

                    <p
                        style="
                            margin:0;
                            line-height:1.7;
                            color:#444;
                        "
                    >
                        ${escapeHTML(
                            value || "-"
                        )}
                    </p>

                </div>

            `;

        }
    );


    document.getElementById(
        "dnaCards"
    ).innerHTML = html;


    updateStyleChangePreview();

}


// ============================================================
// 작업 스타일 변화 미리보기
// ============================================================

function updateStyleChangePreview() {

    const count =
        getAnalyzedWorkCount();


    document.getElementById(
        "styleChangeCount"
    ).textContent =
        `${count}+`;


    const content =
        document.getElementById(
            "styleChangeContent"
        );


    if (count < 2) {

        content.innerHTML = `

            <div
                style="
                    padding:16px;
                    background:#f7f7f7;
                    border-radius:14px;
                    line-height:1.6;
                    color:#666;
                "
            >

                서로 다른 시점의 작품
                2개 이상을 AI 분석하면
                작업 스타일의 변화를 비교할 수 있습니다.

            </div>

        `;

        return;

    }


    const timeline =
        createStyleTimeline();


    content.innerHTML = `

        <div
            style="
                background:#f7f7f7;
                border-radius:14px;
                padding:16px;
            "
        >

            <div
                style="
                    font-weight:bold;
                    margin-bottom:12px;
                "
            >
                ${timeline.length}개의 작품 분석 데이터
            </div>

            <div
                style="
                    line-height:1.8;
                    color:#555;
                "
            >
                초기 작품부터 최근 작품까지
                창작 특징의 변화를 확인할 수 있습니다.
            </div>

        </div>

    `;

}


// ============================================================
// 분석된 작품 수
// ============================================================

function getAnalyzedWorkCount() {

    const workIds =
        new Set();


    allAnalyses.forEach(
        item => {

            if (item.workId) {

                workIds.add(
                    item.workId
                );

            }

        }
    );


    return workIds.size;

}


// ============================================================
// 시간순 작품 타임라인
// ============================================================

function createStyleTimeline() {

    const grouped =
        new Map();


    allAnalyses.forEach(
        item => {

            if (
                !grouped.has(
                    item.workId
                )
            ) {

                grouped.set(
                    item.workId,
                    item
                );

            }

        }
    );


    const timeline =
        Array.from(
            grouped.values()
        );


    timeline.sort(
        (a, b) => {

            const dateA =
                getWorkDate(
                    a
                );

            const dateB =
                getWorkDate(
                    b
                );


            return dateA - dateB;

        }
    );


    return timeline;

}


// ============================================================
// 작품 날짜
// ============================================================

function getWorkDate(item) {

    if (
        item.productionDate
    ) {

        const date =
            new Date(
                item.productionDate
            );


        if (
            !isNaN(
                date.getTime()
            )
        ) {

            return date;

        }

    }


    if (
        item.createdAt &&
        item.createdAt.seconds
    ) {

        return new Date(
            item.createdAt.seconds * 1000
        );

    }


    return new Date(0);

}


// ============================================================
// 작업 스타일 변화 상세보기
// ============================================================

function showStyleChangeDetail() {

    const count =
        getAnalyzedWorkCount();


    if (count < 2) {

        showDNAToast(
            "서로 다른 작품 2개 이상을 AI 분석해 주세요."
        );

        return;

    }


    const timeline =
        createStyleTimeline();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "styleChangeModal";


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:10000;
        background:rgba(0,0,0,0.55);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        box-sizing:border-box;
    `;


    let timelineHTML = "";


    timeline.forEach(
        (item, index) => {

            const analysis =
                item.analysis || {};


            const date =
                formatDate(
                    item
                );


            timelineHTML += `

                <div
                    style="
                        position:relative;
                        padding:18px;
                        margin-bottom:14px;
                        background:#fafafa;
                        border-radius:15px;
                        border:1px solid #e5e5e5;
                    "
                >

                    <div
                        style="
                            font-size:13px;
                            color:#888;
                            margin-bottom:5px;
                        "
                    >
                        ${index + 1}번째 작품
                        · ${date}
                    </div>


                    <h3
                        style="
                            margin:0 0 12px;
                        "
                    >
                        ${escapeHTML(
                            item.workTitle ||
                            "작품"
                        )}
                    </h3>


                    <div
                        style="
                            line-height:1.7;
                            color:#444;
                        "
                    >

                        <div>
                            <b>형태:</b>
                            ${escapeHTML(
                                analysis.form || "-"
                            )}
                        </div>

                        <div>
                            <b>기법:</b>
                            ${escapeHTML(
                                analysis.technique || "-"
                            )}
                        </div>

                        <div>
                            <b>분위기:</b>
                            ${escapeHTML(
                                analysis.mood || "-"
                            )}
                        </div>

                        <div>
                            <b>조형성:</b>
                            ${escapeHTML(
                                analysis.formative || "-"
                            )}
                        </div>

                    </div>

                </div>

            `;

        }
    );


    overlay.innerHTML = `

        <div
            style="
                width:min(760px,100%);
                max-height:90vh;
                overflow-y:auto;
                background:white;
                border-radius:20px;
                padding:24px;
                box-sizing:border-box;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:20px;
                "
            >

                <div>

                    <h2 style="margin:0 0 5px;">
                        📈 작업 스타일 변화
                    </h2>

                    <p
                        style="
                            margin:0;
                            color:#666;
                        "
                    >
                        초기 작품부터 최근 작품까지
                    </p>

                </div>


                <button
                    id="closeStyleChange"
                    type="button"
                    style="
                        border:0;
                        background:#f1f1f1;
                        width:40px;
                        height:40px;
                        border-radius:50%;
                        font-size:20px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>


            <div>

                ${timelineHTML}

            </div>


            <div
                style="
                    margin-top:18px;
                    padding:16px;
                    background:#f7f7f7;
                    border-radius:14px;
                    line-height:1.7;
                    color:#555;
                "
            >

                현재 단계에서는 작품별 AI 분석 내용을
                시간순으로 비교합니다.
                작품 데이터가 더 쌓이면
                형태·기법·분위기 등의 변화량을
                별도의 AI 분석으로 발전시킬 수 있습니다.

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    document
        .getElementById(
            "closeStyleChange"
        )
        .addEventListener(
            "click",
            () => {

                overlay.remove();

            }
        );

}


// ============================================================
// 날짜 표시
// ============================================================

function formatDate(item) {

    const date =
        getWorkDate(item);


    if (
        date.getTime() === 0
    ) {

        return "날짜 미상";

    }


    return date.toLocaleDateString(
        "ko-KR"
    );

}


// ============================================================
// DNA 없음
// ============================================================

function showEmptyDNA() {

    document.getElementById(
        "dnaEmpty"
    ).style.display =
        "block";


    document.getElementById(
        "dnaContent"
    ).style.display =
        "none";

}


// ============================================================
// DNA 닫기
// ============================================================

function closeDNAModal() {

    const modal =
        document.getElementById(
            "dnaModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// ============================================================
// Toast
// ============================================================

function showDNAToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (toast) {

        toast.textContent =
            message;

        toast.classList.add(
            "show"
        );


        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

        return;

    }


    alert(message);

}


// ============================================================
// HTML 안전 처리
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}
