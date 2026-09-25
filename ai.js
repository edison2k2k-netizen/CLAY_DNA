// ============================================================
// CLAY DNA
// AI 작품 분석
// ============================================================

import {
    auth,
    db,
    functions
} from "./firebase.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================================
// 전역 상태
// ============================================================

let selectedAIWork = null;

let currentAnalysis = null;


// ============================================================
// 초기화
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    createAIInterface();

    connectAIButtons();

});


// ============================================================
// AI UI 생성
// ============================================================

function createAIInterface() {

    if (document.getElementById("aiModal")) {
        return;
    }


    const modal = document.createElement("div");

    modal.id = "aiModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:9999;
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
                background:#ffffff;
                border-radius:20px;
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
                            font-size:24px;
                        "
                    >
                        🔍 AI 작품 분석
                    </h2>

                    <p
                        id="aiWorkTitle"
                        style="
                            margin:0;
                            color:#666;
                        "
                    >
                        작품을 선택하세요.
                    </p>

                </div>


                <button
                    id="closeAIModal"
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
                id="aiWorkInfo"
                style="
                    background:#f7f7f7;
                    border-radius:14px;
                    padding:16px;
                    margin-bottom:18px;
                "
            >
                작품 정보
            </div>


            <button
                id="runAIAnalysis"
                type="button"
                style="
                    width:100%;
                    border:0;
                    border-radius:12px;
                    padding:15px;
                    background:#222;
                    color:white;
                    font-size:16px;
                    cursor:pointer;
                "
            >
                ✨ AI 작품 분석 시작
            </button>


            <div
                id="aiLoading"
                style="
                    display:none;
                    text-align:center;
                    padding:30px 10px;
                    color:#666;
                "
            >

                <div style="font-size:32px;">
                    🧬
                </div>

                <p>
                    작품의 형태와 기법을 분석하고 있습니다.
                </p>

                <p>
                    잠시 기다려 주세요.
                </p>

            </div>


            <div
                id="aiResult"
                style="
                    display:none;
                    margin-top:22px;
                "
            >

                <h3>
                    AI 분석 결과
                </h3>


                <div id="aiResultContent"></div>


                <button
                    id="saveAIAnalysis"
                    type="button"
                    style="
                        width:100%;
                        margin-top:20px;
                        border:0;
                        border-radius:12px;
                        padding:15px;
                        background:#555;
                        color:white;
                        font-size:16px;
                        cursor:pointer;
                    "
                >
                    💾 분석 결과 저장
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(modal);


    document
        .getElementById("closeAIModal")
        .addEventListener("click", closeAIModal);


    document
        .getElementById("runAIAnalysis")
        .addEventListener("click", runAIAnalysis);


    document
        .getElementById("saveAIAnalysis")
        .addEventListener("click", saveAIAnalysis);

}


// ============================================================
// 버튼 연결
// ============================================================

function connectAIButtons() {

    document
        .querySelectorAll('[data-feature="analyze"]')
        .forEach(button => {

            button.addEventListener("click", () => {

                openAIWorkSelector();

            });

        });


    document
        .querySelectorAll('[data-nav="ai"]')
        .forEach(button => {

            button.addEventListener("click", () => {

                openAIWorkSelector();

            });

        });

}


// ============================================================
// 작품 선택
// ============================================================

async function openAIWorkSelector() {

    const user = auth.currentUser;


    if (!user) {

        showAIToast("먼저 로그인해 주세요.");

        return;

    }


    try {

        const worksRef = collection(
            db,
            "users",
            user.uid,
            "works"
        );


        const worksQuery = query(
            worksRef,
            orderBy("createdAt", "desc")
        );


        const snapshot = await getDocs(worksQuery);


        if (snapshot.empty) {

            showAIToast(
                "먼저 작품을 등록해 주세요."
            );

            return;

        }


        const works = [];


        snapshot.forEach(docSnap => {

            works.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });


        showWorkSelector(works);

    } catch (error) {

        console.error(
            "AI 작품 목록 오류:",
            error
        );

        showAIToast(
            "작품 목록을 불러오지 못했습니다."
        );

    }

}


