// ============================================================
// CLAY DNA
// Firebase + 기본 앱 기능
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

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


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
// 6. 기본 알림
// ============================================================

function showToast(message) {

    if (!toastElement) {
        console.log(message);
        return;
    }

    toastElement.textContent = message;

    toastElement.classList.add("show");

    setTimeout(() => {

        toastElement.classList.remove("show");

    }, 2500);
}


// ============================================================
// 7. Firebase 연결 확인
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

    if (document.getElementById("authPanel")) {
        return;
    }


    const panel = document.createElement("div");

    panel.id = "authPanel";

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


                <div
                    id="authFormArea"
                >

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


    // --------------------------------------------------------
    // 간단한 인증 화면 스타일
    // --------------------------------------------------------

    const style = document.createElement("style");

    style.id = "clay-auth-style";

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


    // --------------------------------------------------------
    // 버튼 연결
    // --------------------------------------------------------

    document
        .getElementById("authCloseButton")
        .addEventListener("click", closeAuthPanel);


    document
        .getElementById("loginButton")
        .addEventListener("click", loginUser);


    document
        .getElementById("signupButton")
        .addEventListener("click", signupUser);


    document
        .getElementById("logoutButton")
        .addEventListener("click", logoutUser);

}


// ============================================================
// 9. 인증창 열기
// ============================================================

function openAuthPanel() {

    createAuthPanel();

    const panel =
        document.getElementById("authPanel");

    panel.style.display = "block";

    updateAuthUI();

}


// ============================================================
// 10. 인증창 닫기
// ============================================================

function closeAuthPanel() {

    const panel =
        document.getElementById("authPanel");

    if (panel) {
        panel.style.display = "none";
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
        document.getElementById("authMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        "auth-message " + type;

}


// ============================================================
// 12. 회원가입
// ============================================================

async function signupUser() {

    const email =
        document.getElementById("authEmail").value.trim();

    const password =
        document.getElementById("authPassword").value;


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
        document.getElementById("authEmail").value.trim();

    const password =
        document.getElementById("authPassword").value;


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
        document.getElementById("authFormArea");

    const loggedInArea =
        document.getElementById("authLoggedInArea");

    const loggedInEmail =
        document.getElementById("loggedInEmail");


    if (!formArea || !loggedInArea) {
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
    (user) => {

        currentUser = user;

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

        }

    }
);


// ============================================================
// 17. Firebase 오류 메시지 변환
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
// 18. 작품 데이터 저장 준비
// ============================================================

async function saveWork(workData) {

    if (!currentUser) {

        showToast(
            "먼저 로그인해야 합니다."
        );

        openAuthPanel();

        return null;
    }


    try {

        const worksCollection =
            collection(
                db,
                "users",
                currentUser.uid,
                "works"
            );


        const documentData = {

            ...workData,

            userId:
                currentUser.uid,

            createdAt:
                serverTimestamp()

        };


        const documentReference =
            await addDoc(
                worksCollection,
                documentData
            );


        console.log(
            "작품 저장 완료:",
            documentReference.id
        );


        showToast(
            "작품이 저장되었습니다."
        );


        return documentReference.id;


    } catch (error) {

        console.error(
            "작품 저장 오류:",
            error
        );


        showToast(
            "작품 저장에 실패했습니다."
        );


        return null;
    }

}


// ============================================================
// 19. 작품 목록 불러오기 준비
// ============================================================

async function loadWorks() {

    if (!currentUser) {

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


        return [];

    }

}


// ============================================================
// 20. 작품 수 표시
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
// 21. 작품 등록 버튼
// ============================================================

if (addWorkButton) {

    addWorkButton.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                showToast(
                    "작품을 등록하려면 로그인하세요."
                );

                openAuthPanel();

                return;
            }


            showToast(
                "작품 등록 기능을 준비하고 있습니다."
            );

        }
    );

}


// ============================================================
// 22. 메뉴 버튼
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
// 23. 기능 카드
// ============================================================

document
    .querySelectorAll(".feature-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const feature =
                    card.dataset.feature;


                switch (feature) {

                    case "works":

                        showToast(
                            "작품 관리 기능을 준비하고 있습니다."
                        );

                        break;


                    case "analyze":

                        showToast(
                            "AI 분석 기능을 준비하고 있습니다."
                        );

                        break;


                    case "dna":

                        showToast(
                            "나의 DNA 기능을 준비하고 있습니다."
                        );

                        break;


                    case "build":

                        showToast(
                            "AI BUILD 기능을 준비하고 있습니다."
                        );

                        break;

                }

            }
        );

    });


// ============================================================
// 24. 하단 네비게이션
// ============================================================

document
    .querySelectorAll(".nav-item")
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

                        showToast(
                            "작품"
                        );

                        break;


                    case "ai":

                        showToast(
                            "AI"
                        );

                        break;


                    case "dna":

                        showToast(
                            "나의 DNA"
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
// 25. 앱 시작
// ============================================================

createAuthPanel();

console.log(
    "CLAY DNA 앱 초기화 완료"
);
