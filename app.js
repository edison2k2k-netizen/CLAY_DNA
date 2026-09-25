/* =========================================
   CLAY DNA
   Day 1 JavaScript
========================================= */


/* =========================================
   DOM 요소
========================================= */

const addWorkButton =
    document.getElementById("addWorkButton");

const menuButton =
    document.getElementById("menuButton");

const toast =
    document.getElementById("toast");

const featureCards =
    document.querySelectorAll(".feature-card");

const navItems =
    document.querySelectorAll(".nav-item");


/* =========================================
   토스트 메시지
========================================= */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function () {

        toast.classList.remove("show");

    }, 2200);
}


/* =========================================
   작품 등록 버튼
========================================= */

addWorkButton.addEventListener(
    "click",
    function () {

        showToast(
            "작품 등록 기능은 다음 단계에서 만들어집니다."
        );

    }
);


/* =========================================
   메뉴 버튼
========================================= */

menuButton.addEventListener(
    "click",
    function () {

        showToast(
            "메뉴 기능은 준비 중입니다."
        );

    }
);


/* =========================================
   기능 카드
========================================= */

featureCards.forEach(
    function (card) {

        card.addEventListener(
            "click",
            function () {

                const feature =
                    card.dataset.feature;

                const messages = {

                    works:
                        "작품 관리 기능을 준비하고 있습니다.",

                    analyze:
                        "AI 작품 분석 기능을 준비하고 있습니다.",

                    dna:
                        "나의 도자기 DNA 기능을 준비하고 있습니다.",

                    build:
                        "AI BUILD 기능을 준비하고 있습니다."

                };


                showToast(
                    messages[feature] ||
                    "준비 중인 기능입니다."
                );

            }
        );

    }
);


/* =========================================
   하단 네비게이션
========================================= */

navItems.forEach(
    function (item) {

        item.addEventListener(
            "click",
            function () {

                navItems.forEach(
                    function (nav) {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                item.classList.add("active");


                const nav =
                    item.dataset.nav;


                const messages = {

                    home:
                        "홈 화면입니다.",

                    works:
                        "작품 화면은 다음 단계에서 만듭니다.",

                    ai:
                        "AI 화면은 다음 단계에서 만듭니다.",

                    dna:
                        "DNA 화면은 다음 단계에서 만듭니다.",

                    my:
                        "MY 화면은 다음 단계에서 만듭니다."

                };


                showToast(
                    messages[nav] ||
                    "준비 중인 화면입니다."
                );

            }
        );

    }
);


/* =========================================
   앱 시작
========================================= */

console.log(
    "CLAY DNA Day 1 시작"
);

console.log(
    "AI 도자기 창작 파트너"
);