// ============================================================
// 작품 선택창
// ============================================================

function showWorkSelector(works) {

    const modal = document.getElementById("aiModal");

    const title = document.getElementById("aiWorkTitle");

    const info = document.getElementById("aiWorkInfo");

    const result = document.getElementById("aiResult");

    const loading = document.getElementById("aiLoading");


    title.textContent =
        "분석할 작품을 선택하세요.";


    result.style.display = "none";

    loading.style.display = "none";


    let html = `

        <div>

            <h3>
                내 작품
            </h3>

    `;


    works.forEach(work => {

        html += `

            <button
                type="button"
                class="ai-work-select"
                data-work-id="${escapeHTML(work.id)}"
                style="
                    display:block;
                    width:100%;
                    text-align:left;
                    border:1px solid #ddd;
                    background:white;
                    border-radius:12px;
                    padding:14px;
                    margin:8px 0;
                    cursor:pointer;
                "
            >

                <strong>
                    ${escapeHTML(
                        work.title || "제목 없음"
                    )}
                </strong>

                <br>

                <small>
                    ${escapeHTML(
                        work.type || "작품"
                    )}

                    ·

                    ${escapeHTML(
                        work.technique || "기법 미입력"
                    )}
                </small>

            </button>

        `;

    });


    html += `

        </div>
    `;


    info.innerHTML = html;


    document
        .querySelectorAll(".ai-work-select")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.workId;


                    const work =
                        works.find(
                            item =>
                                item.id === id
                        );


                    if (!work) {
                        return;
                    }


                    selectedAIWork = work;


                    showSelectedWork(work);

                }
            );

        });


    modal.style.display = "flex";

}


// ============================================================
// 선택된 작품
// ============================================================

function showSelectedWork(work) {

    const title =
        document.getElementById(
            "aiWorkTitle"
        );


    const info =
        document.getElementById(
            "aiWorkInfo"
        );


    title.textContent =
        work.title || "제목 없음";


    info.innerHTML = `

        <strong>
            작품 정보
        </strong>

        <div style="margin-top:10px;line-height:1.8;">

            <div>
                <b>작품명:</b>
                ${escapeHTML(
                    work.title || "-"
                )}
            </div>

            <div>
                <b>제작일:</b>
                ${escapeHTML(
                    work.productionDate || "-"
                )}
            </div>

            <div>
                <b>종류:</b>
                ${escapeHTML(
                    work.type || "-"
                )}
            </div>

            <div>
                <b>흙:</b>
                ${escapeHTML(
                    work.clay || "-"
                )}
            </div>

            <div>
                <b>기법:</b>
                ${escapeHTML(
                    work.technique || "-"
                )}
            </div>

            <div>
                <b>작품 설명:</b>
                ${escapeHTML(
                    work.description || "-"
                )}
            </div>

        </div>

    `;


    document.getElementById(
        "aiResult"
    ).style.display = "none";

}


// ============================================================
// AI 분석 실행
// ============================================================

