// ============================================================
// CLAY DNA
// Firebase + 인증 + 작품 등록 + Firestore 작품 관리
// ============================================================


// ============================================================
// 1. Firebase SDK
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================================
// 2. Firebase 설정
// ============================================================

const firebaseConfig = {

    apiKey: "AIzaSyDEtOI_079ay9q_g1biT6vKPcf7G4a5NQs",

    authDomain: "clay-dna.firebaseapp.com",

    projectId: "clay-dna",

    storageBucket: "clay-dna.firebasestorage.app",

    messagingSenderId: "456070145020",

    appId: "1:456070145020:web:2bcfc864817e2efa728879",

    measurementId: "G-30DNQX0P85"

};


// ============================================================
// 3. Firebase 초기화
// ============================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);


// ============================================================
// 4. 전역 상태
// ============================================================

let currentUser = null;

let works = [];


// ============================================================
// 5. DOM
// ============================================================

const toastElement =
    document.getElementById("toast");

const addWorkButton =
    document.getElementById("addWorkButton");

const menuButton =
    document.getElementById("menuButton");


// ============================================================
// 6. Toast
// ============================================================

function showToast(message) {

    if (!toastElement) {

        console.log(message);

        return;
    }

    toastElement.textContent =
        message;

    toastElement.classList.add("show");

    setTimeout(() => {

        toastElement.classList.remove("show");

    }, 2500);

}


// ============================================================
// 7. Firebase 시작 확인
// ============================================================

console.log(
    "======================================"
);

console.log(
    "CLAY DNA Firebase 시작"
);

console.log(
    "Project ID:",
    firebaseConfig.projectId
);

console.log(
    "Firebase App:",
    firebaseApp.name
);

console.log(
    "======================================"
);


// ============================================================
// 8. 인증 화면 생성
// ============================================================

function createAuthPanel() {

    if (
        document.getElementById(
            "authPanel"
        )
    ) {

        return;
    }


    const panel =
        document.createElement("div");

    panel.id =
        "authPanel";


    panel.innerHTML = `

        <div class="auth-overlay">

            <div class="auth-box">

                <button
                    type="button"
                    id="authCloseButton"
                    class="auth-close"
                >
                    ×
                </button>


                <div class="auth-logo">
                    🏺
                </div>


                <h2>
                    CLAY DNA
                </h2>


                <p class="auth-description">
                    나의 도자기 창작 공간
                </p>


                <div
                    id="authUserInfo"
                    class="auth-user-info"
                    style="display:none;"
                ></div>


                <div id="authFormArea">

                    <input
                        type="email"
                        id="authEmail"
                        placeholder="이메일"
                        autocomplete="email"
                    >


                    <input
                        type="password"
                        id="authPassword"
                        placeholder="비밀번호"
                        autocomplete="current-password"
                    >


                    <button
                        type="button"
                        id="loginButton"
                        class="auth-main-button"
                    >
                        로그인
                    </button>


                    <button
                        type="button"
                        id="signupButton"
                        class="auth-sub-button"
                    >
                        회원가입
                    </button>

                </div>


                <div
                    id="authLoggedInArea"
                    style="display:none;"
                >

                    <p>
                        현재 로그인된 계정
                    </p>

                    <strong
                        id="loggedInEmail"
                    ></strong>


                    <button
                        type="button"
                        id="logoutButton"
                        class="auth-main-button"
                    >
                        로그아웃
                    </button>

                </div>


                <div
                    id="authMessage"
                    class="auth-message"
                ></div>

            </div>

        </div>

    `;


    document.body.appendChild(panel);


    // ========================================================
    // 인증 화면 스타일
    // ========================================================

    const style =
        document.createElement("style");

    style.id =
        "clay-auth-style";

    style.textContent = `

        #authPanel {
            position: fixed;
            inset: 0;
            z-index: 9999;
        }

        .auth-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .auth-box {
            position: relative;
            width: min(420px, 100%);
            background: #ffffff;
            border-radius: 20px;
            padding: 30px 24px;
            box-sizing: border-box;
            box-shadow: 0 20px 60px rgba(0,0,0,0.20);
            text-align: center;
        }

        .auth-close {
            position: absolute;
            right: 15px;
            top: 10px;
            border: 0;
            background: transparent;
            font-size: 28px;
            cursor: pointer;
        }

        .auth-logo {
            font-size: 42px;
            margin-bottom: 8px;
        }

        .auth-box h2 {
            margin: 0;
        }

        .auth-description {
            margin: 8px 0 22px;
            color: #777;
        }

        .auth-box input {
            width: 100%;
            box-sizing: border-box;
            padding: 13px 14px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 10px;
            font-size: 15px;
            outline: none;
        }

        .auth-box input:focus {
            border-color: #777;
        }

        .auth-main-button,
        .auth-sub-button {
            width: 100%;
            padding: 13px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 15px;
            margin-top: 8px;
        }

        .auth-main-button {
            border: 0;
            background: #333;
            color: white;
        }

        .auth-sub-button {
            border: 1px solid #ddd;
            background: white;
            color: #333;
        }

        .auth-user-info {
            margin-bottom: 15px;
        }

        .auth-message {
            min-height: 22px;
            margin-top: 14px;
            font-size: 13px;
            color: #777;
        }

        .auth-message.error {
            color: #c62828;
        }

        .auth-message.success {
            color: #2e7d32;
        }

    `;

    document.head.appendChild(style);


    // ========================================================
    // 인증 버튼 연결
    // ========================================================

    document
        .getElementById("authCloseButton")
        .addEventListener(
            "click",
            closeAuthPanel
        );


    document
        .getElementById("loginButton")
        .addEventListener(
            "click",
            loginUser
        );


    document
        .getElementById("signupButton")
        .addEventListener(
            "click",
            signupUser
        );


    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            logoutUser
        );

}


