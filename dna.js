// ============================================================
// CLAY DNA
// 개인 창작 스타일 분석
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


// ============================================================
// 시작
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    createDNAInterface();

    connectDNAButtons();

});


// ============================================================
// DNA 화면 생성
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
                width:min(760px,100%);
                max-height:90vh;
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

                    <h2
                        style="
                            margin:0 0 6px;
                        "
                    >
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
                    AI 작품 분석을 1개 이상 저장하면
                    나의 창작 DNA를 만들 수 있습니다.
                </p>

            </div>


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


                <div
                    id="dnaCards"
                ></div>


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
                    기반으로 생성된 초기 창작 프로필입니다.
                    작품과 분석 데이터가 늘어날수록
                    프로필을 다시 업데이트할 수 있습니다.

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
// 기존 DNA 불러오기
// ============================================================

async function loadDNA() {

    const user = auth.currentUser;


    if (!user) {
        return;
    }


    const profileRef =
        doc(
            db,
            "users",
            user.uid,
            "clayDNA",
            "profile"
        );


    try {

        const snapshot =
            await getDoc(profileRef);


        if (
            snapshot.exists()
        ) {

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

        const works =
            await getUserWorks(
                user.uid
            );


        if (!works.length) {

            showDNAToast(
                "먼저 작품을 등록해 주세요."
            );

            return;

        }


        const analyses =
            await getAllAnalyses(
                user.uid,
                works
            );


        if (!analyses.length) {

            showDNAToast(
                "먼저 AI 작품 분석을 저장해 주세요."
            );

            return;

        }


        const profile =
            buildDNAProfile(
                works,
                analyses
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

                id: docSnap.id,

                ...docSnap.data()

            });

        }
    );


    return works;

}


// ============================================================
// 모든 AI 분석 가져오기
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

                        workId:
                            work.id,

                        workTitle:
                            work.title || "",

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

    const form =
        collectValues(
            analyses,
            "form"
        );


    const material =
        collectValues(
            analyses,
            "material"
        );


    const technique =
        collectValues(
            analyses,
            "technique"
        );


    const mood =
        collectValues(
            analyses,
            "mood"
        );


    const formative =
        collectValues(
            analyses,
            "formative"
        );


    const artistCharacteristic =
        collectValues(
            analyses,
            "artistCharacteristic"
        );


    const development =
        collectValues(
            analyses,
            "development"
        );


    return {

        analyzedWorkCount:
            works.length,

        analyzedAnalysisCount:
            analyses.length,

        formDNA:
            combineValues(form),

        materialDNA:
            combineValues(material),

        techniqueDNA:
            combineValues(technique),

        moodDNA:
            combineValues(mood),

        formativeDNA:
            combineValues(formative),

        artistIdentity:
            combineValues(
                artistCharacteristic
            ),

        development:
            combineValues(
                development
            ),

        updatedAt:
            serverTimestamp()

    };

}


// ============================================================
// 특정 분석 항목 모으기
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
// 텍스트 결합
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


    return unique.join(
        " "
    );

}


// ============================================================
// Firestore 저장
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

    const empty =
        document.getElementById(
            "dnaEmpty"
        );


    const content =
        document.getElementById(
            "dnaContent"
        );


    const summary =
        document.getElementById(
            "dnaSummary"
        );


    const cards =
        document.getElementById(
            "dnaCards"
        );


    empty.style.display =
        "none";


    content.style.display =
        "block";


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


    cards.innerHTML =
        html;

}


// ============================================================
// 빈 상태
// ============================================================

function showEmptyDNA() {

    document.getElementById(
        "dnaEmpty"
    ).style.display = "block";


    document.getElementById(
        "dnaContent"
    ).style.display = "none";

}


// ============================================================
// 닫기
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