async function runAIAnalysis() {

    if (!selectedAIWork) {

        showAIToast(
            "먼저 작품을 선택하세요."
        );

        return;

    }


    const user = auth.currentUser;


    if (!user) {

        showAIToast(
            "로그인이 필요합니다."
        );

        return;

    }


    const button =
        document.getElementById(
            "runAIAnalysis"
        );


    const loading =
        document.getElementById(
            "aiLoading"
        );


    const result =
        document.getElementById(
            "aiResult"
        );


    button.disabled = true;

    button.style.opacity = "0.5";

    loading.style.display = "block";

    result.style.display = "none";


    try {

        const analyzeWork =
            httpsCallable(
                functions,
                "analyzeClayWork"
            );


        const response =
            await analyzeWork({

                work: {

                    id: selectedAIWork.id,

                    title:
                        selectedAIWork.title || "",

                    productionDate:
                        selectedAIWork.productionDate || "",

                    type:
                        selectedAIWork.type || "",

                    clay:
                        selectedAIWork.clay || "",

                    technique:
                        selectedAIWork.technique || "",

                    description:
                        selectedAIWork.description || ""

                }

            });


        currentAnalysis =
            response.data.analysis;


        displayAIResult(
            currentAnalysis
        );


        showAIToast(
            "AI 분석이 완료되었습니다."
        );


    } catch (error) {

        console.error(
            "AI 분석 오류:",
            error
        );


        let message =
            "AI 분석에 실패했습니다.";


        if (error?.message) {

            message =
                error.message;

        }


        showAIToast(message);

    } finally {

        button.disabled = false;

        button.style.opacity = "1";

        loading.style.display = "none";

    }

}


// ============================================================
// 분석 결과 표시
// ============================================================

function displayAIResult(analysis) {

    const result =
        document.getElementById(
            "aiResult"
        );


    const content =
        document.getElementById(
            "aiResultContent"
        );


    const fields = [

        ["형태", analysis.form],

        ["재료", analysis.material],

        ["기법", analysis.technique],

        ["분위기", analysis.mood],

        ["조형성", analysis.formative],

        ["작가특징", analysis.artistCharacteristic],

        ["발전방향", analysis.development]

    ];


    let html = "";


    fields.forEach(
        ([label, value]) => {

            html += `

                <div
                    style="
                        border:1px solid #e5e5e5;
                        border-radius:14px;
                        padding:16px;
                        margin-bottom:12px;
                    "
                >

                    <h4
                        style="
                            margin:0 0 8px;
                        "
                    >
                        ${label}
                    </h4>

                    <p
                        style="
                            margin:0;
                            line-height:1.7;
                            color:#444;
                        "
                    >
                        ${escapeHTML(
                            value || "분석 내용 없음"
                        )}
                    </p>

                </div>

            `;

        }
    );


    content.innerHTML = html;


    result.style.display = "block";

}


// ============================================================
// Firestore 저장
// ============================================================

async function saveAIAnalysis() {

    if (!selectedAIWork) {

        showAIToast(
            "선택된 작품이 없습니다."
        );

        return;

    }


    if (!currentAnalysis) {

        showAIToast(
            "먼저 AI 분석을 실행하세요."
        );

        return;

    }


    const user = auth.currentUser;


    if (!user) {

        showAIToast(
            "로그인이 필요합니다."
        );

        return;

    }


    try {

        const analysisRef =
            collection(

                db,

                "users",

                user.uid,

                "works",

                selectedAIWork.id,

                "aiAnalyses"

            );


        await addDoc(
            analysisRef,
            {

                workId:
                    selectedAIWork.id,

                userId:
                    user.uid,

                analysis:
                    currentAnalysis,

                createdAt:
                    serverTimestamp()

            }
        );


        showAIToast(
            "AI 분석 결과가 저장되었습니다."
        );


    } catch (error) {

        console.error(
            "AI 분석 저장 오류:",
            error
        );


        showAIToast(
            "분석 결과 저장에 실패했습니다."
        );

    }

}


// ============================================================
// 모달 닫기
// ============================================================

function closeAIModal() {

    const modal =
        document.getElementById(
            "aiModal"
        );


    if (modal) {

        modal.style.display = "none";

    }


    selectedAIWork = null;

    currentAnalysis = null;

}


// ============================================================
// Toast
// ============================================================

function showAIToast(message) {

    const toast =
        document.getElementById("toast");


    if (toast) {

        toast.textContent = message;

        toast.classList.add("show");


        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);


        return;

    }


    alert(message);

}


// ============================================================
// HTML 안전 처리
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