// ============================================================
// 9. 인증창 열기
// ============================================================

function openAuthPanel() {

    createAuthPanel();

    const panel =
        document.getElementById(
            "authPanel"
        );

    panel.style.display =
        "block";

    updateAuthUI();

}


// ============================================================
// 10. 인증창 닫기
// ============================================================

function closeAuthPanel() {

    const panel =
        document.getElementById(
            "authPanel"
        );

    if (panel) {

        panel.style.display =
            "none";

    }

}


// ============================================================
// 11. 인증 메시지
// ============================================================

function setAuthMessage(
    message,
    type = ""
) {

    const element =
        document.getElementById(
            "authMessage"
        );

    if (!element) {

        return;
    }

    element.textContent =
        message;

    element.className =
        "auth-message " + type;

}


// ============================================================
// 12. 회원가입
// ============================================================

async function signupUser() {

    const email =
        document
            .getElementById("authEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("authPassword")
            .value;


    if (!email || !password) {

        setAuthMessage(
            "이메일과 비밀번호를 입력하세요.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        setAuthMessage(
            "비밀번호는 6자 이상이어야 합니다.",
            "error"
        );

        return;
    }


    try {

        setAuthMessage(
            "회원가입 처리 중..."
        );


        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        currentUser =
            userCredential.user;


        setAuthMessage(
            "회원가입이 완료되었습니다.",
            "success"
        );


        showToast(
            "CLAY DNA 회원가입 완료"
        );


        updateAuthUI();


        await loadWorks();


    } catch (error) {

        console.error(
            "회원가입 오류:",
            error
        );


        setAuthMessage(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


// ============================================================
// 13. 로그인
// ============================================================

async function loginUser() {

    const email =
        document
            .getElementById("authEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("authPassword")
            .value;


    if (!email || !password) {

        setAuthMessage(
            "이메일과 비밀번호를 입력하세요.",
            "error"
        );

        return;
    }


    try {

        setAuthMessage(
            "로그인 처리 중..."
        );


        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        currentUser =
            userCredential.user;


        setAuthMessage(
            "로그인되었습니다.",
            "success"
        );


        showToast(
            "CLAY DNA 로그인 완료"
        );


        updateAuthUI();


        await loadWorks();


    } catch (error) {

        console.error(
            "로그인 오류:",
            error
        );


        setAuthMessage(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


// ============================================================
// 14. 로그아웃
// ============================================================

async function logoutUser() {

    try {

        await signOut(auth);

        currentUser = null;

        works = [];

        updateWorkCount();

        showToast(
            "로그아웃되었습니다."
        );

        updateAuthUI();


    } catch (error) {

        console.error(
            "로그아웃 오류:",
            error
        );

        showToast(
            "로그아웃 중 오류가 발생했습니다."
        );

    }

}


// ============================================================
// 15. 인증 UI 업데이트
// ============================================================

function updateAuthUI() {

    const formArea =
        document.getElementById(
            "authFormArea"
        );

    const loggedInArea =
        document.getElementById(
            "authLoggedInArea"
        );

    const loggedInEmail =
        document.getElementById(
            "loggedInEmail"
        );


    if (
        !formArea ||
        !loggedInArea
    ) {

        return;
    }


    if (currentUser) {

        formArea.style.display =
            "none";

        loggedInArea.style.display =
            "block";


        if (loggedInEmail) {

            loggedInEmail.textContent =
                currentUser.email || "";

        }

    } else {

        formArea.style.display =
            "block";

        loggedInArea.style.display =
            "none";

    }

}


// ============================================================
// 16. Firebase 인증 상태 감시
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser =
            user;


        console.log(
            "인증 상태:",
            user
                ? `로그인됨 (${user.email})`
                : "로그아웃 상태"
        );


        updateAuthUI();


        if (user) {

            console.log(
                "현재 사용자 UID:",
                user.uid
            );


            await loadWorks();

        } else {

            works = [];

            updateWorkCount();

        }

    }
);


// ============================================================
// 17. Firebase 오류 메시지
// ============================================================

function getFirebaseErrorMessage(error) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/email-already-in-use":
            return "이미 사용 중인 이메일입니다.";

        case "auth/invalid-email":
            return "이메일 주소 형식이 올바르지 않습니다.";

        case "auth/weak-password":
            return "비밀번호가 너무 약합니다.";

        case "auth/invalid-credential":
            return "이메일 또는 비밀번호가 올바르지 않습니다.";

        case "auth/user-not-found":
            return "등록된 사용자를 찾을 수 없습니다.";

        case "auth/wrong-password":
            return "비밀번호가 올바르지 않습니다.";

        case "auth/too-many-requests":
            return "잠시 후 다시 시도하세요.";

        case "auth/network-request-failed":
            return "네트워크 연결을 확인하세요.";

        case "auth/operation-not-allowed":
            return "Firebase Authentication 설정을 확인하세요.";

        default:
            return (
                "Firebase 오류가 발생했습니다. " +
                code
            );

    }

}


// ============================================================
// 18. 작품 등록 화면 스타일
// ============================================================

function createWorkStyle() {

    if (
        document.getElementById(
            "clay-work-style"
        )
    ) {

        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "clay-work-style";


    style.textContent = `

        #workModal {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: none;
        }

        .work-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.48);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
        }

        .work-box {
            width: min(520px, 100%);
            max-height: 92vh;
            overflow-y: auto;
            background: white;
            border-radius: 20px;
            padding: 24px;
            box-sizing: border-box;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }

        .work-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .work-header h2 {
            margin: 0;
            font-size: 22px;
        }

        .work-close {
            border: 0;
            background: transparent;
            font-size: 28px;
            cursor: pointer;
        }

        .work-form label {
            display: block;
            margin-top: 14px;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 600;
        }

        .work-form input,
        .work-form select,
        .work-form textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 10px;
            font-size: 14px;
            font-family: inherit;
            outline: none;
        }

        .work-form input:focus,
        .work-form select:focus,
        .work-form textarea:focus {
            border-color: #777;
        }

        .work-form textarea {
            min-height: 110px;
            resize: vertical;
        }

        .work-save-button {
            width: 100%;
            margin-top: 22px;
            padding: 14px;
            border: 0;
            border-radius: 10px;
            background: #333;
            color: white;
            font-size: 15px;
            cursor: pointer;
        }

        .work-save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        #worksModal {
            position: fixed;
            inset: 0;
            z-index: 10001;
            display: none;
        }

        .works-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.48);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        }

        .works-box {
            width: min(620px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            background: white;
            border-radius: 20px;
            padding: 24px;
            box-sizing: border-box;
        }

        .works-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .works-header h2 {
            margin: 0;
        }

        .works-close {
            border: 0;
            background: transparent;
            font-size: 28px;
            cursor: pointer;
        }

        .work-item {
            border: 1px solid #e3e3e3;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 12px;
            background: #fafafa;
        }

        .work-item-title {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .work-item-meta {
            font-size: 13px;
            color: #777;
            line-height: 1.7;
        }

        .work-item-description {
            margin-top: 10px;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .work-delete-button {
            margin-top: 12px;
            padding: 7px 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 12px;
        }

        .works-empty {
            text-align: center;
            padding: 40px 15px;
            color: #777;
        }

        .works-add-button {
            width: 100%;
            margin-top: 15px;
            padding: 13px;
            border: 0;
            border-radius: 10px;
            background: #333;
            color: white;
            cursor: pointer;
            font-size: 14px;
        }

    `;


    document.head.appendChild(style);

}


// ============================================================
// 19. 작품 등록 화면 생성
// ============================================================

function createWorkModal() {

    if (
        document.getElementById(
            "workModal"
        )
    ) {

        return;
    }


    createWorkStyle();


    const modal =
        document.createElement("div");

    modal.id =
        "workModal";


    modal.innerHTML = `

        <div class="work-overlay">

            <div class="work-box">

                <div class="work-header">

                    <h2>
                        🏺 작품 등록
                    </h2>

                    <button
                        type="button"
                        id="workCloseButton"
                        class="work-close"
                    >
                        ×
                    </button>

                </div>


                <form
                    id="workForm"
                    class="work-form"
                >

                    <label for="workTitle">
                        작품명
                    </label>

                    <input
                        id="workTitle"
                        type="text"
                        placeholder="예: 바다를 담은 항아리"
                        required
                    >


                    <label for="workDate">
                        제작일
                    </label>

                    <input
                        id="workDate"
                        type="date"
                    >


                    <label for="workType">
                        작품 종류
                    </label>

                    <select id="workType">

                        <option value="">
                            선택하세요
                        </option>

                        <option value="항아리">
                            항아리
                        </option>

                        <option value="컵">
                            컵
                        </option>

                        <option value="접시">
                            접시
                        </option>

                        <option value="화병">
                            화병
                        </option>

                        <option value="조형물">
                            조형물
                        </option>

                        <option value="생활도자">
                            생활도자
                        </option>

                        <option value="기타">
                            기타
                        </option>

                    </select>


                    <label for="workClay">
                        사용 흙
                    </label>

                    <input
                        id="workClay"
                        type="text"
                        placeholder="예: 백자토, 산청토"
                    >


                    <label for="workTechnique">
                        제작 기법
                    </label>

                    <input
                        id="workTechnique"
                        type="text"
                        placeholder="예: 물레성형, 코일링"
                    >


                    <label for="workDescription">
                        작품 설명
                    </label>

                    <textarea
                        id="workDescription"
                        placeholder="작품의 느낌, 제작 의도, 특징 등을 기록하세요."
                    ></textarea>


                    <button
                        id="workSaveButton"
                        class="work-save-button"
                        type="submit"
                    >
                        작품 저장하기
                    </button>

                </form>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    document
        .getElementById(
            "workCloseButton"
        )
        .addEventListener(
            "click",
            closeWorkModal
        );


    document
        .getElementById(
            "workForm"
        )
        .addEventListener(
            "submit",
            handleWorkSubmit
        );

}


// ============================================================
// 20. 작품 등록창 열기
// ============================================================

function openWorkModal() {

    if (!currentUser) {

        showToast(
            "작품을 등록하려면 로그인하세요."
        );

        openAuthPanel();

        return;
    }


    createWorkModal();


    const modal =
        document.getElementById(
            "workModal"
        );


    modal.style.display =
        "block";


    const titleInput =
        document.getElementById(
            "workTitle"
        );


    if (titleInput) {

        setTimeout(() => {

            titleInput.focus();

        }, 100);

    }

}


// ============================================================
// 21. 작품 등록창 닫기
// ============================================================

function closeWorkModal() {

    const modal =
        document.getElementById(
            "workModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// ============================================================
// 22. 작품 저장 처리
// ============================================================

async function handleWorkSubmit(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "로그인이 필요합니다."
        );

        closeWorkModal();

        openAuthPanel();

        return;
    }


    const title =
        document
            .getElementById("workTitle")
            .value
            .trim();


    const productionDate =
        document
            .getElementById("workDate")
            .value;


    const type =
        document
            .getElementById("workType")
            .value;


    const clay =
        document
            .getElementById("workClay")
            .value
            .trim();


    const technique =
        document
            .getElementById("workTechnique")
            .value
            .trim();


    const description =
        document
            .getElementById("workDescription")
            .value
            .trim();


    if (!title) {

        showToast(
            "작품명을 입력하세요."
        );

        return;
    }


    const saveButton =
        document.getElementById(
            "workSaveButton"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "저장 중...";

    }


    try {

        const worksCollection =
            collection(
                db,
                "users",
                currentUser.uid,
                "works"
            );


        const workData = {

            title:
                title,

            productionDate:
                productionDate || "",

            type:
                type || "",

            clay:
                clay || "",

            technique:
                technique || "",

            description:
                description || "",

            userId:
                currentUser.uid,

            userEmail:
                currentUser.email || "",

            createdAt:
                serverTimestamp()

        };


        const documentReference =
            await addDoc(
                worksCollection,
                workData
            );


        console.log(
            "작품 저장 완료:",
            documentReference.id
        );


        showToast(
            "작품이 저장되었습니다."
        );


        closeWorkModal();


        document
            .getElementById(
                "workForm"
            )
            .reset();


        await loadWorks();


        openWorksModal();


    } catch (error) {

        console.error(
            "작품 저장 오류:",
            error
        );


        showToast(
            "작품 저장에 실패했습니다."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "작품 저장하기";

        }

    }

}


// ============================================================
// 23. 작품 목록 데이터 불러오기
// ============================================================

async function loadWorks() {

    if (!currentUser) {

        works = [];

        updateWorkCount();

        return [];

    }


    try {

        const worksCollection =
            collection(
                db,
                "users",
                currentUser.uid,
                "works"
            );


        const worksQuery =
            query(
                worksCollection,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                worksQuery
            );


        works =
            snapshot.docs.map(
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        console.log(
            "작품 불러오기:",
            works
        );


        updateWorkCount();


        return works;


    } catch (error) {

        console.error(
            "작품 불러오기 오류:",
            error
        );


        works = [];

        updateWorkCount();


        showToast(
            "작품 목록을 불러오지 못했습니다."
        );


        return [];

    }

}


// ============================================================
// 24. 작품 개수 표시
// ============================================================

function updateWorkCount() {

    const statusCards =
        document.querySelectorAll(
            ".status-card"
        );


    if (
        statusCards.length > 0
    ) {

        const numberElement =
            statusCards[0]
                .querySelector(
                    ".status-number"
                );


        if (numberElement) {

            numberElement.textContent =
                works.length;

        }

    }

}


// ============================================================
// 25. 작품 목록 화면 생성
// ============================================================

function createWorksModal() {

    if (
        document.getElementById(
            "worksModal"
        )
    ) {

        return;
    }


    createWorkStyle();


    const modal =
        document.createElement("div");

    modal.id =
        "worksModal";


    modal.innerHTML = `

        <div class="works-overlay">

            <div class="works-box">

                <div class="works-header">

                    <h2>
                        🏺 나의 작품
                    </h2>

                    <button
                        type="button"
                        id="worksCloseButton"
                        class="works-close"
                    >
                        ×
                    </button>

                </div>


                <div
                    id="worksList"
                ></div>


                <button
                    type="button"
                    id="worksAddButton"
                    class="works-add-button"
                >
                    ＋ 새 작품 등록
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    document
        .getElementById(
            "worksCloseButton"
        )
        .addEventListener(
            "click",
            closeWorksModal
        );


    document
        .getElementById(
            "worksAddButton"
        )
        .addEventListener(
            "click",
            () => {

                closeWorksModal();

                openWorkModal();

            }
        );

}


// ============================================================
// 26. 작품 목록 화면 열기
// ============================================================

async function openWorksModal() {

    if (!currentUser) {

        showToast(
            "작품을 보려면 로그인하세요."
        );

        openAuthPanel();

        return;
    }


    createWorksModal();


    await loadWorks();


    renderWorks();


    const modal =
        document.getElementById(
            "worksModal"
        );


    modal.style.display =
        "block";

}


// ============================================================
// 27. 작품 목록 화면 닫기
// ============================================================

function closeWorksModal() {

    const modal =
        document.getElementById(
            "worksModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// ============================================================
// 28. 작품 목록 화면 렌더링
// ============================================================

function renderWorks() {

    const list =
        document.getElementById(
            "worksList"
        );


    if (!list) {

        return;
    }


    if (
        works.length === 0
    ) {

        list.innerHTML = `

            <div class="works-empty">

                <div
                    style="font-size:42px; margin-bottom:12px;"
                >
                    🏺
                </div>

                <div>
                    아직 등록된 작품이 없습니다.
                </div>

                <div
                    style="font-size:13px; margin-top:8px;"
                >
                    첫 번째 도자기 작품을 등록해 보세요.
                </div>

            </div>

        `;

        return;
    }


    list.innerHTML =
        works
            .map(work => {

                const title =
                    escapeHtml(
                        work.title || "이름 없는 작품"
                    );


                const type =
                    escapeHtml(
                        work.type || "미입력"
                    );


                const clay =
                    escapeHtml(
                        work.clay || "미입력"
                    );


                const technique =
                    escapeHtml(
                        work.technique || "미입력"
                    );


                const productionDate =
                    escapeHtml(
                        work.productionDate || "미입력"
                    );


                const description =
                    escapeHtml(
                        work.description || ""
                    );


                return `

                    <div class="work-item">

                        <div class="work-item-title">
                            ${title}
                        </div>


                        <div class="work-item-meta">

                            제작일:
                            ${productionDate}

                            <br>

                            종류:
                            ${type}

                            <br>

                            흙:
                            ${clay}

                            <br>

                            기법:
                            ${technique}

                        </div>


                        ${
                            description
                                ? `
                                    <div
                                        class="work-item-description"
                                    >
                                        ${description}
                                    </div>
                                `
                                : ""
                        }


                        <button
                            type="button"
                            class="work-delete-button"
                            data-work-id="${work.id}"
                        >
                            작품 삭제
                        </button>

                    </div>

                `;

            })
            .join("");


    list
        .querySelectorAll(
            ".work-delete-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const workId =
                        button.dataset.workId;


                    await deleteWork(
                        workId
                    );

                }
            );

        });

}


// ============================================================
// 29. HTML 안전 처리
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// 30. 작품 삭제
// ============================================================

async function deleteWork(workId) {

    if (!currentUser) {

        return;
    }


    if (!workId) {

        return;
    }


    const confirmed =
        window.confirm(
            "이 작품을 삭제하시겠습니까?"
        );


    if (!confirmed) {

        return;
    }


    try {

        const workReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "works",
                workId
            );


        await deleteDoc(
            workReference
        );


        showToast(
            "작품이 삭제되었습니다."
        );


        await loadWorks();


        renderWorks();


    } catch (error) {

        console.error(
            "작품 삭제 오류:",
            error
        );


        showToast(
            "작품 삭제에 실패했습니다."
        );

    }

}


// ============================================================
// 31. 작품 등록 버튼
// ============================================================

if (addWorkButton) {

    addWorkButton.addEventListener(
        "click",
        () => {

            openWorkModal();

        }
    );

}


// ============================================================
// 32. 메뉴 버튼
// ============================================================

if (menuButton) {

    menuButton.addEventListener(
        "click",
        () => {

            openAuthPanel();

        }
    );

}


// ============================================================
// 33. 기능 카드
// ============================================================

document
    .querySelectorAll(
        ".feature-card"
    )
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const feature =
                    card.dataset.feature;


                switch (feature) {

                    case "works":

                        openWorksModal();

                        break;


                    case "analyze":

                        showToast(
                            "AI 분석 기능은 다음 단계에서 연결합니다."
                        );

                        break;


                    case "dna":

                        showToast(
                            "CLAY DNA 분석 기능은 다음 단계에서 연결합니다."
                        );

                        break;


                    case "build":

                        showToast(
                            "AI BUILD 기능은 다음 단계에서 연결합니다."
                        );

                        break;

                }

            }
        );

    });


// ============================================================
// 34. 하단 네비게이션
// ============================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(item => {

        item.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".nav-item"
                    )
                    .forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );


                item.classList.add(
                    "active"
                );


                const nav =
                    item.dataset.nav;


                switch (nav) {

                    case "home":

                        showToast(
                            "홈"
                        );

                        break;


                    case "works":

                        openWorksModal();

                        break;


                    case "ai":

                        showToast(
                            "AI 기능은 다음 단계에서 연결합니다."
                        );

                        break;


                    case "dna":

                        showToast(
                            "나의 DNA 기능은 다음 단계에서 연결합니다."
                        );

                        break;


                    case "my":

                        openAuthPanel();

                        break;

                }

            }
        );

    });


// ============================================================
// 35. 앱 시작
// ============================================================

createAuthPanel();

createWorkStyle();


console.log(
    "CLAY DNA 앱 초기화 완료"
);
