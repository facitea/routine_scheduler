import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  deleteField,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { reactive } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";

const SITE_ORIGIN = "https://ilhagisiro.co.kr";

const ROUTE_META = {
  home: {
    title: "직장인 도구 모음",
    eyebrow: "Office Toolkit",
    path: "/",
    description: "루틴 스케줄러, 금융 계산기, 급여 계산기, 날짜 계산기, 나이 계산기 등 직장인이 자주 쓰는 실무 도구 모음입니다.",
  },
  routine: {
    title: "루틴 스케줄러",
    eyebrow: "Calendar Workspace",
    path: "/routine",
    description: "반복 일정, 평일·주말 반복, 완료 체크, 날짜 색칠, Google 로그인 동기화를 지원하는 루틴 스케줄러입니다.",
  },
  interest: {
    title: "금융 계산기",
    eyebrow: "Finance Tool",
    path: "/interest",
    description: "대출이자, 예금과 적금, 카드 할부 금액을 월별 표와 함께 계산하는 무료 금융 계산기입니다.",
  },
  salary: {
    title: "급여 계산기",
    eyebrow: "Payroll Tool",
    path: "/salary",
    description: "실수령액, 연차와 근속연수, 퇴직금, 실업급여를 한 번에 계산하는 직장인 급여 계산기입니다.",
  },
  "date-tools": {
    title: "날짜 계산기",
    eyebrow: "Date Tool",
    path: "/date-tools",
    description: "시작일과 종료일을 입력해 일수, 주수, 개월 수, 연월일 차이를 계산하는 날짜 계산기입니다.",
  },
  age: {
    title: "나이 계산기",
    eyebrow: "Age Tool",
    path: "/age",
    description: "출생일과 기준일로 만 나이, 연나이, 경과 기간, 입춘 기준 띠를 계산하는 나이 계산기입니다.",
  },
  pdf: {
    title: "PDF 변환기",
    eyebrow: "Document Tool",
    path: "/pdf",
    description: "브라우저에서 PDF 합치기, 나누기, 용량 줄이기를 처리하는 무료 PDF 변환 도구입니다.",
  },
  image: {
    title: "이미지 도구",
    eyebrow: "Image Tool",
    path: "/image",
    description: "이미지 리사이징, 포맷 변환, 용량 줄이기를 브라우저에서 처리하는 이미지 도구입니다.",
  },
  video: {
    title: "동영상 도구",
    eyebrow: "Video Tool",
    path: "/video",
    description: "MOV, MP4, MKV, AVI, WMV 동영상의 포맷 변환과 용량 줄이기를 브라우저에서 처리합니다.",
  },
  writing: {
    title: "글 교정기",
    eyebrow: "Writing Tool",
    path: "/writing",
    description: "글자수 계산, 공백 제외 글자수, 단어 수, 기본 맞춤법 검사 기능을 제공하는 글 교정기입니다.",
  },
  expense: {
    title: "생활비 계산기",
    eyebrow: "Expense Tool",
    path: "/expense",
    description: "월급에서 카드 지출과 현금 지출을 나누어 생활비와 남는 금액을 계산하는 생활비 계산기입니다.",
  },
  privacy: {
    title: "개인정보처리방침",
    eyebrow: "Privacy",
    path: "/privacy",
    description: "직장인 도구 모음의 개인정보 처리, 로그인, 클라우드 저장, 광고와 쿠키 사용 안내입니다.",
  },
  terms: {
    title: "이용약관",
    eyebrow: "Terms",
    path: "/terms",
    description: "직장인 도구 모음 서비스 이용 조건과 계산 결과 참고 안내입니다.",
  },
  "coming-soon": {
    title: "추가 도구",
    eyebrow: "Toolbox",
    path: "/coming-soon",
    description: "직장인 도구 모음에 추가될 예정인 실무 도구 안내입니다.",
  },
};

const PLACEHOLDERS = {
  "date-tools": {
    title: "날짜 계산기",
    description: "두 날짜 차이, 며칠 뒤/전, 근무일 기준 계산 같은 날짜 도구를 이 카테고리로 분리해서 확장할 예정입니다.",
    tag: "준비 중",
  },
  pdf: {
    title: "PDF 변환기",
    description: "문서 업로드, 변환, 다운로드 흐름을 위한 영역입니다.",
    tag: "준비 중",
  },
  "coming-soon": {
    title: "추가 도구",
    description: "금융 계산기 외에도 직장인 실무 도구들을 차근차근 확장합니다.",
    tag: "준비 중",
  },
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCNBD2pCGoO5QHSJdt2Uvy1x-aP3RQx2yo",
  authDomain: getFirebaseAuthDomain(),
  projectId: "routine-scheduler-bcf6a",
  storageBucket: "routine-scheduler-bcf6a.firebasestorage.app",
  messagingSenderId: "42652881832",
  appId: "1:42652881832:web:2a37b23e103b30d0f3c39d",
  measurementId: "G-8CRZ2ZL48V",
};

function getFirebaseAuthDomain() {
  const customAuthDomains = new Set(["ilhagisiro.co.kr", "www.ilhagisiro.co.kr"]);
  return customAuthDomains.has(window.location.hostname)
    ? window.location.hostname
    : "routine-scheduler-bcf6a.firebaseapp.com";
}

const storageKeys = {
  events: "office-toolbox-events",
  marks: "office-toolbox-date-marks",
  deletedEventIds: "office-toolbox-deleted-event-ids",
  deletedMarkDates: "office-toolbox-deleted-mark-dates",
  expenseSnapshot: "office-toolbox-expense-snapshot",
};

const recurrenceLabels = {
  none: "반복 없음",
  daily: "매일",
  weekdays: "평일만",
  weekends: "주말만",
  saturdays: "토요일만",
  sundays: "일요일만",
  weeklySameWeekday: "매주 해당 요일만",
  monthlyByDay: "매월 같은 날짜",
  monthlyWeek: "매월 기간/주차 반복",
  yearlyByMonthDay: "매년 같은 날짜",
  monthlyNthWeekday: "매월 n번째 요일",
  monthlyFirstWeekday: "매월 첫 평일",
  monthlyLastWeekday: "매월 마지막 평일",
};

const recurrenceGroups = [
  {
    key: "none",
    label: "반복 없음",
    description: "한 번만",
    options: ["none"],
  },
  {
    key: "daily",
    label: "일 반복",
    description: "매일, 평일, 주말",
    options: ["daily", "weekdays", "weekends"],
  },
  {
    key: "weekly",
    label: "주 반복",
    description: "매주 요일 기준",
    options: ["weeklySameWeekday", "saturdays", "sundays"],
  },
  {
    key: "monthly",
    label: "월 반복",
    description: "날짜, 기간, 요일",
    options: ["monthlyByDay", "monthlyNthWeekday", "monthlyFirstWeekday", "monthlyLastWeekday", "monthlyWeek"],
  },
  {
    key: "yearly",
    label: "년 반복",
    description: "매년 같은 날짜",
    options: ["yearlyByMonthDay"],
  },
];

function normalizeRecurrenceKind(value) {
  const key = String(value || "none");
  return hasOption(recurrenceLabels, key) ? key : "none";
}

function recurrenceCategoryFor(kind) {
  const normalized = normalizeRecurrenceKind(kind);
  return recurrenceGroups.find((group) => group.options.includes(normalized)) || recurrenceGroups[0];
}

function renderRecurrenceCategoryButtons(activeKey) {
  return recurrenceGroups
    .map((group) => {
      const isActive = group.key === activeKey;
      return `
        <button class="recurrence-tab ${isActive ? "is-active" : ""}" type="button" data-recurrence-category="${group.key}" aria-pressed="${isActive}">
          <strong>${escapeHtml(group.label)}</strong>
          <span>${escapeHtml(group.description)}</span>
        </button>
      `;
    })
    .join("");
}

function renderRecurrenceOptionButtons(categoryKey, selectedKind) {
  const group = recurrenceGroups.find((item) => item.key === categoryKey) || recurrenceGroups[0];
  const selected = group.options.includes(selectedKind) ? selectedKind : group.options[0];
  return group.options
    .map((kind) => {
      const isActive = kind === selected;
      return `
        <button class="recurrence-option ${isActive ? "is-active" : ""}" type="button" data-recurrence-option="${kind}" aria-pressed="${isActive}">
          ${escapeHtml(recurrenceLabels[kind] || kind)}
        </button>
      `;
    })
    .join("");
}

const weekOrdinalLabels = {
  auto: "기준일의 주차 자동",
  first: "첫 번째 주",
  second: "두 번째 주",
  third: "세 번째 주",
  fourth: "네 번째 주",
  fifth: "다섯 번째 주",
  last: "마지막 주",
};

const monthlyWeekModeLabels = {
  dateRange: "날짜 기간",
  week: "주차 고급",
};

const weekTargetLabels = {
  allDays: "기간 전체",
  sameWeekday: "기준일과 같은 요일",
  weekdays: "평일 전체",
  weekends: "주말 전체",
  saturdays: "토요일만",
  sundays: "일요일만",
};

const incompleteWeekModeLabels = {
  keep: "그대로 사용",
  previous: "온전하지 않으면 전주",
  next: "온전하지 않으면 다음주",
};

const adjustmentLabels = {
  none: "보정 없음",
  nextBusinessDay: "휴일이면 다음 업무일",
  previousBusinessDay: "휴일이면 이전 업무일",
  nearestBusinessDay: "휴일이면 가까운 업무일",
  skip: "휴일이면 건너뛰기",
  keepAndMark: "휴일 표시만",
};

const dateMarkPalette = [
  { label: "노랑", value: "#fff3b0" },
  { label: "분홍", value: "#ffd6d6" },
  { label: "초록", value: "#d9f7df" },
  { label: "하늘", value: "#dbeafe" },
  { label: "보라", value: "#ece9ff" },
];

const state = reactive({
  route: getInitialRoute(),
  menuOpen: false,
  routineFilter: "all",
  selectedDate: todayIso(),
  visibleMonth: monthStart(todayIso()),
  events: loadJson(storageKeys.events, []),
  dateMarks: loadJson(storageKeys.marks, {}),
  deletedEventIds: loadJson(storageKeys.deletedEventIds, []),
  deletedMarkDates: loadJson(storageKeys.deletedMarkDates, []),
  expenseSnapshot: loadJson(storageKeys.expenseSnapshot, null),
  expenseSaveMessage: "",
  holidays: {},
  fetchedHolidayYears: new Set(),
  firebaseReady: false,
  authReady: false,
  currentUser: null,
  syncMessage: "로컬 브라우저에 저장 중",
  sessionWarning: "",
  modalOpen: false,
});

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let appRoot = null;
let initialized = false;

export const navItems = [
  { route: "home", icon: "홈", title: "메인", desc: "대시보드와 빠른 실행" },
  { route: "routine", icon: "루틴", title: "루틴 스케줄러", desc: "반복 일정과 체크 관리" },
  { route: "interest", icon: "금융", title: "금융 계산기", desc: "대출, 예적금, 급여 계산 도구" },
  { route: "salary", icon: "급여", title: "급여 계산기", desc: "실수령액, 연차, 퇴직금" },
  { route: "date-tools", icon: "날짜", title: "날짜 계산기", desc: "날짜 차이, 기간 계산 도구" },
  { route: "age", icon: "나이", title: "나이 계산기", desc: "만 나이, 연나이, 띠 계산" },
  { route: "pdf", icon: "PDF", title: "PDF 변환기", desc: "문서 작업 도구" },
  { route: "image", icon: "IMG", title: "이미지 도구", desc: "리사이징, 변환, 용량 줄이기" },
  { route: "video", icon: "VID", title: "동영상 도구", desc: "포맷 변환, 용량 줄이기" },
  { route: "writing", icon: "글", title: "글 교정기", desc: "글자수, 맞춤법 검사" },
  { route: "expense", icon: "생활", title: "생활비 계산기", desc: "카드/현금 지출 정리" },
  { route: "coming-soon", icon: "추가", title: "추가 도구", desc: "차근차근 확장" },
];

export { ROUTE_META, state };

export async function initCore() {
  if (initialized) {
    return;
  }

  window.addEventListener("hashchange", syncRoute);
  window.addEventListener("popstate", syncRoute);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      state.menuOpen = false;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenuAndModal();
    }
  });

  await initializeFirebaseState();
  initialized = true;
  syncRoute();
}

async function initializeFirebaseState() {
  try {
    await setPersistence(auth, browserLocalPersistence);
    state.firebaseReady = true;
  } catch (error) {
    state.syncMessage = explainError(error, "로그인 저장 상태를 준비하지 못했습니다.");
  }

  onAuthStateChanged(auth, async (user) => {
    const hadUser = Boolean(state.currentUser);
    state.currentUser = user;
    state.authReady = true;

    if (!user) {
      state.sessionWarning = "";
      state.syncMessage = "로컬 브라우저에 저장 중";
      render();
      return;
    }

    state.sessionWarning = "";
    state.syncMessage = "로컬 데이터와 클라우드 데이터를 병합하는 중입니다.";
    render();

    try {
      await mergeLocalWithCloud();
      state.syncMessage = "클라우드 동기화 사용 중";
    } catch (error) {
      state.syncMessage = explainError(error, "클라우드 데이터를 불러오지 못했습니다. 로컬 저장으로 계속 사용합니다.");
    }

    render();
  });
}

function syncRoute() {
  const nextRoute = getInitialRoute();
  state.route = ROUTE_META[nextRoute] ? nextRoute : "home";
  normalizeLegacyHashUrl(state.route);
  render();
}

export function navigate(route) {
  const safeRoute = ROUTE_META[route] ? route : "home";
  state.menuOpen = false;
  const nextPath = ROUTE_META[safeRoute].path || "/";
  if (window.location.pathname !== nextPath || window.location.hash) {
    window.history.pushState({}, "", nextPath);
  }
  state.route = safeRoute;
  render();
}

export function mountRouteRoot(element, route = state.route) {
  appRoot = element;
  state.route = ROUTE_META[route] ? route : "home";
  render();
}

export async function loginWithGoogle() {
  await ensureRoutineLogin();
}

export async function logoutCurrentUser() {
  await signOut(auth);
}

export function openAccount() {
  openAccountModal();
}

function render() {
  if (!appRoot) {
    return;
  }
  updateDocumentMeta(state.route);
  appRoot.dataset.route = state.route;

  if (state.route === "home") {
    renderHome();
    return;
  }
  if (state.route === "routine") {
    renderRoutine();
    return;
  }
  if (state.route === "interest") {
    renderInterest();
    return;
  }
  if (state.route === "salary") {
    renderSalaryTools();
    return;
  }
  if (state.route === "date-tools") {
    renderDateTools();
    return;
  }
  if (state.route === "age") {
    renderAgeTools();
    return;
  }
  if (state.route === "pdf") {
    renderPdfTools();
    return;
  }
  if (state.route === "image") {
    renderImageTools();
    return;
  }
  if (state.route === "video") {
    renderVideoTools();
    return;
  }
  if (state.route === "writing") {
    renderWritingTools();
    return;
  }
  if (state.route === "expense") {
    renderExpenseTools();
    return;
  }
  if (state.route === "privacy") {
    renderPrivacyPolicy();
    return;
  }
  if (state.route === "terms") {
    renderTermsOfService();
    return;
  }
  renderPlaceholder(state.route);
}

export function closeMenuAndModal() {
  state.menuOpen = false;
  closeModal();
}

function getOverlayElement() {
  return document.querySelector(".overlay");
}

function renderHome() {
  const template = cloneTemplate("home-template");
  appRoot.replaceChildren(template);
  bindRouteButtons();
}

function bindRouteButtons(root = appRoot) {
  root.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(button.dataset.go);
    });
  });
}

function renderPrivacyPolicy() {
  appRoot.innerHTML = `
    <div class="page page--legal">
      <section class="panel legal-content">
        <span class="status-badge">Privacy</span>
        <h3>개인정보처리방침</h3>
        <p>직장인 도구 모음은 서비스 제공에 필요한 최소한의 정보만 사용합니다. 로그인하지 않은 도구 데이터는 기본적으로 사용자의 브라우저 로컬 저장소에 저장됩니다.</p>
        <h4>수집 및 이용 항목</h4>
        <p>Google 로그인 사용 시 계정 식별을 위한 이메일, 표시 이름, 프로필 이미지, 사용자 고유 ID가 사용될 수 있습니다. 루틴 스케줄러에서 클라우드 동기화를 사용하는 경우 일정 데이터가 Firebase Firestore에 저장될 수 있습니다.</p>
        <h4>저장 방식</h4>
        <p>루틴 스케줄러 데이터는 로그인 전에는 로컬 브라우저에 저장되고, 로그인 후에는 사용자의 계정 단위로 동기화됩니다. 민감한 개인정보는 일정 제목이나 메모에 직접 입력하지 않는 것을 권장합니다.</p>
        <h4>광고 및 쿠키</h4>
        <p>서비스에는 Google AdSense 광고가 표시될 수 있습니다. Google 및 광고 파트너는 광고 제공, 빈도 제한, 부정 이용 방지, 광고 성과 측정을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다.</p>
        <h4>제3자 제공</h4>
        <p>서비스 운영 목적 외에 개인정보를 제3자에게 판매하거나 임의 제공하지 않습니다. 인증과 데이터 저장에는 Google Firebase 서비스가 사용되며, 광고 제공에는 Google AdSense가 사용될 수 있습니다.</p>
        <h4>문의</h4>
        <p>개인정보 관련 문의는 서비스 운영자에게 연락해 처리할 수 있습니다. 정식 사업자 정보와 문의 채널은 공개 운영 단계에서 최신 정보로 보완됩니다.</p>
        <div class="button-row">
          <button class="button button--line" type="button" data-go="home">메인으로 돌아가기</button>
          <button class="button button--line" type="button" data-go="terms">이용약관 보기</button>
        </div>
      </section>
    </div>
  `;
  bindRouteButtons();
}

function renderTermsOfService() {
  appRoot.innerHTML = `
    <div class="page page--legal">
      <section class="panel legal-content">
        <span class="status-badge">Terms</span>
        <h3>이용약관</h3>
        <p>직장인 도구 모음은 반복 일정 관리, 금융 계산, 문서 및 이미지 처리 등 업무 보조 도구를 제공하는 웹 서비스입니다.</p>
        <h4>서비스 이용</h4>
        <p>사용자는 관련 법령과 공서양속을 준수해 서비스를 이용해야 합니다. 도구별 계산 결과는 참고용이며, 세무, 노무, 금융, 법률 판단의 최종 근거로 사용할 수 없습니다.</p>
        <h4>계산 결과의 책임</h4>
        <p>금융 계산기, 급여 계산기, 날짜 계산기 등에서 제공하는 결과는 입력값과 일반적인 계산식에 따른 참고 자료입니다. 실제 계약, 신고, 지급, 신청에는 각 기관과 전문가의 확인이 필요합니다.</p>
        <h4>계정 및 데이터</h4>
        <p>루틴 스케줄러는 로그인 없이 로컬 저장으로 사용할 수 있으며, Google 로그인 후에는 계정 기반 동기화 기능을 사용할 수 있습니다. 사용자는 본인 계정과 데이터 관리 책임을 가집니다.</p>
        <h4>서비스 변경</h4>
        <p>운영상 필요에 따라 기능, 화면, 저장 방식이 변경될 수 있습니다. 중요한 변경이 있는 경우 서비스 화면을 통해 안내합니다.</p>
        <div class="button-row">
          <button class="button button--line" type="button" data-go="home">메인으로 돌아가기</button>
          <button class="button button--line" type="button" data-go="privacy">개인정보처리방침 보기</button>
        </div>
      </section>
    </div>
  `;
  bindRouteButtons();
}

function renderRoutine() {
  if (!state.authReady) {
    appRoot.innerHTML = renderRoutineLoading();
    return;
  }

  void ensureHolidayYear(new Date(`${state.visibleMonth}-01T00:00:00`).getFullYear());

  const range = getCalendarRange(state.visibleMonth);
  const occurrences = getOccurrencesForRange(range.start, range.end);
  const byDate = groupOccurrencesByDate(occurrences);

  appRoot.innerHTML = `
    <div class="page page--routine">
      <section class="calendar-shell calendar-shell--single">
        <div class="calendar-main panel panel--calendar">
          <div class="calendar-toolbar">
            <div>
              <h3>${formatMonthTitle(state.visibleMonth)}</h3>
              <p class="panel__meta">날짜를 클릭하면 일정 보기, 추가, 수정, 삭제, 색칠을 한 번에 처리합니다.</p>
            </div>
            <div class="calendar-toolbar__right">
              <div class="calendar-status">
                <strong>${state.currentUser ? "클라우드 동기화 사용 중" : "로컬 저장 사용 중"}</strong>
                <span>${
                  state.currentUser
                    ? escapeHtml(state.syncMessage)
                    : "이 브라우저에만 저장됩니다. 다른 브라우저와 이어서 쓰려면 로그인하세요."
                }</span>
              </div>
              <div class="button-row">
                <button class="button button--accent" type="button" data-open-add data-date="${state.selectedDate}">
                  일정 추가
                </button>
              </div>
              <div class="button-row">
                <button class="icon-button" type="button" data-month-nav="-1" aria-label="이전 달">◀</button>
                <button class="button button--line" type="button" data-month-today>오늘</button>
                <button class="icon-button" type="button" data-month-nav="1" aria-label="다음 달">▶</button>
              </div>
            </div>
          </div>
          <div class="calendar-weekdays">
            ${["일", "월", "화", "수", "목", "금", "토"]
              .map((label, index) => `<div class="calendar-weekday ${index === 0 ? "is-sunday" : ""} ${index === 6 ? "is-saturday" : ""}">${label}</div>`)
              .join("")}
          </div>
          <div class="calendar-grid">
            ${buildCalendarCells(range, byDate).join("")}
          </div>
        </div>
      </section>
    </div>
  `;

  bindRoutineEvents();
}

function renderRoutineLoading() {
  return `
    <div class="page">
      <section class="panel">
        <h3>로그인 상태 확인 중</h3>
        <p class="panel__meta">동기화 연결을 준비하고 있습니다.</p>
      </section>
    </div>
  `;
}

function renderInterest() {
  const template = cloneTemplate("interest-template");
  appRoot.replaceChildren(template);
  const form = appRoot.querySelector("[data-interest-form]");
  const result = appRoot.querySelector("[data-interest-result]");
  const table = appRoot.querySelector("[data-interest-table]");
  const tabButtons = Array.from(appRoot.querySelectorAll("[data-interest-tab]"));
  let activeTab = "loan";
  const modeLabel = form.querySelector('label[for="mode"]');
  const principalField = form.querySelector("[data-principal-field]");
  const annualRateField = form.querySelector("[data-annual-rate-field]");
  const monthsField = form.querySelector("[data-months-field]");
  const principalLabel = form.querySelector("[data-principal-label]");
  const startFeeField = form.querySelector("[data-start-fee-field]");
  const contributionField = form.querySelector("[data-monthly-contribution-field]");
  const startFeeLabel = form.querySelector("[data-start-fee-label]");
  const contributionLabel = form.querySelector("[data-monthly-contribution-label]");

  const hideField = (field, hidden) => {
    field.hidden = hidden;
    field.style.display = hidden ? "none" : "";
  };

  const setSelectOptions = (select, options, selectedValue) => {
    select.innerHTML = options
      .map(
        (option) =>
          `<option value="${option.value}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>`,
      )
      .join("");
    select.value = selectedValue;
  };

  const applyTabPreset = (preset) => {
    form.elements.calculatorType.value = preset.tab;
    form.elements.principal.value = preset.principal;
    form.elements.annualRate.value = preset.annualRate;
    form.elements.months.value = preset.months;
    principalLabel.textContent = preset.principalLabel;
    modeLabel.textContent = preset.modeLabel;
    setSelectOptions(form.elements.mode, preset.modeOptions, preset.modeValue);
    startFeeLabel.textContent = preset.startFeeLabel;
    contributionLabel.textContent = preset.contributionLabel;
    form.elements.startFee.value = preset.startFee;
    form.elements.monthlyContribution.value = preset.monthlyContribution;
    hideField(principalField, preset.hidePrincipal);
    hideField(annualRateField, preset.hideAnnualRate);
    hideField(monthsField, preset.hideMonths);
    hideField(startFeeField, preset.hideStartFee);
    hideField(contributionField, preset.hideContribution);
  };

  const syncFormForTab = () => {
    if (activeTab === "loan") {
      applyTabPreset({
        tab: "loan",
        principal: "30000000",
        annualRate: "4.8",
        months: "36",
        principalLabel: "원금",
        modeLabel: "상환 방식",
        modeOptions: [
          { value: "equalPayment", label: "원리금균등상환" },
          { value: "equalPrincipal", label: "원금균등상환" },
          { value: "maturity", label: "만기일시상환" },
        ],
        modeValue: "equalPayment",
        startFeeLabel: "수수료/부대비용",
        contributionLabel: "월 납입액",
        startFee: "0",
        monthlyContribution: "500000",
        hidePrincipal: false,
        hideAnnualRate: false,
        hideMonths: false,
        hideStartFee: false,
        hideContribution: true,
      });
    } else if (activeTab === "salary") {
      applyTabPreset({
        tab: "salary",
        principal: "50000000",
        annualRate: "9.4",
        months: "12",
        principalLabel: "세전 연봉",
        modeLabel: "입력 기준",
        modeOptions: [
          { value: "annualSalary", label: "연봉 기준" },
          { value: "monthlySalary", label: "월급 기준" },
        ],
        modeValue: "annualSalary",
        startFeeLabel: "부양가족 수",
        contributionLabel: "비과세/기타 공제",
        startFee: "1",
        monthlyContribution: "0",
        hidePrincipal: false,
        hideAnnualRate: true,
        hideMonths: true,
        hideStartFee: false,
        hideContribution: false,
      });
    } else if (activeTab === "card") {
      applyTabPreset({
        tab: "card",
        principal: "1200000",
        annualRate: "14.5",
        months: "12",
        principalLabel: "결제 금액",
        modeLabel: "할부 방식",
        modeOptions: [
          { value: "cardInstallment", label: "일반 할부" },
          { value: "partialInterestFree", label: "부분무이자" },
        ],
        modeValue: "cardInstallment",
        startFeeLabel: "",
        contributionLabel: "카드사 부담 개월",
        startFee: "0",
        monthlyContribution: "3",
        hidePrincipal: false,
        hideAnnualRate: false,
        hideMonths: false,
        hideStartFee: true,
        hideContribution: true,
      });
    } else {
      applyTabPreset({
        tab: "savings",
        principal: "0",
        annualRate: "3.6",
        months: "24",
        principalLabel: "원금",
        modeLabel: "저축 방식",
        modeOptions: [
          { value: "installmentSaving", label: "적금" },
          { value: "depositSimple", label: "예금(단리)" },
          { value: "depositCompound", label: "예금(복리)" },
        ],
        modeValue: "installmentSaving",
        startFeeLabel: "초기 예치금",
        contributionLabel: "월 저축액",
        startFee: "10000000",
        monthlyContribution: "500000",
        hidePrincipal: false,
        hideAnnualRate: false,
        hideMonths: false,
        hideStartFee: false,
        hideContribution: false,
      });
    }
  };

  const showResult = (summary, rows, kind) => {
    const titleMap = {
      loan: ["월 평균 납입액", "총 이자", "총 납입액"],
      savings: ["예상 만기 금액", "총 이자 수익", "총 납입원금"],
      salary: ["예상 실수령 월급", "공제 총액", "예상 실수령 연봉"],
      card: ["첫 달 예상 납부액", "총 할부 이자", "총 납부액"],
    };
    const [primaryTitle, interestTitle, totalTitle] = titleMap[kind] || titleMap.savings;
    result.innerHTML = `
      <div class="interest-summary-grid">
        <div class="result-card">
          <strong>${primaryTitle}</strong>
          <div class="result-card__value">${formatCurrency(summary.primaryValue)}</div>
          <p>${summary.primaryCaption}</p>
        </div>
        <div class="result-card">
          <strong>${interestTitle}</strong>
          <div class="result-card__value">${formatCurrency(summary.interestTotal)}</div>
          <p>${summary.interestCaption}</p>
        </div>
        <div class="result-card">
          <strong>${totalTitle}</strong>
          <div class="result-card__value">${formatCurrency(summary.totalValue)}</div>
          <p>${summary.totalCaption}</p>
        </div>
      </div>
    `;

    table.innerHTML = renderInterestTable(rows, kind);
  };

  const calculate = () => {
    const data = new FormData(form);
    const payload = {
      calculatorType: String(data.get("calculatorType") || "loan"),
      principal: Number(data.get("principal") || 0),
      annualRate: Number(data.get("annualRate") || 0),
      months: Number(data.get("months") || 0),
      mode: String(data.get("mode") || ""),
      startFee: Number(data.get("startFee") || 0),
      monthlyContribution: Number(data.get("monthlyContribution") || 0),
    };

    if (payload.calculatorType === "loan") {
      const { summary, rows } = calculateLoanSchedule(payload);
      showResult(summary, rows, "loan");
    } else if (payload.calculatorType === "salary") {
      const { summary, rows } = calculateSalarySchedule(payload);
      showResult(summary, rows, "salary");
    } else if (payload.calculatorType === "card") {
      const { summary, rows } = calculateCardSchedule(payload);
      showResult(summary, rows, "card");
    } else {
      const { summary, rows } = calculateSavingsSchedule(payload);
      showResult(summary, rows, "savings");
    }
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.interestTab;
      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      syncFormForTab();
      calculate();
    });
  });

  syncFormForTab();
  calculate();
  form.elements.mode.addEventListener("change", () => {
    if (activeTab === "card") {
      hideField(contributionField, form.elements.mode.value !== "partialInterestFree");
    } else if (activeTab === "loan") {
      hideField(contributionField, true);
    } else {
      hideField(contributionField, false);
    }
    calculate();
  });
  form.addEventListener("input", () => calculate());
  form.addEventListener("change", () => calculate());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
}

function renderPlaceholder(route) {
  const template = cloneTemplate("placeholder-template");
  const meta = PLACEHOLDERS[route] || PLACEHOLDERS["coming-soon"];
  template.querySelector("[data-placeholder-title]").textContent = meta.title;
  template.querySelector("[data-placeholder-copy]").textContent = meta.description;
  template.querySelector("[data-placeholder-tag]").textContent = meta.tag;
  appRoot.replaceChildren(template);
  appRoot.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.go));
  });
}

function renderSalaryTools() {
  const template = cloneTemplate("salary-template");
  appRoot.replaceChildren(template);

  const form = appRoot.querySelector("[data-salary-form]");
  const result = appRoot.querySelector("[data-salary-result]");
  const table = appRoot.querySelector("[data-salary-table]");
  const tabButtons = Array.from(appRoot.querySelectorAll("[data-salary-tab]"));
  let activeTab = "netpay";

  const setOutput = (summary, rows) => {
    result.innerHTML = `
      <div class="interest-summary-grid">
        ${summary
          .map(
            (item) => `
              <div class="result-card">
                <strong>${escapeHtml(item.label)}</strong>
                <div class="result-card__value">${escapeHtml(item.value)}</div>
                <p>${escapeHtml(item.caption || "")}</p>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
    table.innerHTML = renderSimpleRows(rows);
  };

  const setError = (message) => {
    result.innerHTML = `<div class="empty-state"><p>${escapeHtml(message)}</p></div>`;
    table.innerHTML = renderSimpleRows([]);
  };

  const renderForm = () => {
    if (activeTab === "netpay") {
      form.innerHTML = `
        <div class="field">
          <label for="salary-annual">세전 연봉</label>
          <input class="input" id="salary-annual" name="annualSalary" type="number" min="0" value="50000000" />
        </div>
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="salary-dependents">부양가족 수</label>
            <input class="input" id="salary-dependents" name="dependents" type="number" min="1" value="1" />
          </div>
          <div class="field">
            <label for="salary-taxfree">월 비과세액</label>
            <input class="input" id="salary-taxfree" name="taxFreeMonthly" type="number" min="0" value="0" />
            <p class="helper">식대 등 매월 비과세로 처리되는 금액입니다. 회사 지급 항목에 따라 달라질 수 있습니다.</p>
          </div>
        </div>
        <div class="button-row"><button class="button button--accent" type="submit">계산하기</button></div>
      `;
    } else if (activeTab === "leave") {
      form.innerHTML = `
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="leave-start">입사일</label>
            <input class="input" id="leave-start" name="startDate" type="date" value="${addMonths(todayIso(), -14)}" />
          </div>
          <div class="field">
            <label for="leave-base">계산 기준일</label>
            <input class="input" id="leave-base" name="baseDate" type="date" value="${todayIso()}" />
          </div>
        </div>
        <div class="button-row"><button class="button button--accent" type="submit">계산하기</button></div>
      `;
    } else if (activeTab === "severance") {
      form.innerHTML = `
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="severance-start">입사일</label>
            <input class="input" id="severance-start" name="startDate" type="date" value="${addDays(todayIso(), -365)}" />
          </div>
          <div class="field">
            <label for="severance-end">퇴사일</label>
            <input class="input" id="severance-end" name="endDate" type="date" value="${todayIso()}" />
          </div>
        </div>
        <div class="field">
          <label for="severance-wage">퇴직 전 3개월 임금총액</label>
          <input class="input" id="severance-wage" name="threeMonthWage" type="number" min="0" value="9000000" />
        </div>
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="severance-bonus">연간 상여금</label>
            <input class="input" id="severance-bonus" name="annualBonus" type="number" min="0" value="0" />
          </div>
          <div class="field">
            <label for="severance-leave-pay">연차수당</label>
            <input class="input" id="severance-leave-pay" name="leaveAllowance" type="number" min="0" value="0" />
          </div>
        </div>
        <div class="button-row"><button class="button button--accent" type="submit">계산하기</button></div>
      `;
    } else {
      form.innerHTML = `
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="unemployment-birth">생년월일 8자리</label>
            <input class="input" id="unemployment-birth" name="birthDate" inputmode="numeric" maxlength="8" placeholder="예) 19900130" value="19900130" />
          </div>
          <div class="field">
            <label>장애인 여부</label>
            <div class="segmented-control">
              <label>
                <input type="radio" name="disabled" value="yes" />
                <span>예</span>
              </label>
              <label>
                <input type="radio" name="disabled" value="no" checked />
                <span>아니오</span>
              </label>
            </div>
          </div>
        </div>
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="unemployment-start">입사일</label>
            <input class="input" id="unemployment-start" name="employmentStart" type="date" value="${addMonths(todayIso(), -24)}" />
          </div>
          <div class="field">
            <label for="unemployment-end">퇴사일</label>
            <input class="input" id="unemployment-end" name="employmentEnd" type="date" value="${todayIso()}" />
          </div>
        </div>
        <div class="field">
          <label for="unemployment-wage">최종월급 세전</label>
          <input class="input" id="unemployment-wage" name="monthlyWage" type="number" min="0" value="3000000" />
        </div>
        <div class="button-row"><button class="button button--accent" type="submit">계산하기</button></div>
      `;
    }
  };

  const calculate = () => {
    try {
      const data = new FormData(form);
      if (activeTab === "netpay") {
        const computed = calculateNetPay({
          annualSalary: Number(data.get("annualSalary") || 0),
          dependents: Number(data.get("dependents") || 1),
          taxFreeMonthly: Number(data.get("taxFreeMonthly") || 0),
        });
        setOutput(
          [
            { label: "예상 실수령 월급", value: formatCurrency(computed.netMonthly), caption: "월 평균 기준" },
            { label: "월 공제 합계", value: formatCurrency(computed.monthlyDeduction), caption: "4대보험 근로자 부담분과 세금 추정" },
            { label: "예상 실수령 연봉", value: formatCurrency(computed.netAnnual), caption: "월 실수령액 × 12" },
          ],
          computed.rows,
        );
      } else if (activeTab === "leave") {
        const computed = calculateLeaveAndTenure(String(data.get("startDate")), String(data.get("baseDate")));
        setOutput(
          [
            { label: "근속연수", value: computed.tenureLabel, caption: `${computed.serviceDays.toLocaleString("ko-KR")}일 근속` },
            { label: "예상 연차", value: `${computed.leaveDays}일`, caption: computed.leaveCaption },
            { label: "다음 연차 기준", value: computed.nextMilestone, caption: "입사일 기준 다음 산정일" },
          ],
          computed.rows,
        );
      } else if (activeTab === "severance") {
        const computed = calculateSeverancePay({
          startDate: String(data.get("startDate")),
          endDate: String(data.get("endDate")),
          threeMonthWage: Number(data.get("threeMonthWage") || 0),
          annualBonus: Number(data.get("annualBonus") || 0),
          leaveAllowance: Number(data.get("leaveAllowance") || 0),
        });
        setOutput(
          [
            { label: "예상 퇴직금", value: formatCurrency(computed.severancePay), caption: computed.caption },
            { label: "1일 평균임금", value: formatCurrency(computed.averageDailyWage), caption: "퇴직 전 3개월 기준" },
            { label: "계속근로일수", value: `${computed.serviceDays.toLocaleString("ko-KR")}일`, caption: computed.tenureLabel },
          ],
          computed.rows,
        );
      } else {
        const computed = calculateUnemploymentBenefit({
          monthlyWage: Number(data.get("monthlyWage") || 0),
          birthDate: String(data.get("birthDate") || ""),
          employmentStart: String(data.get("employmentStart") || ""),
          employmentEnd: String(data.get("employmentEnd") || ""),
          disabled: String(data.get("disabled")) === "yes",
        });
        setOutput(
          [
            { label: "고용보험 가입기간", value: `${computed.insuredDays.toLocaleString("ko-KR")}일`, caption: computed.eligibilityCaption },
            { label: "1일 실업급여 수급액", value: formatCurrency(computed.dailyBenefit), caption: "평균임금 60%, 상·하한액 반영" },
            { label: "예상 지급일수", value: `${computed.benefitDays}일`, caption: computed.daysCaption },
            { label: "총 예상수급액", value: formatCurrency(computed.totalBenefit), caption: "1일 수급액 × 예상 지급일수" },
          ],
          computed.rows,
        );
      }
    } catch (error) {
      setError(error.message || "계산할 수 없습니다. 입력값을 확인해 주세요.");
    }
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.salaryTab;
      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderForm();
      calculate();
    });
  });

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });

  renderForm();
  calculate();
}
function renderDateTools() {
  const template = cloneTemplate("date-tools-template");
  appRoot.replaceChildren(template);
  const form = appRoot.querySelector("[data-date-form]");
  const result = appRoot.querySelector("[data-date-result]");
  const includeButtons = Array.from(appRoot.querySelectorAll("[data-date-include]"));
  let includeMode = "exclude";
  const today = todayIso();
  form.elements.startDate.value = today;
  form.elements.endDate.value = today;

  const calculate = () => {
    const startDate = form.elements.startDate.value;
    const endDate = form.elements.endDate.value;
    if (!startDate || !endDate) {
      result.innerHTML = `<div class="empty-state"><p>날짜를 모두 입력해 주세요.</p></div>`;
      return;
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const direction = start <= end ? 1 : -1;
    const earlier = direction === 1 ? start : end;
    const later = direction === 1 ? end : start;
    const msDiff = later.getTime() - earlier.getTime();
    const rawDays = Math.floor(msDiff / 86400000);
    const countedDays = includeMode === "include" ? rawDays + 1 : rawDays;
    const weeks = countedDays / 7;
    const ymd = diffYmd(earlier, later);
    const totalMonths = ymd.years * 12 + ymd.months;

    result.innerHTML = `
      <div class="interest-summary-grid">
        <div class="result-card">
          <strong>총 일수</strong>
          <div class="result-card__value">${countedDays.toLocaleString("ko-KR")}일</div>
          <p>${includeMode === "include" ? "첫날 포함 기준" : "첫날 제외 기준"}</p>
        </div>
        <div class="result-card">
          <strong>주수</strong>
          <div class="result-card__value">${weeks.toFixed(2)}주</div>
          <p>총 일수를 7일 기준으로 환산했습니다.</p>
        </div>
        <div class="result-card">
          <strong>연월일 차이</strong>
          <div class="result-card__value">${ymd.years}년 ${ymd.months}개월 ${ymd.days}일</div>
          <p>${formatFullDate(startDate)}부터 ${formatFullDate(endDate)}까지</p>
        </div>
        <div class="result-card">
          <strong>개월 수</strong>
          <div class="result-card__value">${totalMonths.toLocaleString("ko-KR")}개월</div>
          <p>연월 기준 개월 수입니다.</p>
        </div>
      </div>
    `;
  };

  includeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      includeMode = button.dataset.dateInclude;
      includeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      calculate();
    });
  });

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  calculate();
}

function renderAgeTools() {
  const template = cloneTemplate("age-template");
  appRoot.replaceChildren(template);
  const form = appRoot.querySelector("[data-age-form]");
  const result = appRoot.querySelector("[data-age-result]");
  form.elements.baseDate.value = todayIso();

  const calculate = () => {
    const birthDate = form.elements.birthDate.value;
    const baseDate = form.elements.baseDate.value;
    if (!birthDate || !baseDate) {
      result.innerHTML = `<div class="empty-state"><p>출생일과 기준일을 모두 입력해 주세요.</p></div>`;
      return;
    }

    try {
      const age = calculateAge(birthDate, baseDate);
      const zodiac = getZodiacInfo(birthDate);
      result.innerHTML = `
        <div class="interest-summary-grid">
          <div class="result-card">
            <strong>만 나이</strong>
            <div class="result-card__value">${age.fullAge.toLocaleString("ko-KR")}세</div>
            <p>생일 도달 여부를 반영한 기준일 현재 나이입니다.</p>
          </div>
          <div class="result-card">
            <strong>연나이</strong>
            <div class="result-card__value">${age.yearAge.toLocaleString("ko-KR")}세</div>
            <p>기준연도에서 출생연도를 뺀 값입니다.</p>
          </div>
          <div class="result-card">
            <strong>띠</strong>
            <div class="result-card__value">${zodiac.animal}띠</div>
            <p>${zodiac.zodiacYear}년 입춘 기준으로 계산했습니다.</p>
          </div>
          <div class="result-card">
            <strong>경과 기간</strong>
            <div class="result-card__value">${age.elapsed.years}년 ${age.elapsed.months}개월 ${age.elapsed.days}일</div>
            <p>${formatFullDate(birthDate)}부터 ${formatFullDate(baseDate)}까지</p>
          </div>
        </div>
      `;
    } catch (error) {
      result.innerHTML = `<div class="empty-state"><p>${escapeHtml(error.message || "계산할 수 없습니다.")}</p></div>`;
    }
  };

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
  calculate();
}

async function renderPdfTools() {
  const template = cloneTemplate("pdf-template");
  appRoot.replaceChildren(template);
  const formWrap = appRoot.querySelector("[data-pdf-form-wrap]");
  const result = appRoot.querySelector("[data-pdf-result]");
  const tabButtons = Array.from(appRoot.querySelectorAll("[data-pdf-tab]"));
  let activeTab = "merge";
  const { PDFDocument } = await import("https://esm.sh/pdf-lib@1.17.1");

  const setResult = (html) => {
    result.innerHTML = html;
  };

  const downloadBlob = (bytes, filename) => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setResult(`
      <div class="result-card">
        <strong>처리 완료</strong>
        <p>${escapeHtml(filename)} 파일을 내려받을 수 있습니다.</p>
        <div class="button-row">
          <a class="button button--accent" href="${url}" download="${filename}">다운로드</a>
        </div>
      </div>
    `);
  };

  const downloadManyBlobs = (items) => {
    setResult(`
      <div class="result-card">
        <strong>처리 완료</strong>
        <p>${items.length}개 PDF 파일을 만들었습니다.</p>
        <div class="download-list">
          ${items
            .map((item) => {
              const url = URL.createObjectURL(new Blob([item.bytes], { type: "application/pdf" }));
              return `<a class="button button--line" href="${url}" download="${item.filename}">${item.filename}</a>`;
            })
            .join("")}
        </div>
      </div>
    `);
  };

  const renderPdfForm = () => {
    if (activeTab === "merge") {
      formWrap.innerHTML = `
        <div class="field">
          <label for="pdf-merge-files">합칠 PDF 파일들</label>
          <input class="input" id="pdf-merge-files" type="file" accept="application/pdf" multiple />
        </div>
        <div class="button-row">
          <button class="button button--accent" type="button" data-pdf-run>합치기</button>
        </div>
      `;
    } else if (activeTab === "split") {
      formWrap.innerHTML = `
        <div class="field">
          <label for="pdf-split-file">나눌 PDF 파일</label>
          <input class="input" id="pdf-split-file" type="file" accept="application/pdf" />
        </div>
        <div class="field">
          <label for="pdf-split-pages">나눌 페이지 범위</label>
          <input class="input" id="pdf-split-pages" type="text" placeholder="예: 1-3,4-6 또는 1,2,3" />
        </div>
        <div class="inline-note">
          <strong>PDF 나누기 규칙</strong>
          <p class="helper">
            <code>1-3</code>은 1~3페이지를 새 PDF 하나로 만들고, <code>1-3,4-6</code>은 두 개 파일로 나눕니다.
            <code>1,2,3,4,5</code>처럼 쉼표만 쓰면 각 페이지를 따로따로 쪼갭니다.
          </p>
        </div>
        <div class="button-row">
          <button class="button button--accent" type="button" data-pdf-run>나누기</button>
        </div>
      `;
    } else {
      formWrap.innerHTML = `
        <div class="field">
          <label for="pdf-compress-file">용량 줄일 PDF 파일</label>
          <input class="input" id="pdf-compress-file" type="file" accept="application/pdf" />
        </div>
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="pdf-compress-quality">압축 정도</label>
            <select class="select" id="pdf-compress-quality">
              <option value="strong">용량 우선</option>
              <option value="balanced" selected>균형</option>
              <option value="light">화질 우선</option>
            </select>
          </div>
          <div class="field">
            <label for="pdf-compress-scale">페이지 선명도</label>
            <select class="select" id="pdf-compress-scale">
              <option value="1.2" selected>일반</option>
              <option value="1">작게</option>
              <option value="1.6">선명</option>
            </select>
          </div>
        </div>
        <div class="inline-note">
          <strong>압축 방식</strong>
          <p class="helper">페이지를 이미지로 다시 만들어 용량을 줄입니다. 스캔 PDF에는 효과가 크고, 텍스트 선택/검색은 사라질 수 있습니다.</p>
        </div>
        <div class="button-row">
          <button class="button button--accent" type="button" data-pdf-run>용량 줄이기</button>
        </div>
      `;
    }

      formWrap.querySelector("[data-pdf-run]")?.addEventListener("click", runPdfAction);
  };

  const runPdfAction = async () => {
    try {
      setResult(`
        <div class="result-card processing-card">
          <span class="loading-spinner" aria-hidden="true"></span>
          <strong>처리 중</strong>
          <p>브라우저에서 PDF를 처리하고 있습니다. 파일 크기와 페이지 수에 따라 시간이 걸릴 수 있습니다.</p>
        </div>
      `);
      if (activeTab === "merge") {
        const files = Array.from(formWrap.querySelector("#pdf-merge-files").files || []);
        if (!files.length) throw new Error("합칠 PDF 파일을 선택해 주세요.");
        const merged = await PDFDocument.create();
        for (const file of files) {
          const bytes = await file.arrayBuffer();
          const doc = await PDFDocument.load(bytes);
          const copiedPages = await merged.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach((page) => merged.addPage(page));
        }
        const bytes = await merged.save({ useObjectStreams: true });
        downloadBlob(bytes, "merged.pdf");
      } else if (activeTab === "split") {
        const file = formWrap.querySelector("#pdf-split-file").files?.[0];
        const pageSpec = formWrap.querySelector("#pdf-split-pages").value.trim();
        if (!file) throw new Error("나눌 PDF 파일을 선택해 주세요.");
        if (!pageSpec) throw new Error("페이지 범위를 입력해 주세요.");
        const source = await PDFDocument.load(await file.arrayBuffer());
        const groups = parsePageGroups(pageSpec, source.getPageCount());
        const outputs = [];

        for (let index = 0; index < groups.length; index += 1) {
          const group = groups[index];
          const splitDoc = await PDFDocument.create();
          const copiedPages = await splitDoc.copyPages(source, group.pages);
          copiedPages.forEach((page) => splitDoc.addPage(page));
          const bytes = await splitDoc.save({ useObjectStreams: true });
          outputs.push({
            filename: `split-${index + 1}-${group.label}.pdf`,
            bytes,
          });
        }

        downloadManyBlobs(outputs);
      } else {
        const file = formWrap.querySelector("#pdf-compress-file").files?.[0];
        if (!file) throw new Error("용량을 줄일 PDF 파일을 선택해 주세요.");
        const qualityMode = formWrap.querySelector("#pdf-compress-quality")?.value || "balanced";
        const scale = Number(formWrap.querySelector("#pdf-compress-scale")?.value || 1.2);
        const bytes = await compressPdfByRasterizing(file, PDFDocument, { qualityMode, scale });
        const before = file.size;
        const after = bytes.byteLength;
        const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
        const reducedPercent = before > 0 ? Math.round((1 - after / before) * 100) : 0;
        setResult(`
          <div class="result-card">
            <strong>용량 줄이기 완료</strong>
            <p>원본 ${formatFileSize(before)} → 결과 ${formatFileSize(after)}${reducedPercent > 0 ? ` · ${reducedPercent}% 감소` : ""}</p>
            <div class="button-row">
              <a class="button button--accent" href="${url}" download="compressed.pdf">다운로드</a>
            </div>
          </div>
        `);
      }
    } catch (error) {
      setResult(`<div class="empty-state"><p>${escapeHtml(explainError(error, "PDF 처리 중 오류가 발생했습니다."))}</p></div>`);
    }
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.pdfTab;
      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderPdfForm();
      setResult(`<div class="empty-state"><p>파일을 선택한 뒤 ${escapeHtml(button.textContent.trim())}를 실행해 주세요.</p></div>`);
    });
  });

  renderPdfForm();
  setResult(`<div class="empty-state"><p>파일을 선택한 뒤 PDF 작업을 실행해 주세요.</p></div>`);
}

async function compressPdfByRasterizing(file, PDFDocument, { qualityMode = "balanced", scale = 1.2 } = {}) {
  const pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";

  const qualityByMode = {
    strong: 0.52,
    balanced: 0.68,
    light: 0.82,
  };
  const jpegQuality = qualityByMode[qualityMode] || qualityByMode.balanced;
  const renderScale = Math.max(0.8, Math.min(2, Number(scale) || 1.2));
  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: sourceBytes, useWorkerFetch: true });
  const sourcePdf = await loadingTask.promise;
  const compressed = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
    const page = await sourcePdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.ceil(renderViewport.width);
    canvas.height = Math.ceil(renderViewport.height);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: renderViewport,
      background: "white",
    }).promise;

    const jpegBytes = await canvasToJpegBytes(canvas, jpegQuality);
    const image = await compressed.embedJpg(jpegBytes);
    const pdfPage = compressed.addPage([baseViewport.width, baseViewport.height]);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });

    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  await sourcePdf.destroy();
  return compressed.save({ useObjectStreams: true, objectsPerTick: 25 });
}

function canvasToJpegBytes(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("PDF 페이지 이미지를 만들지 못했습니다."));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      quality,
    );
  });
}

function renderImageTools() {
  const template = cloneTemplate("image-template");
  appRoot.replaceChildren(template);

  const form = appRoot.querySelector("[data-image-form]");
  const fileInput = form.elements.imageFile;
  const optionsWrap = appRoot.querySelector("[data-image-options]");
  const result = appRoot.querySelector("[data-image-result]");
  const submitButton = appRoot.querySelector("[data-image-submit]");
  const tabButtons = Array.from(appRoot.querySelectorAll("[data-image-tab]"));
  let activeTab = "resize";
  let sourceImage = null;
  let sourceFile = null;
  let sourceFiles = [];
  let resultUrl = null;

  const setResult = (html) => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }
    result.innerHTML = html;
  };

  const renderOptions = () => {
    if (activeTab === "resize") {
      submitButton.textContent = "리사이징하기";
      optionsWrap.innerHTML = `
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="image-width">변경할 너비(px)</label>
            <input class="input" id="image-width" name="width" type="number" min="1" placeholder="예: 1200" />
          </div>
          <div class="field">
            <label for="image-height">변경할 높이(px)</label>
            <input class="input" id="image-height" name="height" type="number" min="1" placeholder="자동" />
          </div>
        </div>
        <p class="helper">너비나 높이 중 하나를 바꾸면 원본 비율에 맞춰 다른 값이 자동으로 바뀝니다.</p>
      `;
      bindResizeSizeSync();
    } else if (activeTab === "convert") {
      submitButton.textContent = "포맷 변환하기";
      optionsWrap.innerHTML = `
        <div class="field">
          <label for="image-format">변환할 포맷</label>
          <select class="select" id="image-format" name="format">
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>
        <p class="helper">선택한 파일을 한 장씩 변환한 뒤 하나의 ZIP 파일로 묶습니다.</p>
      `;
    } else {
      submitButton.textContent = "용량 줄이기";
      optionsWrap.innerHTML = `
        <div class="field">
          <label for="image-quality">압축 품질</label>
          <input class="input" id="image-quality" name="quality" type="range" min="35" max="95" value="75" data-quality-range />
          <p class="helper" data-quality-label>품질 75%</p>
        </div>
        <div class="inline-note">
          <strong>용량 줄이기 방식</strong>
          <p class="helper">JPEG로 다시 저장하면서 품질을 낮춰 파일 크기를 줄입니다. 사진 파일에 가장 효과적입니다.</p>
        </div>
      `;
      const qualityRange = optionsWrap.querySelector("[data-quality-range]");
      const qualityLabel = optionsWrap.querySelector("[data-quality-label]");
      qualityRange?.addEventListener("input", () => {
        qualityLabel.textContent = `품질 ${qualityRange.value}%`;
      });
    }
  };

  const bindResizeSizeSync = () => {
    const widthInput = form.elements.width;
    const heightInput = form.elements.height;
    let isSyncing = false;

    const updateFromWidth = () => {
      if (!sourceImage || isSyncing) return;
      const width = Number(widthInput.value || 0);
      if (width <= 0) return;
      isSyncing = true;
      heightInput.value = Math.max(1, Math.round((sourceImage.naturalHeight * width) / sourceImage.naturalWidth));
      isSyncing = false;
    };

    const updateFromHeight = () => {
      if (!sourceImage || isSyncing) return;
      const height = Number(heightInput.value || 0);
      if (height <= 0) return;
      isSyncing = true;
      widthInput.value = Math.max(1, Math.round((sourceImage.naturalWidth * height) / sourceImage.naturalHeight));
      isSyncing = false;
    };

    widthInput?.addEventListener("input", updateFromWidth);
    heightInput?.addEventListener("input", updateFromHeight);
  };

  const populateResizeSizeFields = () => {
    if (activeTab !== "resize" || !sourceImage) return;
    const widthInput = form.elements.width;
    const heightInput = form.elements.height;
    if (widthInput && !widthInput.value) widthInput.value = sourceImage.naturalWidth;
    if (heightInput && !heightInput.value) heightInput.value = sourceImage.naturalHeight;
  };

  const showSourcePreview = () => {
    if (!sourceImage || !sourceFile) return;
    setResult(`
      <div class="image-preview">
        <img src="${sourceImage.src}" alt="선택한 이미지 미리보기" />
        <p class="helper">원본 ${sourceImage.naturalWidth.toLocaleString("ko-KR")} x ${sourceImage.naturalHeight.toLocaleString("ko-KR")}px · ${formatFileSize(sourceFile.size)}</p>
      </div>
    `);
  };

  const getTargetSize = (image = sourceImage) => {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const widthInput = form.elements.width;
    const heightInput = form.elements.height;
    const requestedWidth = Number(widthInput?.value || 0);
    const requestedHeight = Number(heightInput?.value || 0);
    let targetWidth = requestedWidth > 0 ? requestedWidth : sourceWidth;
    let targetHeight = requestedHeight > 0 ? requestedHeight : sourceHeight;

    if (activeTab !== "resize") {
      return { width: sourceWidth, height: sourceHeight };
    }

    if (requestedWidth > 0 && requestedHeight <= 0) {
      targetHeight = Math.round((sourceHeight * targetWidth) / sourceWidth);
    } else if (requestedHeight > 0 && requestedWidth <= 0) {
      targetWidth = Math.round((sourceWidth * targetHeight) / sourceHeight);
    }

    return {
      width: Math.max(1, Math.round(targetWidth)),
      height: Math.max(1, Math.round(targetHeight)),
    };
  };

  const processImage = async (file, image) => {
    if (!file || !image) {
      throw new Error("이미지를 선택해 주세요.");
    }

    const format = activeTab === "compress" ? "image/jpeg" : String(form.elements.format?.value || file.type || "image/png");
    const quality = Math.max(0.01, Math.min(1, Number(form.elements.quality?.value || 92) / 100));
    const target = getTargetSize(image);
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d", { alpha: format !== "image/jpeg" });

    if (!context) {
      throw new Error("이미지를 처리할 수 없습니다.");
    }
    if (format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, quality));
    canvas.width = 1;
    canvas.height = 1;
    if (!blob) {
      throw new Error("이 브라우저에서 선택한 작업을 완료할 수 없습니다.");
    }

    return { blob, width: canvas.width, height: canvas.height, format };
  };

  fileInput.addEventListener("change", async () => {
    sourceFiles = Array.from(fileInput.files || []);
    if (sourceFiles.length > 300) {
      fileInput.value = "";
      sourceFiles = [];
      sourceFile = null;
      sourceImage = null;
      setResult(`<div class="empty-state"><p>이미지는 최대 300개까지 선택할 수 있습니다.</p></div>`);
      return;
    }
    sourceFile = sourceFiles[0] || null;
    sourceImage = null;

    if (!sourceFile) {
      setResult(`<div class="empty-state"><p>이미지를 선택해 주세요.</p></div>`);
      return;
    }

    try {
      sourceImage = await loadImageFromFile(sourceFile);
      const widthInput = form.elements.width;
      const heightInput = form.elements.height;
      if (widthInput) widthInput.value = sourceImage.naturalWidth;
      if (heightInput) heightInput.value = sourceImage.naturalHeight;
      showSourcePreview();
      if (sourceFiles.length > 1) {
        result.insertAdjacentHTML("beforeend", `<p class="helper">총 ${sourceFiles.length.toLocaleString("ko-KR")}개 파일이 선택되었습니다. 미리보기는 첫 번째 파일입니다.</p>`);
      }
    } catch (error) {
      setResult(`<div class="empty-state"><p>${escapeHtml(explainError(error, "이미지를 불러오지 못했습니다."))}</p></div>`);
    }
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.imageTab;
      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderOptions();
      populateResizeSizeFields();
      if (sourceImage) showSourcePreview();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      if (!sourceFiles.length) throw new Error("이미지를 선택해 주세요.");
      submitButton.disabled = true;
      const { Zip, ZipPassThrough } = await import("/src/vendor/fflate/index.js");
      const zipChunks = [];
      let finishZip;
      let failZip;
      const zipDone = new Promise((resolve, reject) => {
        finishZip = resolve;
        failZip = reject;
      });
      const zip = new Zip((error, chunk, final) => {
        if (error) {
          failZip(error);
          return;
        }
        zipChunks.push(chunk);
        if (final) finishZip();
      });
      const usedNames = new Set();
      let totalOutputSize = 0;

      for (let index = 0; index < sourceFiles.length; index += 1) {
        const file = sourceFiles[index];
        setResult(`<div class="empty-state"><p>변환 중 ${index + 1} / ${sourceFiles.length}</p><progress max="${sourceFiles.length}" value="${index}"></progress><p class="helper">${escapeHtml(file.name)}</p></div>`);
        const image = index === 0 && sourceImage ? sourceImage : await loadImageFromFile(file);
        const output = await processImage(file, image);
        const extension = imageExtension(output.format);
        const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
        const suffix = activeTab === "resize" ? `${output.width}x${output.height}` : activeTab === "compress" ? "compressed" : "converted";
        const filename = uniqueImageFilename(`${baseName}-${suffix}`, extension, usedNames);
        const zipEntry = new ZipPassThrough(filename);
        zip.add(zipEntry);
        zipEntry.push(new Uint8Array(await output.blob.arrayBuffer()), true);
        totalOutputSize += output.blob.size;
        await yieldToBrowser();
      }

      setResult(`<div class="empty-state"><p>ZIP 파일을 만드는 중입니다.</p><progress></progress></div>`);
      zip.end();
      await zipDone;
      const zipBlob = new Blob(zipChunks, { type: "application/zip" });
      zipChunks.length = 0;
      resultUrl = URL.createObjectURL(zipBlob);
      result.innerHTML = `
        <div class="empty-state">
          <strong>이미지 ${sourceFiles.length.toLocaleString("ko-KR")}개 처리 완료</strong>
          <p class="helper">변환 결과 ${formatFileSize(totalOutputSize)} · ZIP ${formatFileSize(zipBlob.size)}</p>
          <div class="button-row"><a class="button button--accent" href="${resultUrl}" download="converted-images.zip">ZIP 다운로드</a></div>
        </div>
      `;
    } catch (error) {
      setResult(`<div class="empty-state"><p>${escapeHtml(explainError(error, "이미지 처리 중 오류가 발생했습니다."))}</p></div>`);
    } finally {
      submitButton.disabled = false;
    }
  });

  renderOptions();
  populateResizeSizeFields();
  setResult(`<div class="empty-state"><p>이미지를 선택한 뒤 원하는 작업을 실행해 주세요.</p></div>`);
}

function renderVideoTools() {
  const template = cloneTemplate("video-template");
  appRoot.replaceChildren(template);

  const form = appRoot.querySelector("[data-video-form]");
  const fileInput = form.elements.videoFile;
  const optionsWrap = appRoot.querySelector("[data-video-options]");
  const result = appRoot.querySelector("[data-video-result]");
  const submitButton = appRoot.querySelector("[data-video-submit]");
  const tabButtons = Array.from(appRoot.querySelectorAll("[data-video-tab]"));
  let activeTab = "compress";
  let downloadUrl = null;

  const setResult = (html, keepDownload = false) => {
    if (!keepDownload && downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      downloadUrl = null;
    }
    result.innerHTML = html;
  };

  const renderOptions = () => {
    if (activeTab === "compress") {
      submitButton.textContent = "용량 줄이기";
      optionsWrap.innerHTML = `
        <div class="field">
          <label for="video-quality">압축 정도</label>
          <select class="select" id="video-quality" name="quality">
            <option value="strong">용량 우선</option>
            <option value="balanced" selected>균형</option>
            <option value="quality">화질 우선</option>
          </select>
        </div>
        <p class="helper">출력 포맷은 원본과 같게 유지합니다. 브라우저에서 지원하기 어려운 입력은 MP4로 저장합니다.</p>
      `;
    } else {
      submitButton.textContent = "포맷 변환하기";
      optionsWrap.innerHTML = `
        <div class="field">
          <label for="video-format">변환할 포맷</label>
          <select class="select" id="video-format" name="format">
            <option value="mp4">MP4</option>
            <option value="mov">MOV</option>
            <option value="mkv">MKV</option>
            <option value="avi">AVI</option>
            <option value="wmv">WMV</option>
          </select>
        </div>
        <p class="helper">입력 포맷(from)은 자동 감지합니다. 해상도와 프레임레이트를 유지하고 원본 화질을 우선하며, 대용량 파일은 멀티스레드로 처리합니다.</p>
      `;
    }
  };

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) {
      setResult(`<div class="empty-state"><p>동영상 파일을 선택해 주세요.</p></div>`);
      return;
    }
    if (files.length > 20) {
      fileInput.value = "";
      setResult(`<div class="empty-state"><p>동영상은 최대 20개까지 선택할 수 있습니다.</p></div>`);
      return;
    }
    const unsupported = files.find((file) => !VIDEO_FORMATS.includes(videoExtension(file.name)));
    if (unsupported) {
      fileInput.value = "";
      setResult(`<div class="empty-state"><p>${escapeHtml(unsupported.name)}은 지원하지 않는 포맷입니다.</p></div>`);
      return;
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    setResult(`
      <div class="empty-state">
        <strong>동영상 ${files.length.toLocaleString("ko-KR")}개 선택</strong>
        <p class="helper">전체 ${formatFileSize(totalSize)} · 파일을 한 개씩 순서대로 처리합니다.</p>
      </div>
    `);
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.videoTab;
      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderOptions();
      fileInput.dispatchEvent(new Event("change"));
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(fileInput.files || []);
    if (!files.length) {
      setResult(`<div class="empty-state"><p>동영상 파일을 선택해 주세요.</p></div>`);
      return;
    }
    const quality = String(form.elements.quality?.value || "balanced");
    let ffmpeg;

    try {
      submitButton.disabled = true;
      setResult(`<div class="empty-state"><p>동영상 처리 엔진을 준비하는 중입니다.</p><progress></progress><p class="helper">엔진은 이 사이트에 포함되어 있으며 준비가 끝나면 자동으로 처리를 시작합니다.</p></div>`);
      ffmpeg = await createVideoFfmpeg();
      const { fetchFile } = await import("/src/vendor/ffmpeg-util/index.js");
      const { Zip, ZipPassThrough } = await import("/src/vendor/fflate/index.js");
      const zipChunks = [];
      const usedNames = new Set();
      let currentIndex = 0;
      let totalOutputSize = 0;
      let finishZip;
      let failZip;
      const zipDone = new Promise((resolve, reject) => {
        finishZip = resolve;
        failZip = reject;
      });
      const zip = new Zip((error, chunk, final) => {
        if (error) return failZip(error);
        zipChunks.push(chunk);
        if (final) finishZip();
      });
      ffmpeg.on("progress", ({ progress }) => {
        const percent = Math.max(0, Math.min(100, Math.round(Number(progress || 0) * 100)));
        result.innerHTML = `<div class="empty-state"><p>${currentIndex + 1} / ${files.length} 처리 중 · ${percent}%</p><progress max="100" value="${percent}"></progress><p class="helper">${escapeHtml(files[currentIndex]?.name || "")}</p></div>`;
      });

      for (currentIndex = 0; currentIndex < files.length; currentIndex += 1) {
        const file = files[currentIndex];
        const inputExtension = videoExtension(file.name);
        const outputExtension = activeTab === "convert" ? String(form.elements.format?.value || "mp4") : inputExtension;
        const inputName = `input-${currentIndex}.${inputExtension}`;
        const outputName = `output-${currentIndex}.${outputExtension}`;
        await ffmpeg.writeFile(inputName, await fetchFile(file));
        await ffmpeg.exec(buildVideoFfmpegArgs(inputName, outputName, outputExtension, activeTab, quality));
        const data = await ffmpeg.readFile(outputName);
        const suffix = activeTab === "compress" ? "compressed" : "converted";
        const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
        const filename = uniqueImageFilename(`${baseName}-${suffix}`, outputExtension, usedNames);
        const entry = new ZipPassThrough(filename);
        zip.add(entry);
        entry.push(data, true);
        totalOutputSize += data.byteLength;
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
        await yieldToBrowser();
      }

      setResult(`<div class="empty-state"><p>ZIP 파일을 만드는 중입니다.</p><progress></progress></div>`);
      zip.end();
      await zipDone;
      const zipBlob = new Blob(zipChunks, { type: "application/zip" });
      zipChunks.length = 0;
      downloadUrl = URL.createObjectURL(zipBlob);
      result.innerHTML = `
        <div class="empty-state">
          <strong>동영상 ${files.length.toLocaleString("ko-KR")}개 처리 완료</strong>
          <p class="helper">변환 결과 ${formatFileSize(totalOutputSize)} · ZIP ${formatFileSize(zipBlob.size)}</p>
          <div class="button-row"><a class="button button--accent" href="${downloadUrl}" download="converted-videos.zip">ZIP 다운로드</a></div>
        </div>
      `;
    } catch (error) {
      setResult(`<div class="empty-state"><p>${escapeHtml(explainError(error, "동영상 처리 중 오류가 발생했습니다."))}</p></div>`);
    } finally {
      ffmpeg?.terminate();
      submitButton.disabled = false;
    }
  });

  renderOptions();
  setResult(`<div class="empty-state"><p>동영상 파일을 선택한 뒤 원하는 작업을 실행해 주세요.</p></div>`);
}

function renderWritingTools() {
  const template = cloneTemplate("writing-template");
  appRoot.replaceChildren(template);

  const form = appRoot.querySelector("[data-writing-form]");
  const textInput = form.elements.text;
  const result = appRoot.querySelector("[data-writing-result]");
  const resultTitle = appRoot.querySelector("[data-writing-result-title]");
  const helper = appRoot.querySelector("[data-writing-helper]");
  const submitButton = appRoot.querySelector("[data-writing-submit]");
  const clearButton = appRoot.querySelector("[data-writing-clear]");
  const tabButtons = Array.from(appRoot.querySelectorAll("[data-writing-tab]"));
  let activeTab = "count";

  const setText = (title, copy, html) => {
    resultTitle.textContent = title;
    helper.textContent = copy;
    result.innerHTML = html;
  };

  const renderCount = () => {
    const text = textInput.value || "";
    const stats = analyzeWritingText(text);
    setText(
      "글자수 계산 결과",
      "공백 포함/제외 글자수와 원고지 기준을 함께 확인합니다.",
      `
        <div class="interest-summary-grid">
          <div class="result-card">
            <strong>공백 포함</strong>
            <div class="result-card__value">${stats.withSpaces.toLocaleString("ko-KR")}자</div>
            <p>줄바꿈 포함 전체 글자수</p>
          </div>
          <div class="result-card">
            <strong>공백 제외</strong>
            <div class="result-card__value">${stats.withoutSpaces.toLocaleString("ko-KR")}자</div>
            <p>공백과 줄바꿈 제외</p>
          </div>
          <div class="result-card">
            <strong>단어 수</strong>
            <div class="result-card__value">${stats.words.toLocaleString("ko-KR")}개</div>
            <p>띄어쓰기 기준</p>
          </div>
          <div class="result-card">
            <strong>원고지</strong>
            <div class="result-card__value">${stats.manuscriptPages.toLocaleString("ko-KR")}매</div>
            <p>200자 원고지 기준</p>
          </div>
        </div>
        ${renderWritingStats([
          { label: "문장 수", value: `${stats.sentences.toLocaleString("ko-KR")}개` },
          { label: "문단 수", value: `${stats.paragraphs.toLocaleString("ko-KR")}개` },
          { label: "UTF-8 예상 용량", value: formatFileSize(stats.bytes) },
        ])}
      `,
    );
  };

  const renderSpell = () => {
    setText(
      "맞춤법 계산기",
      "정확한 검사 품질을 위해 기능을 개발 중입니다.",
      `
        <div class="empty-state">
          <strong>기능 개발 중입니다.</strong>
          <p>맞춤법 검사는 품질이 낮으면 오히려 사용자를 헷갈리게 만들 수 있어, 신뢰할 수 있는 방식으로 다시 준비하고 있습니다.</p>
        </div>
      `,
    );
  };

  const renderActive = () => {
    resizeWritingTextarea(textInput);
    if (activeTab === "spell") {
      submitButton.textContent = "개발 중";
      renderSpell();
      return;
    }
    submitButton.textContent = "계산하기";
    renderCount();
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.writingTab;
      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderActive();
    });
  });

  form.addEventListener("input", renderActive);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderActive();
  });
  clearButton.addEventListener("click", () => {
    textInput.value = "";
    renderActive();
    textInput.focus();
  });

  textInput.value = "안녕하세요. 글자수와 맞춤법을 확인할 수 있습니다.";
  resizeWritingTextarea(textInput);
  renderActive();
}

function renderExpenseTools() {
  const template = cloneTemplate("expense-template");
  appRoot.replaceChildren(template);

  const form = appRoot.querySelector("[data-expense-form]");
  const rowsWrap = appRoot.querySelector("[data-expense-rows]");
  const result = appRoot.querySelector("[data-expense-result]");
  const resetButton = appRoot.querySelector("[data-expense-reset]");
  const saveButton = appRoot.querySelector("[data-expense-save]");
  const saveStatus = appRoot.querySelector("[data-expense-save-status]");
  const defaultItems = [
    { label: "차할부", amount: 180000, card: true },
    { label: "집세(관리비포함)", amount: 200000, card: false },
    { label: "통신", amount: 60000, card: true },
    { label: "교통비", amount: 0, card: true },
    { label: "유류비", amount: 200000, card: true },
    { label: "주택청약", amount: 20000, card: false },
    { label: "적금", amount: 0, card: false },
    { label: "보험/구독", amount: 60000, card: true },
    { label: "생활비", amount: 600000, card: true },
    { label: "카드할부", amount: 0, card: false },
    { label: "대출", amount: 0, card: false },
    { label: "차보험", amount: 170000, card: true },
    { label: "", amount: 0, card: false, custom: true },
    { label: "", amount: 0, card: false, custom: true },
    { label: "", amount: 0, card: false, custom: true },
  ];
  const savedSnapshot = normalizeExpenseSnapshot(state.expenseSnapshot);
  const expenseItems = savedSnapshot?.items?.length
    ? [
        ...savedSnapshot.items,
        { label: "", amount: 0, card: false, custom: true },
        { label: "", amount: 0, card: false, custom: true },
        { label: "", amount: 0, card: false, custom: true },
      ]
    : defaultItems;
  const savedIncome = savedSnapshot ? savedSnapshot.income : 3000000;

  const renderRows = () => {
    rowsWrap.innerHTML = `
      <div class="expense-row expense-row--head">
        <span>항목</span>
        <span>금액</span>
        <span>카드</span>
      </div>
      ${expenseItems
        .map(
          (item, index) => `
            <div class="expense-row">
              <div class="field">
                <label class="sr-only" for="expense-label-${index}">항목</label>
                <input
                  class="input"
                  id="expense-label-${index}"
                  name="label-${index}"
                  type="text"
                  value="${escapeHtml(item.label)}"
                  ${item.custom ? `placeholder="항목 추가"` : ""}
                />
              </div>
              <div class="field">
                <label class="sr-only" for="expense-amount-${index}">금액</label>
                <input
                  class="input"
                  id="expense-amount-${index}"
                  name="amount-${index}"
                  type="text"
                  inputmode="numeric"
                  data-won-input
                  value="${item.amount ? formatWonInput(item.amount) : ""}"
                  placeholder="0"
                />
              </div>
              <label class="expense-card-check" for="expense-card-${index}">
                <input id="expense-card-${index}" name="card-${index}" type="checkbox" ${item.card ? "checked" : ""} />
                <span>카드</span>
              </label>
            </div>
          `,
        )
        .join("")}
    `;
  };

  const readExpenseItems = () =>
    expenseItems
      .map((_, index) => {
        const label = String(form.elements[`label-${index}`]?.value || "").trim();
        const amount = parseWonInput(form.elements[`amount-${index}`]?.value || 0);
        const isCard = Boolean(form.elements[`card-${index}`]?.checked);
        return {
          label,
          amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
          isCard,
        };
      })
      .filter((item) => item.label || item.amount > 0);

  const calculate = () => {
    const income = parseWonInput(form.elements.income?.value || 0);
    const items = readExpenseItems();
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const cardTotal = items.filter((item) => item.isCard).reduce((sum, item) => sum + item.amount, 0);
    const cashTotal = total - cardTotal;
    const remaining = income - total;

    result.innerHTML = `
      <div class="interest-summary-grid">
        <div class="result-card">
          <strong>총 지출</strong>
          <div class="result-card__value">${formatWon(total)}</div>
          <p>카드와 현금 지출 합계</p>
        </div>
        <div class="result-card">
          <strong>카드 지출</strong>
          <div class="result-card__value">${formatWon(cardTotal)}</div>
          <p>카드 체크된 항목 합계</p>
        </div>
        <div class="result-card">
          <strong>현금 지출</strong>
          <div class="result-card__value">${formatWon(cashTotal)}</div>
          <p>카드 체크 안 된 항목 합계</p>
        </div>
        <div class="result-card ${remaining < 0 ? "result-card--warn" : ""}">
          <strong>남는 금액</strong>
          <div class="result-card__value">${formatWon(remaining)}</div>
          <p>${income > 0 ? "월급 세후 - 총 지출" : "월급 세후를 입력하면 계산됩니다."}</p>
        </div>
      </div>
      ${
        items.length
          ? `<div class="expense-breakdown">
              ${items
                .filter((item) => item.amount > 0)
                .map(
                  (item) => `
                    <div class="expense-breakdown__row">
                      <span>${escapeHtml(item.label || "항목")}</span>
                      <strong>${formatWon(item.amount)}</strong>
                      <em>${item.isCard ? "카드" : "현금"}</em>
                    </div>
                  `,
                )
                .join("")}
            </div>`
          : `<div class="empty-state"><p>금액을 입력하면 항목별 지출이 표시됩니다.</p></div>`
      }
    `;
  };

  renderRows();
  form.elements.income.value = savedIncome ? formatWonInput(savedIncome) : "";
  if (saveButton) saveButton.hidden = !state.currentUser;
  if (saveStatus) {
    saveStatus.textContent = state.currentUser
      ? state.expenseSaveMessage || `${state.syncMessage || "클라우드 동기화 사용 중"} · 저장 버튼을 누르면 현재 생활비가 계정에 저장됩니다.`
      : "로그인하면 저장 버튼이 표시되고 이 브라우저 밖에서도 자동으로 불러옵니다.";
  }
  form.querySelectorAll("[data-won-input], [name='income']").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = formatWonInput(parseWonInput(input.value));
      calculate();
    });
  });
  form.querySelectorAll("[name^='label-']").forEach((input) => {
    input.addEventListener("input", calculate);
  });
  form.addEventListener("change", calculate);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
  saveButton?.addEventListener("click", async () => {
    await saveExpenseSnapshotFromForm(form);
  });
  resetButton.addEventListener("click", () => {
    form.reset();
    form.elements.income.value = formatWonInput(3000000);
    calculate();
  });
  calculate();
}

function bindRoutineEvents() {
  appRoot.querySelectorAll("[data-month-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      state.visibleMonth = shiftMonth(state.visibleMonth, Number(button.dataset.monthNav || 0));
      renderRoutine();
    });
  });

  appRoot.querySelector("[data-month-today]")?.addEventListener("click", () => {
    state.selectedDate = todayIso();
    state.visibleMonth = monthStart(todayIso());
    renderRoutine();
  });

  appRoot.querySelectorAll("[data-day]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDate = button.dataset.day;
      openScheduleModal(state.selectedDate);
    });
  });

  appRoot.querySelector("[data-open-add]")?.addEventListener("click", () => {
    openAddModal(state.selectedDate);
  });

}

function renderTopbarControls() {
  return;
}
async function ensureRoutineLogin() {
  if (state.currentUser) {
    return;
  }
  if (!state.firebaseReady) {
    render();
    return;
  }

  try {
    state.syncMessage = "Google 로그인 창을 여는 중입니다.";
    render();
    await signInWithPopup(auth, provider);
  } catch (error) {
    state.syncMessage = explainError(error, "로그인을 완료하지 못했습니다.");
    render();
  }
}

async function downloadSnapshot(showMessage = false) {
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  if (showMessage) {
    state.syncMessage = "클라우드에서 다시 불러오는 중입니다.";
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};
  const { calendarSnapshot, expenseSnapshot } = await readToolSnapshots(user, userData);
  const snapshot = readCloudCalendar(calendarSnapshot);
  state.expenseSnapshot = normalizeExpenseSnapshot(expenseSnapshot);
  persistExpenseSnapshot();

  state.events = sortEvents(Array.isArray(snapshot.events) ? snapshot.events.map(normalizeEvent) : []);
  state.dateMarks = isObject(snapshot.dateMarks) ? snapshot.dateMarks : {};
  state.deletedEventIds = normalizeStringList(snapshot.deletedEventIds);
  state.deletedMarkDates = normalizeStringList(snapshot.deletedMarkDates);
  persistLocalSnapshot();

  const settings = userData.settings;
  if (settings?.selectedDate && typeof settings.selectedDate === "string") {
    state.selectedDate = settings.selectedDate;
    state.visibleMonth = monthStart(state.selectedDate);
  }
}

async function mergeLocalWithCloud() {
  const localEvents = sortEvents(loadJson(storageKeys.events, []));
  const localMarks = loadJson(storageKeys.marks, {});
  const localDeletedEventIds = normalizeStringList(loadJson(storageKeys.deletedEventIds, []));
  const localDeletedMarkDates = normalizeStringList(loadJson(storageKeys.deletedMarkDates, []));

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};
  const toolSnapshots = await readToolSnapshots(user, userData);
  const cloudSnapshot = readCloudCalendar(toolSnapshots.calendarSnapshot);
  const cloudExpenseSnapshot = normalizeExpenseSnapshot(toolSnapshots.expenseSnapshot);
  state.expenseSnapshot = cloudExpenseSnapshot || normalizeExpenseSnapshot(state.expenseSnapshot);
  persistExpenseSnapshot();
  const cloudEvents = Array.isArray(cloudSnapshot.events)
    ? cloudSnapshot.events.map(normalizeEvent)
    : [];
  const cloudMarks = isObject(cloudSnapshot.dateMarks) ? cloudSnapshot.dateMarks : {};
  const deletedEventIds = mergeStringLists(localDeletedEventIds, cloudSnapshot.deletedEventIds);
  const deletedMarkDates = mergeStringLists(localDeletedMarkDates, cloudSnapshot.deletedMarkDates);

  state.deletedEventIds = deletedEventIds;
  state.deletedMarkDates = deletedMarkDates;
  state.events = mergeEvents(
    filterDeletedEvents(localEvents, deletedEventIds),
    filterDeletedEvents(cloudEvents, deletedEventIds),
  );
  state.dateMarks = mergeDateMarks(localMarks, cloudMarks, deletedMarkDates);
  persistLocalSnapshot();

  const settings = userData.settings;
  if (settings?.selectedDate && typeof settings.selectedDate === "string") {
    state.selectedDate = settings.selectedDate;
    state.visibleMonth = monthStart(state.selectedDate);
  }

  await saveSnapshot();
}

async function saveSnapshot() {
  const user = auth.currentUser;
  if (!user) {
    persistLocalSnapshot();
    state.syncMessage = "로컬 브라우저에 저장 중";
    if (state.route === "routine") renderRoutine();
    return;
  }

  state.syncMessage = "클라우드에 저장 중입니다.";
  renderRoutine();

  const userRef = doc(db, "users", user.uid);
  const calendarRef = toolSnapshotRef(user.uid, "calendar");
  const calendarSnap = await getDoc(calendarRef);
  const cloudSnapshot = readCloudCalendar(calendarSnap.data());
  state.deletedEventIds = mergeStringLists(state.deletedEventIds, cloudSnapshot.deletedEventIds);
  state.deletedMarkDates = mergeStringLists(state.deletedMarkDates, cloudSnapshot.deletedMarkDates);
  state.events = sortEvents(filterDeletedEvents(state.events.map(normalizeEvent), state.deletedEventIds));
  state.dateMarks = mergeDateMarks(state.dateMarks, {}, state.deletedMarkDates);
  persistLocalSnapshot();

  await setDoc(
    calendarRef,
    {
      version: 3,
      events: state.events.map(normalizeEvent),
      dateMarks: state.dateMarks,
      deletedEventIds: normalizeStringList(state.deletedEventIds),
      deletedMarkDates: normalizeStringList(state.deletedMarkDates),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await saveUserMetadata(user, { selectedDate: state.selectedDate });
  state.syncMessage = "클라우드 저장 완료";
}

async function saveExpenseSnapshotFromForm(form) {
  if (!state.currentUser) return;

  const snapshot = normalizeExpenseSnapshot({
    income: parseWonInput(form.elements.income?.value || 0),
    items: Array.from(form.querySelectorAll("[name^='label-']")).map((labelInput) => {
      const index = String(labelInput.name || "").replace("label-", "");
      return {
        label: String(labelInput.value || "").trim(),
        amount: parseWonInput(form.elements[`amount-${index}`]?.value || 0),
        card: Boolean(form.elements[`card-${index}`]?.checked),
      };
    }),
  });

  state.expenseSnapshot = snapshot;
  state.syncMessage = "클라우드에 저장 중입니다.";
  state.expenseSaveMessage = "클라우드에 저장 중입니다.";
  persistExpenseSnapshot();
  renderExpenseTools();

  try {
    const expenseRef = toolSnapshotRef(state.currentUser.uid, "expense");
    await setDoc(
      expenseRef,
      {
        version: 1,
        income: snapshot.income,
        items: snapshot.items,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await saveUserMetadata(state.currentUser);

    state.syncMessage = "클라우드 저장 완료";
    state.expenseSaveMessage = "클라우드 저장 완료";
  } catch (error) {
    state.expenseSaveMessage = explainError(error, "클라우드 저장에 실패했습니다.");
  }
  renderExpenseTools();
}

function toolSnapshotRef(userId, toolId) {
  return doc(db, "users", userId, "toolSnapshots", toolId);
}

async function saveUserMetadata(user, settings = null) {
  const payload = {
    email: user.email || "",
    displayName: user.displayName || "",
    photoUrl: user.photoURL || "",
    lastSeenAt: serverTimestamp(),
    calendarSnapshot: deleteField(),
    expenseSnapshot: deleteField(),
    encryptedCalendar: deleteField(),
    crypto: deleteField(),
  };
  if (settings) {
    payload.settings = settings;
  }
  await setDoc(doc(db, "users", user.uid), payload, { merge: true });
}

async function readToolSnapshots(user, userData = {}) {
  const calendarRef = toolSnapshotRef(user.uid, "calendar");
  const expenseRef = toolSnapshotRef(user.uid, "expense");
  const [calendarSnap, expenseSnap] = await Promise.all([getDoc(calendarRef), getDoc(expenseRef)]);
  const legacyCalendar = isObject(userData.calendarSnapshot) ? userData.calendarSnapshot : null;
  const legacyExpense = isObject(userData.expenseSnapshot) ? userData.expenseSnapshot : null;
  const calendarSnapshot = calendarSnap.exists() ? calendarSnap.data() : legacyCalendar;
  const expenseSnapshot = expenseSnap.exists() ? expenseSnap.data() : legacyExpense;

  if (!calendarSnap.exists() && legacyCalendar) {
    await setDoc(calendarRef, { ...legacyCalendar, version: 3, migratedAt: serverTimestamp() }, { merge: true });
  }
  if (!expenseSnap.exists() && legacyExpense) {
    await setDoc(expenseRef, { ...legacyExpense, version: 1, migratedAt: serverTimestamp() }, { merge: true });
  }
  if (legacyCalendar || legacyExpense || userData.encryptedCalendar || userData.crypto) {
    await saveUserMetadata(user, isObject(userData.settings) ? userData.settings : null);
  }

  return { calendarSnapshot, expenseSnapshot };
}

function persistLocalSnapshot() {
  localStorage.setItem(storageKeys.events, JSON.stringify(state.events));
  localStorage.setItem(storageKeys.marks, JSON.stringify(state.dateMarks));
  localStorage.setItem(storageKeys.deletedEventIds, JSON.stringify(normalizeStringList(state.deletedEventIds)));
  localStorage.setItem(storageKeys.deletedMarkDates, JSON.stringify(normalizeStringList(state.deletedMarkDates)));
}

function persistExpenseSnapshot() {
  if (state.expenseSnapshot) {
    localStorage.setItem(storageKeys.expenseSnapshot, JSON.stringify(state.expenseSnapshot));
  } else {
    localStorage.removeItem(storageKeys.expenseSnapshot);
  }
}

function normalizeExpenseSnapshot(snapshot) {
  if (!isObject(snapshot)) return null;
  const income = Math.max(0, Math.round(Number(snapshot.income || 0)));
  const items = Array.isArray(snapshot.items)
    ? snapshot.items
        .map((item) => ({
          label: String(item?.label || "").trim(),
          amount: Math.max(0, Math.round(Number(item?.amount || 0))),
          card: Boolean(item?.card ?? item?.isCard),
          custom: Boolean(item?.custom),
        }))
        .filter((item) => item.label || item.amount > 0)
    : [];
  return {
    version: 1,
    income,
    items,
  };
}

async function handleScheduleAction(action, id, date) {
  const index = state.events.findIndex((item) => item.id === id);
  if (index < 0) return;

  if (action === "edit") {
    openAddModal(date, state.events[index]);
    return;
  }

  if (action === "delete") {
    state.deletedEventIds = mergeStringLists(state.deletedEventIds, [state.events[index].id]);
    state.events.splice(index, 1);
  }

  if (action === "toggle") {
    const completed = new Set(state.events[index].completedDates || []);
    if (completed.has(date)) {
      completed.delete(date);
    } else {
      completed.add(date);
    }
    state.events[index] = {
      ...state.events[index],
      completedDates: Array.from(completed).sort(),
    };
  }

  state.events = sortEvents(state.events);
  persistLocalSnapshot();
  await saveSnapshot();
  renderRoutine();
  if (hasOpenModal()) {
    openScheduleModal(date);
  }
}

function openScheduleModal(date) {
  closeModal();
  state.selectedDate = date;
  const occurrences = sortOccurrences(groupOccurrencesByDate(getOccurrencesForRange(date, date))[date] || []);
  const markColor = state.dateMarks[date] || "";
  const modal = document.createElement("section");
  modal.className = "modal is-open";
  modal.dataset.modal = "schedule";
  modal.innerHTML = `
    <div class="modal__inner">
      <div class="modal__header">
        <div>
          <div class="date-chip">${formatFullDate(date)}</div>
          <h3>해당 날짜 일정</h3>
        </div>
        <button class="icon-button" type="button" data-close-modal>닫기</button>
      </div>
      <section class="modal-toolbar">
        <div class="modal-toolbar__actions">
          <button class="button button--accent" type="button" data-open-add data-date="${date}">일정 추가</button>
        </div>
        <div class="modal-toolbar__marks">
          <span class="modal-toolbar__label">날짜 색칠</span>
          ${dateMarkPalette
            .map(
              (item) => `
                <button
                  class="swatch ${markColor === item.value ? "is-active" : ""}"
                  type="button"
                  data-mark-color="${item.value}"
                  data-mark-date="${date}"
                  style="--swatch:${item.value}"
                  aria-label="${item.label}"
                ></button>
              `,
            )
            .join("")}
          <button class="button button--line button--small" type="button" data-mark-clear data-mark-date="${date}">지우기</button>
        </div>
      </section>
      ${
        occurrences.length
          ? `<div class="schedule-list">${occurrences.map((occurrence) => renderScheduleItem(occurrence)).join("")}</div>`
          : `<div class="empty-state"><p>이 날짜에는 일정이 없습니다.</p></div>`
      }
    </div>
  `;
  document.body.append(modal);
  state.modalOpen = true;
  getOverlayElement()?.classList.add("is-open");
  modal.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
  modal.querySelector("[data-open-add]")?.addEventListener("click", () => openAddModal(date));
  modal.querySelectorAll("[data-mark-color]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.dateMarks[button.dataset.markDate] = button.dataset.markColor;
      state.deletedMarkDates = normalizeStringList(state.deletedMarkDates).filter(
        (item) => item !== button.dataset.markDate,
      );
      persistLocalSnapshot();
      await saveSnapshot();
      renderRoutine();
      openScheduleModal(date);
    });
  });
  modal.querySelector("[data-mark-clear]")?.addEventListener("click", async () => {
    delete state.dateMarks[date];
    state.deletedMarkDates = mergeStringLists(state.deletedMarkDates, [date]);
    persistLocalSnapshot();
    await saveSnapshot();
    renderRoutine();
    openScheduleModal(date);
  });
  modal.querySelectorAll("[data-schedule-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleScheduleAction(button.dataset.scheduleAction, button.dataset.id, button.dataset.date);
    });
  });
}

function openAddModal(date, eventToEdit = null) {
  closeModal();
  const isEdit = Boolean(eventToEdit);
  const selectedRecurrence = normalizeRecurrenceKind(eventToEdit?.recurrenceKind || "none");
  const selectedRecurrenceCategory = recurrenceCategoryFor(selectedRecurrence).key;
  const selectedMonthlyWeekMode = monthlyWeekModeForEvent(eventToEdit);
  const selectedDateRange = monthlyDateRangeForEvent(eventToEdit, date);
  const selectedWeekTarget =
    eventToEdit?.recurrenceWeekTarget || (selectedMonthlyWeekMode === "dateRange" ? "allDays" : "sameWeekday");
  const modal = document.createElement("section");
  modal.className = "modal is-open";
  modal.dataset.modal = "add";
  modal.innerHTML = `
    <div class="modal__inner">
      <div class="modal__header">
        <div>
          <div class="date-chip">${formatFullDate(date)}</div>
          <h3>${isEdit ? "일정 수정" : "일정 추가"}</h3>
        </div>
        <button class="icon-button" type="button" data-close-modal>닫기</button>
      </div>
      <form class="form-grid" data-add-form>
        <div class="field">
          <label for="event-title">제목</label>
          <input class="input" id="event-title" name="title" type="text" value="${escapeHtml(eventToEdit?.title || "")}" required />
        </div>
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="event-date">기준 날짜</label>
            <input class="input" id="event-date" name="startDate" type="date" value="${eventToEdit?.startDate || date}" required />
          </div>
          <div class="field">
            <label for="event-priority">중요도</label>
            <select class="select" id="event-priority" name="priority">
              <option value="3" ${String(eventToEdit?.priority) === "3" ? "selected" : ""}>높음</option>
              <option value="2" ${!eventToEdit || String(eventToEdit?.priority) === "2" ? "selected" : ""}>보통</option>
              <option value="1" ${String(eventToEdit?.priority) === "1" ? "selected" : ""}>낮음</option>
            </select>
          </div>
        </div>
        <section class="recurrence-picker">
          <input id="event-recurrence" name="recurrenceKind" type="hidden" value="${selectedRecurrence}" />
          <div class="tool-list__header recurrence-picker__head">
            <div>
              <h3>반복</h3>
              <p class="helper">먼저 반복 주기를 고르고 세부 방식을 선택합니다.</p>
            </div>
          </div>
          <div class="recurrence-tabs" data-recurrence-tabs>
            ${renderRecurrenceCategoryButtons(selectedRecurrenceCategory)}
          </div>
          <div class="recurrence-options" data-recurrence-options>
            ${renderRecurrenceOptionButtons(selectedRecurrenceCategory, selectedRecurrence)}
          </div>
        </section>
        <div class="form-grid form-grid--two">
          <div class="field">
            <label for="event-adjustment">휴일 보정</label>
            <select class="select" id="event-adjustment" name="adjustmentMode">
              ${Object.entries(adjustmentLabels)
                .map(([value, label]) => `<option value="${value}" ${(eventToEdit?.adjustmentMode || "none") === value ? "selected" : ""}>${label}</option>`)
                .join("")}
            </select>
          </div>
        </div>
        <section class="inline-note" data-monthly-week-options hidden>
          <strong>매월 기간/주차 반복</strong>
          <p class="helper">자주 쓰는 기간 반복을 먼저 배치했습니다. 기존 월간 주차 반복은 고급 모드에서 그대로 사용할 수 있습니다.</p>
          <div class="monthly-mode-toggle" data-monthly-week-mode>
            ${Object.entries(monthlyWeekModeLabels)
              .map(
                ([value, label]) => `
                  <button class="monthly-mode-toggle__button ${selectedMonthlyWeekMode === value ? "is-active" : ""}" type="button" data-monthly-week-mode-option="${value}" aria-pressed="${selectedMonthlyWeekMode === value}">
                    ${escapeHtml(label)}
                  </button>
                `,
              )
              .join("")}
          </div>
          <input id="event-monthly-week-mode" name="monthlyWeekMode" type="hidden" value="${selectedMonthlyWeekMode}" />
          <section data-monthly-date-range-panel>
            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="event-range-start-day">시작일</label>
                <input class="input" id="event-range-start-day" name="recurrenceRangeStartDay" type="number" min="1" max="31" value="${selectedDateRange.start}" />
              </div>
              <div class="field">
                <label for="event-range-end-day">종료일</label>
                <input class="input" id="event-range-end-day" name="recurrenceRangeEndDay" type="number" min="1" max="31" value="${selectedDateRange.end}" />
              </div>
            </div>
            <p class="helper">예: 10~15일은 매월 10일부터 15일까지 생성합니다. 31일처럼 없는 날짜는 해당 월에서 자동 제외됩니다.</p>
          </section>
          <section data-monthly-week-panel>
          <div class="form-grid form-grid--two">
            <div class="field">
              <label for="event-week-ordinal">주차</label>
              <select class="select" id="event-week-ordinal" name="recurrenceWeekOrdinal">
                ${Object.entries(weekOrdinalLabels)
                  .map(([value, label]) => `<option value="${value}" ${(eventToEdit?.recurrenceWeekOrdinal || "auto") === value ? "selected" : ""}>${label}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label for="event-week-target">대상</label>
              <select class="select" id="event-week-target" name="recurrenceWeekTarget">
                ${Object.entries(weekTargetLabels)
                  .map(([value, label]) => `<option value="${value}" ${selectedWeekTarget === value ? "selected" : ""}>${label}</option>`)
                  .join("")}
              </select>
            </div>
          </div>
          <div class="field" data-incomplete-week-field>
            <label for="event-incomplete-week">불완전 평일 주 처리</label>
            <select class="select" id="event-incomplete-week" name="incompleteWeekMode">
              ${Object.entries(incompleteWeekModeLabels)
                .map(([value, label]) => `<option value="${value}" ${(eventToEdit?.incompleteWeekMode || "keep") === value ? "selected" : ""}>${label}</option>`)
                .join("")}
            </select>
            <p class="helper">평일 전체를 선택했을 때 월~금 5일이 모두 같은 달에 들어오지 않는 주를 처리하는 방식입니다.</p>
          </div>
          </section>
        </section>
        <div class="button-row">
          <button class="button button--accent" type="submit">저장</button>
        </div>
      </form>
    </div>
  `;
  document.body.append(modal);
  state.modalOpen = true;
  getOverlayElement()?.classList.add("is-open");
  modal.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
  const recurrenceInput = modal.querySelector("#event-recurrence");
  const recurrenceTabs = modal.querySelector("[data-recurrence-tabs]");
  const recurrenceOptions = modal.querySelector("[data-recurrence-options]");
  const weekTargetSelect = modal.querySelector("#event-week-target");
  const monthlyWeekOptions = modal.querySelector("[data-monthly-week-options]");
  const monthlyWeekModeInput = modal.querySelector("#event-monthly-week-mode");
  const monthlyDateRangePanel = modal.querySelector("[data-monthly-date-range-panel]");
  const monthlyWeekPanel = modal.querySelector("[data-monthly-week-panel]");
  const incompleteWeekField = modal.querySelector("[data-incomplete-week-field]");
  const syncMonthlyWeekMode = () => {
    const isDateRange = monthlyWeekModeInput?.value !== "week";
    if (monthlyDateRangePanel) monthlyDateRangePanel.hidden = !isDateRange;
    if (monthlyWeekPanel) monthlyWeekPanel.hidden = isDateRange;
    modal.querySelectorAll("[data-monthly-week-mode-option]").forEach((button) => {
      const isActive = button.dataset.monthlyWeekModeOption === (monthlyWeekModeInput?.value || "dateRange");
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };
  const syncMonthlyWeekOptions = () => {
    const isMonthlyWeek = recurrenceInput?.value === "monthlyWeek";
    if (monthlyWeekOptions) monthlyWeekOptions.hidden = !isMonthlyWeek;
    syncMonthlyWeekMode();
    if (incompleteWeekField) {
      incompleteWeekField.hidden =
        !isMonthlyWeek || monthlyWeekModeInput?.value !== "week" || weekTargetSelect?.value !== "weekdays";
    }
  };
  const syncRecurrenceCategoryButtons = (categoryKey) => {
    recurrenceTabs?.querySelectorAll("[data-recurrence-category]").forEach((button) => {
      const isActive = button.dataset.recurrenceCategory === categoryKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };
  const syncRecurrenceOptionButtons = () => {
    const selectedKind = normalizeRecurrenceKind(recurrenceInput?.value || "none");
    recurrenceOptions?.querySelectorAll("[data-recurrence-option]").forEach((button) => {
      const isActive = button.dataset.recurrenceOption === selectedKind;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };
  const bindRecurrenceOptionButtons = () => {
    recurrenceOptions?.querySelectorAll("[data-recurrence-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextKind = normalizeRecurrenceKind(button.dataset.recurrenceOption);
        if (recurrenceInput) recurrenceInput.value = nextKind;
        syncRecurrenceOptionButtons();
        syncMonthlyWeekOptions();
      });
    });
  };
  const showRecurrenceCategory = (categoryKey, preferredKind = recurrenceInput?.value || "none") => {
    const group = recurrenceGroups.find((item) => item.key === categoryKey) || recurrenceGroups[0];
    const nextKind = group.options.includes(preferredKind) ? preferredKind : group.options[0];
    if (recurrenceInput) recurrenceInput.value = nextKind;
    if (recurrenceOptions) recurrenceOptions.innerHTML = renderRecurrenceOptionButtons(group.key, nextKind);
    syncRecurrenceCategoryButtons(group.key);
    bindRecurrenceOptionButtons();
    syncRecurrenceOptionButtons();
    syncMonthlyWeekOptions();
  };
  recurrenceTabs?.querySelectorAll("[data-recurrence-category]").forEach((button) => {
    button.addEventListener("click", () => {
      showRecurrenceCategory(button.dataset.recurrenceCategory, recurrenceInput?.value || "none");
    });
  });
  bindRecurrenceOptionButtons();
  modal.querySelectorAll("[data-monthly-week-mode-option]").forEach((button) => {
    button.addEventListener("click", () => {
      if (monthlyWeekModeInput) monthlyWeekModeInput.value = button.dataset.monthlyWeekModeOption || "dateRange";
      syncMonthlyWeekOptions();
    });
  });
  weekTargetSelect?.addEventListener("change", syncMonthlyWeekOptions);
  syncMonthlyWeekOptions();
  modal.querySelector("[data-add-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const startDate = String(formData.get("startDate") || date);
    if (!title) return;

    const recurrenceKind = String(formData.get("recurrenceKind") || "none");
    const monthlyWeekMode = String(formData.get("monthlyWeekMode") || "dateRange");
    const recurrenceWeekOrdinal =
      recurrenceKind === "monthlyWeek" && monthlyWeekMode !== "week"
        ? encodeMonthlyDateRange(formData.get("recurrenceRangeStartDay"), formData.get("recurrenceRangeEndDay"), startDate)
        : String(formData.get("recurrenceWeekOrdinal") || "auto");

    const nextEvent = {
      id: eventToEdit?.id || crypto.randomUUID(),
      title,
      startDate,
      priority: clampPriority(Number(formData.get("priority") || 2)),
      recurrenceKind,
      recurrenceWeekOrdinal,
      recurrenceWeekTarget: String(formData.get("recurrenceWeekTarget") || "sameWeekday"),
      incompleteWeekMode: String(formData.get("incompleteWeekMode") || "keep"),
      adjustmentMode: String(formData.get("adjustmentMode") || "none"),
      completedDates: eventToEdit?.completedDates || [],
    };
    state.deletedEventIds = normalizeStringList(state.deletedEventIds).filter((id) => id !== nextEvent.id);

    state.events = sortEvents(
      eventToEdit
        ? state.events.map((item) => (item.id === eventToEdit.id ? nextEvent : item))
        : [...state.events, nextEvent],
    );
    state.selectedDate = startDate;
    state.visibleMonth = monthStart(startDate);
    persistLocalSnapshot();
    await saveSnapshot();
    closeModal();
    renderRoutine();
    openScheduleModal(startDate);
  });
}

function openAccountModal() {
  if (!state.currentUser) {
    return;
  }

  closeModal();
  const eventCount = state.events.length;
  const markedCount = Object.keys(state.dateMarks).length;
  const modal = document.createElement("section");
  modal.className = "modal is-open";
  modal.dataset.modal = "account";
  modal.innerHTML = `
    <div class="modal__inner">
      <div class="modal__header">
        <div>
          <div class="date-chip">내 정보</div>
          <h3>${escapeHtml(state.currentUser.displayName || "로그인 사용자")}</h3>
        </div>
        <button class="icon-button" type="button" data-close-modal>닫기</button>
      </div>
      <div class="account-summary">
        <div class="result-card">
          <strong>계정</strong>
          <p>${escapeHtml(state.currentUser.email || "")}</p>
        </div>
        <div class="result-card">
          <strong>저장 현황</strong>
          <p>일정 ${eventCount}개 · 날짜 표시 ${markedCount}개</p>
        </div>
        <div class="result-card">
          <strong>동기화 상태</strong>
          <p>${escapeHtml(state.syncMessage)}</p>
        </div>
      </div>
      <div class="button-row">
        <button class="button button--line" type="button" data-account-refresh>다시 불러오기</button>
        <button class="button button--line" type="button" data-account-sign-out>로그아웃</button>
      </div>
    </div>
  `;

  document.body.append(modal);
  state.modalOpen = true;
  getOverlayElement()?.classList.add("is-open");
  modal.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
  modal.querySelector("[data-account-refresh]")?.addEventListener("click", async () => {
    await downloadSnapshot(true);
    closeModal();
    render();
  });
  modal.querySelector("[data-account-sign-out]")?.addEventListener("click", async () => {
    closeModal();
    await signOut(auth);
  });
}

function closeModal() {
  document.querySelectorAll("[data-modal]").forEach((node) => node.remove());
  state.modalOpen = false;
  if (!state.menuOpen) {
    getOverlayElement()?.classList.remove("is-open");
  }
}

function renderScheduleItem(occurrence) {
  const { event, date, originalDate, wasAdjusted, isCompleted } = occurrence;
  const holiday = state.holidays[date];
  const adjustmentText =
    event.adjustmentMode === "none"
      ? ""
      : ` · ${adjustmentLabels[event.adjustmentMode] || event.adjustmentMode}`;
  const movedText = wasAdjusted ? ` · ${originalDate}에서 보정` : "";
  const holidayText = holiday ? ` · ${holiday.name}` : "";

  return `
    <article class="schedule-item">
      <div class="schedule-item__row">
        <div>
          <h4 class="schedule-item__title ${isCompleted ? "done" : ""}">${escapeHtml(event.title)}</h4>
          <p class="schedule-item__meta">
            <span class="schedule-item__priority">${renderPriority(event.priority)}</span>
            <span>${describeRecurrence(event)}${adjustmentText}${movedText}${holidayText}</span>
          </p>
        </div>
        <div class="row-actions row-actions--compact">
          <button class="icon-button icon-button--symbol" type="button" data-schedule-action="toggle" data-id="${event.id}" data-date="${date}" aria-label="${isCompleted ? "완료 취소" : "완료"}">✓</button>
          <button class="icon-button icon-button--symbol" type="button" data-schedule-action="edit" data-id="${event.id}" data-date="${date}" aria-label="수정">✎</button>
          <button class="icon-button icon-button--symbol icon-button--danger" type="button" data-schedule-action="delete" data-id="${event.id}" data-date="${date}" aria-label="삭제">⌫</button>
        </div>
      </div>
    </article>
  `;
}

function renderPriority(level) {
  return "".padStart(clampPriority(level), "★");
}

function describeRecurrence(event) {
  if (event.recurrenceKind !== "monthlyWeek") {
    return recurrenceLabels[event.recurrenceKind] || event.recurrenceKind;
  }

  const dateRange = parseMonthlyDateRange(event.recurrenceWeekOrdinal);
  if (dateRange) {
    const target = normalizeWeekTarget(event.recurrenceWeekTarget);
    const targetText = target === "allDays" ? "" : ` · ${weekTargetLabels[target]}`;
    return `${recurrenceLabels.monthlyWeek} · 매월 ${dateRange.start}~${dateRange.end}일${targetText}`;
  }

  const ordinal = normalizeWeekOrdinal(event.recurrenceWeekOrdinal, event.startDate);
  const target = normalizeWeekTarget(event.recurrenceWeekTarget);
  const mode = normalizeIncompleteWeekMode(event.incompleteWeekMode);
  const modeText = target === "weekdays" && mode !== "keep" ? ` · ${incompleteWeekModeLabels[mode]}` : "";
  return `${recurrenceLabels.monthlyWeek} · ${weekOrdinalLabels[ordinal]} · ${weekTargetLabels[target]}${modeText}`;
}

function renderSyncBanner() {
  if (!state.sessionWarning) return "";
  return `
    <section class="panel sync-warning sync-warning--compact">
      <strong>세션 알림</strong>
      <p class="panel__meta">${escapeHtml(state.sessionWarning)}</p>
      <div class="button-row">
        <button class="button button--accent" type="button" data-login-google>다시 로그인</button>
      </div>
    </section>
  `;
}

function buildCalendarCells(range, occurrencesByDate) {
  const cells = [];
  for (const date of listDates(range.start, range.end)) {
    const inMonth = monthStart(date) === state.visibleMonth;
    const isToday = date === todayIso();
    const isSelected = date === state.selectedDate;
    const holiday = state.holidays[date];
    const markColor = state.dateMarks[date];
    const lines = sortOccurrences(occurrencesByDate[date] || []).slice(0, 5);
    const weekday = weekdayNumber(date);

    cells.push(`
      <button
        class="calendar-cell ${inMonth ? "" : "is-muted"} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${weekday === 0 ? "is-sunday" : ""} ${weekday === 6 ? "is-saturday" : ""}"
        type="button"
        data-day="${date}"
        style="${markColor ? `--mark-color:${markColor};` : ""}"
      >
        <div class="calendar-cell__head">
          <span class="calendar-cell__day">${dayNumber(date)}</span>
          ${holiday ? `<span class="calendar-cell__holiday">${escapeHtml(holiday.name)}</span>` : ""}
        </div>
        <div class="calendar-cell__body">
          ${lines
            .map(
              (occurrence) => `
                <div class="calendar-line ${occurrence.isCompleted ? "done" : ""}" data-priority="${occurrence.event.priority}">
                  <span class="calendar-line__stars">${renderPriority(occurrence.event.priority)}</span>
                  <span class="calendar-line__text">${escapeHtml(occurrence.event.title)}</span>
                </div>
              `,
            )
            .join("")}
          ${
            (occurrencesByDate[date] || []).length > 5
              ? `<div class="calendar-more">+${(occurrencesByDate[date] || []).length - 5}</div>`
              : ""
          }
        </div>
      </button>
    `);
  }
  return cells;
}

function getOccurrencesForRange(from, to) {
  const occurrences = [];
  const fromShifted = addDays(from, -7);
  const toShifted = addDays(to, 7);

  for (const event of state.events) {
    for (const originalDate of generateOriginalDates(event, fromShifted, toShifted)) {
      if (compareDate(originalDate, event.startDate) < 0) continue;
      const adjustedDate = applyAdjustment(originalDate, event.adjustmentMode);
      if (!adjustedDate) continue;
      if (compareDate(adjustedDate, from) < 0 || compareDate(adjustedDate, to) > 0) continue;
      occurrences.push({
        event,
        originalDate,
        date: adjustedDate,
        wasAdjusted: adjustedDate !== originalDate,
        isCompleted: (event.completedDates || []).includes(adjustedDate),
      });
    }
  }

  return sortOccurrences(occurrences);
}

function generateOriginalDates(event, from, to) {
  const results = [];
  const startDate = event.startDate;
  const recurrenceKind = event.recurrenceKind || "none";

  if (recurrenceKind === "none") {
    if (inRange(startDate, from, to)) results.push(startDate);
    return results;
  }

  if (recurrenceKind === "daily") {
    let cursor = compareDate(startDate, from) > 0 ? startDate : from;
    while (compareDate(cursor, to) <= 0) {
      results.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return results;
  }

  if (["weekdays", "weekends", "saturdays", "sundays"].includes(recurrenceKind)) {
    let cursor = compareDate(startDate, from) > 0 ? startDate : from;
    while (compareDate(cursor, to) <= 0) {
      if (matchesDayFilter(cursor, recurrenceKind)) {
        results.push(cursor);
      }
      cursor = addDays(cursor, 1);
    }
    return results;
  }

  if (recurrenceKind === "weeklySameWeekday") {
    const targetWeekday = weekdayNumber(startDate);
    let cursor = compareDate(startDate, from) > 0 ? startDate : from;
    while (weekdayNumber(cursor) !== targetWeekday) {
      cursor = addDays(cursor, 1);
    }
    while (compareDate(cursor, to) <= 0) {
      results.push(cursor);
      cursor = addDays(cursor, 7);
    }
    return results;
  }

  const startMonth = monthStart(from);
  const endMonth = monthStart(to);
  let cursorMonth = startMonth;
  while (compareDate(`${cursorMonth}-01`, `${endMonth}-01`) <= 0) {
    const [year, month] = cursorMonth.split("-").map(Number);
    let candidate = null;
    if (recurrenceKind === "monthlyByDay") {
      candidate = dayExists(year, month, dayNumber(startDate))
        ? isoDate(year, month, dayNumber(startDate))
        : null;
    } else if (recurrenceKind === "yearlyByMonthDay") {
      if (month === monthNumber(startDate) && dayExists(year, month, dayNumber(startDate))) {
        candidate = isoDate(year, month, dayNumber(startDate));
      }
    } else if (recurrenceKind === "monthlyNthWeekday") {
      candidate = nthWeekdayOfMonth(year, month, nthWeekdayInMonth(startDate), weekdayNumber(startDate));
    } else if (recurrenceKind === "monthlyFirstWeekday") {
      candidate = firstBusinessDayOfMonth(year, month);
    } else if (recurrenceKind === "monthlyLastWeekday") {
      candidate = lastBusinessDayOfMonth(year, month);
    } else if (recurrenceKind === "monthlyWeek") {
      for (const monthlyWeekDate of monthlyWeekDatesForMonth(event, year, month)) {
        if (inRange(monthlyWeekDate, from, to) && compareDate(monthlyWeekDate, startDate) >= 0) {
          results.push(monthlyWeekDate);
        }
      }
    }

    if (candidate && inRange(candidate, from, to) && compareDate(candidate, startDate) >= 0) {
      results.push(candidate);
    }
    cursorMonth = shiftMonth(cursorMonth, 1);
  }

  return Array.from(new Set(results)).sort();
}

function applyAdjustment(date, mode) {
  if (mode === "none" || mode === "keepAndMark") {
    return date;
  }

  if (!isNonBusinessDay(date)) {
    return date;
  }

  if (mode === "skip") {
    return null;
  }
  if (mode === "nextBusinessDay") {
    return moveBusinessDay(date, 1);
  }
  if (mode === "previousBusinessDay") {
    return moveBusinessDay(date, -1);
  }
  if (mode === "nearestBusinessDay") {
    for (let delta = 1; delta <= 7; delta += 1) {
      const previous = addDays(date, -delta);
      if (!isNonBusinessDay(previous)) return previous;
      const next = addDays(date, delta);
      if (!isNonBusinessDay(next)) return next;
    }
  }
  return date;
}

function moveBusinessDay(date, direction) {
  let cursor = date;
  do {
    cursor = addDays(cursor, direction);
  } while (isNonBusinessDay(cursor));
  return cursor;
}

function isNonBusinessDay(date) {
  return isWeekend(date) || Boolean(state.holidays[date]);
}

function isWeekend(date) {
  const weekday = new Date(`${date}T00:00:00`).getDay();
  return weekday === 0 || weekday === 6;
}

function matchesDayFilter(date, filter) {
  const weekday = weekdayNumber(date);
  if (filter === "weekdays") return weekday >= 1 && weekday <= 5;
  if (filter === "weekends") return weekday === 0 || weekday === 6;
  if (filter === "saturdays") return weekday === 6;
  if (filter === "sundays") return weekday === 0;
  return false;
}

function monthlyWeekDatesForMonth(event, year, month) {
  const monthIso = isoDate(year, month, 1).slice(0, 7);
  const dateRange = parseMonthlyDateRange(event.recurrenceWeekOrdinal);
  if (dateRange) {
    const lastDay = daysInMonth(year, month);
    if (dateRange.start > lastDay) return [];
    const startDay = dateRange.start;
    const endDay = Math.min(dateRange.end, lastDay);
    const target = normalizeWeekTarget(event.recurrenceWeekTarget);
    const dates = [];
    for (let day = startDay; day <= endDay; day += 1) {
      const candidate = isoDate(year, month, day);
      if (matchesDateRangeTarget(candidate, target, event.startDate)) {
        dates.push(candidate);
      }
    }
    return dates;
  }

  const ordinal = normalizeWeekOrdinal(event.recurrenceWeekOrdinal, event.startDate);
  const target = normalizeWeekTarget(event.recurrenceWeekTarget);
  const mode = normalizeIncompleteWeekMode(event.incompleteWeekMode);
  let weekStart = weekStartForMonthOrdinal(year, month, ordinal);

  if (target === "weekdays" && mode !== "keep" && !hasCompleteWeekdaysInMonth(weekStart, monthIso)) {
    weekStart = findCompleteWeekStartInMonth(weekStart, monthIso, mode === "previous" ? -1 : 1) || weekStart;
  }

  return weekTargetDates(weekStart, target, weekdayNumber(event.startDate)).filter((date) => monthStart(date) === monthIso);
}

function normalizeWeekOrdinal(value, startDate) {
  if (value && value !== "auto" && hasOption(weekOrdinalLabels, value)) {
    return value;
  }
  return inferWeekOrdinalFromDate(startDate);
}

function normalizeWeekTarget(value) {
  return hasOption(weekTargetLabels, value) ? value : "sameWeekday";
}

function monthlyWeekModeForEvent(event) {
  if (!event || event.recurrenceKind !== "monthlyWeek") return "dateRange";
  return parseMonthlyDateRange(event.recurrenceWeekOrdinal) ? "dateRange" : "week";
}

function monthlyDateRangeForEvent(event, fallbackDate) {
  const parsed = parseMonthlyDateRange(event?.recurrenceWeekOrdinal);
  if (parsed) return parsed;
  const day = dayNumber(event?.startDate || fallbackDate || todayIso());
  return { start: day, end: day };
}

function encodeMonthlyDateRange(startValue, endValue, fallbackDate) {
  const fallbackDay = dayNumber(fallbackDate || todayIso());
  const start = clampDayOfMonth(Number(startValue) || fallbackDay);
  const end = clampDayOfMonth(Number(endValue) || start);
  return `dateRange:${Math.min(start, end)}-${Math.max(start, end)}`;
}

function parseMonthlyDateRange(value) {
  const match = String(value || "").match(/^dateRange:(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const start = clampDayOfMonth(Number(match[1]));
  const end = clampDayOfMonth(Number(match[2]));
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function clampDayOfMonth(day) {
  if (!Number.isFinite(day)) return 1;
  return Math.min(31, Math.max(1, Math.trunc(day)));
}

function normalizeIncompleteWeekMode(value) {
  return hasOption(incompleteWeekModeLabels, value) ? value : "keep";
}

function hasOption(options, value) {
  return Object.prototype.hasOwnProperty.call(options, String(value));
}

function inferWeekOrdinalFromDate(date) {
  const weekStart = weekStartForDate(date);
  const nextWeekStart = addDays(weekStart, 7);
  if (!weekHasDateInMonth(nextWeekStart, monthStart(date))) {
    return "last";
  }

  const firstWeekStart = weekStartForDate(`${monthStart(date)}-01`);
  let row = 1;
  let cursor = firstWeekStart;
  while (compareDate(cursor, weekStart) < 0 && row < 5) {
    row += 1;
    cursor = addDays(cursor, 7);
  }
  return ["first", "second", "third", "fourth", "fifth"][row - 1] || "last";
}

function weekStartForMonthOrdinal(year, month, ordinal) {
  if (ordinal === "last") {
    return weekStartForDate(isoDate(year, month, daysInMonth(year, month)));
  }

  const offsetByOrdinal = {
    first: 0,
    second: 1,
    third: 2,
    fourth: 3,
    fifth: 4,
  };
  const firstWeekStart = weekStartForDate(isoDate(year, month, 1));
  return addDays(firstWeekStart, (offsetByOrdinal[ordinal] || 0) * 7);
}

function weekStartForDate(date) {
  return addDays(date, -weekdayNumber(date));
}

function weekHasDateInMonth(weekStart, monthIso) {
  for (let offset = 0; offset <= 6; offset += 1) {
    if (monthStart(addDays(weekStart, offset)) === monthIso) {
      return true;
    }
  }
  return false;
}

function hasCompleteWeekdaysInMonth(weekStart, monthIso) {
  for (let offset = 1; offset <= 5; offset += 1) {
    if (monthStart(addDays(weekStart, offset)) !== monthIso) {
      return false;
    }
  }
  return true;
}

function findCompleteWeekStartInMonth(weekStart, monthIso, direction) {
  let cursor = weekStart;
  for (let steps = 0; steps < 6; steps += 1) {
    cursor = addDays(cursor, direction * 7);
    if (!weekHasDateInMonth(cursor, monthIso)) {
      return null;
    }
    if (hasCompleteWeekdaysInMonth(cursor, monthIso)) {
      return cursor;
    }
  }
  return null;
}

function weekTargetDates(weekStart, target, startWeekday) {
  const offsetsByTarget = {
    allDays: [0, 1, 2, 3, 4, 5, 6],
    sameWeekday: [startWeekday],
    weekdays: [1, 2, 3, 4, 5],
    weekends: [0, 6],
    saturdays: [6],
    sundays: [0],
  };
  return (offsetsByTarget[target] || offsetsByTarget.sameWeekday).map((offset) => addDays(weekStart, offset));
}

function matchesDateRangeTarget(date, target, startDate) {
  if (target === "allDays") return true;
  if (target === "sameWeekday") return weekdayNumber(date) === weekdayNumber(startDate);
  return matchesDayFilter(date, target);
}

function sortEvents(items) {
  return [...items].sort((a, b) => {
    const priorityCompare = clampPriority(b.priority) - clampPriority(a.priority);
    if (priorityCompare !== 0) return priorityCompare;
    return String(a.title).localeCompare(String(b.title), "ko");
  });
}

function sortOccurrences(items) {
  return [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    const priorityCompare = clampPriority(b.event.priority) - clampPriority(a.event.priority);
    if (priorityCompare !== 0) return priorityCompare;
    return a.event.title.localeCompare(b.event.title, "ko");
  });
}

function mergeEvents(localEvents, cloudEvents) {
  const merged = new Map();
  const indexByFingerprint = new Map();

  const register = (event, source) => {
    const normalized = normalizeEvent(event);
    const fingerprint = eventFingerprint(normalized);

    if (merged.has(normalized.id)) {
      merged.set(normalized.id, mergeEventPair(merged.get(normalized.id), normalized, source));
      indexByFingerprint.set(fingerprint, normalized.id);
      return;
    }

    if (indexByFingerprint.has(fingerprint)) {
      const existingId = indexByFingerprint.get(fingerprint);
      merged.set(existingId, mergeEventPair(merged.get(existingId), normalized, source));
      return;
    }

    merged.set(normalized.id, normalized);
    indexByFingerprint.set(fingerprint, normalized.id);
  };

  for (const event of cloudEvents) register(event, "cloud");
  for (const event of localEvents) register(event, "local");

  return sortEvents(Array.from(merged.values()));
}

function mergeEventPair(base, incoming, source) {
  const completedDates = Array.from(
    new Set([...(base.completedDates || []), ...(incoming.completedDates || [])]),
  ).sort();

  return {
    ...base,
    ...incoming,
    id: base.id,
    title: source === "local" && incoming.title ? incoming.title : base.title || incoming.title,
    priority: Math.max(clampPriority(base.priority), clampPriority(incoming.priority)),
    completedDates,
  };
}

function normalizeEvent(event) {
  const recurrenceWeekOrdinal = parseMonthlyDateRange(event.recurrenceWeekOrdinal)
    ? String(event.recurrenceWeekOrdinal)
    : hasOption(weekOrdinalLabels, event.recurrenceWeekOrdinal)
      ? String(event.recurrenceWeekOrdinal)
      : "auto";

  return {
    id: event.id || crypto.randomUUID(),
    title: String(event.title || "").trim(),
    startDate: String(event.startDate || todayIso()),
    priority: clampPriority(event.priority),
    recurrenceKind: String(event.recurrenceKind || "none"),
    recurrenceWeekOrdinal,
    recurrenceWeekTarget: normalizeWeekTarget(event.recurrenceWeekTarget),
    incompleteWeekMode: normalizeIncompleteWeekMode(event.incompleteWeekMode),
    adjustmentMode: String(event.adjustmentMode || "none"),
    completedDates: Array.isArray(event.completedDates)
      ? [...new Set(event.completedDates.filter((value) => typeof value === "string"))].sort()
      : [],
  };
}

function eventFingerprint(event) {
  return [
    event.title.trim().toLowerCase(),
    event.startDate,
    event.priority,
    event.recurrenceKind,
    event.recurrenceWeekOrdinal,
    event.recurrenceWeekTarget,
    event.incompleteWeekMode,
    event.adjustmentMode,
  ].join("|");
}

function filterDeletedEvents(events, deletedIds) {
  const deleted = new Set(normalizeStringList(deletedIds));
  return events.filter((event) => !deleted.has(event.id));
}

function mergeDateMarks(localMarks, cloudMarks, deletedDates = []) {
  const deleted = new Set(normalizeStringList(deletedDates));
  return Object.fromEntries(
    Object.entries({ ...cloudMarks, ...localMarks }).filter(([date]) => !deleted.has(date)),
  );
}

function normalizeStringList(items) {
  return Array.isArray(items)
    ? [...new Set(items.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))].sort()
    : [];
}

function mergeStringLists(...lists) {
  return normalizeStringList(lists.flatMap((list) => normalizeStringList(list)));
}

function readCloudCalendar(snapshot) {
  if (!isObject(snapshot)) {
    return { events: [], dateMarks: {}, deletedEventIds: [], deletedMarkDates: [] };
  }
  return {
    events: Array.isArray(snapshot.events) ? snapshot.events : [],
    dateMarks: isObject(snapshot.dateMarks) ? snapshot.dateMarks : {},
    deletedEventIds: normalizeStringList(snapshot.deletedEventIds),
    deletedMarkDates: normalizeStringList(snapshot.deletedMarkDates),
  };
}

function calculateLoanSchedule({ principal, annualRate, months, mode, startFee }) {
  const monthlyRate = annualRate / 100 / 12;
  const rows = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = startFee;
  let constantPayment = 0;

  if (mode === "equalPayment") {
    constantPayment =
      monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  }

  for (let month = 1; month <= months; month += 1) {
    let payment = 0;
    let principalPaid = 0;
    const interest = balance * monthlyRate;

    if (mode === "equalPrincipal") {
      principalPaid = principal / months;
      payment = principalPaid + interest;
    } else if (mode === "maturity") {
      principalPaid = month === months ? principal : 0;
      payment = interest + principalPaid;
    } else {
      payment = constantPayment;
      principalPaid = payment - interest;
    }

    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    totalPaid += payment;

    rows.push({
      month,
      payment,
      principalPaid,
      interest,
      balance,
    });
  }

  const averagePayment = rows.reduce((sum, row) => sum + row.payment, 0) / Math.max(rows.length, 1);
  return {
    summary: {
      primaryValue: averagePayment,
      primaryCaption: mode === "maturity" ? "만기 전에는 이자만 납입합니다." : "월별 납입 흐름 평균입니다.",
      interestTotal: totalInterest,
      interestCaption: "기간 전체에 걸친 이자 합계입니다.",
      totalValue: totalPaid,
      totalCaption: startFee > 0 ? `부대비용 ${formatCurrency(startFee)} 포함` : "수수료 없이 계산했습니다.",
    },
    rows,
  };
}

function calculateSavingsSchedule({ annualRate, months, mode, startFee, monthlyContribution }) {
  const monthlyRate = annualRate / 100 / 12;
  const rows = [];
  let balance = 0;
  let totalInterest = 0;
  let totalPrincipal = 0;

  if (mode === "depositSimple" || mode === "depositCompound") {
    balance = startFee;
    totalPrincipal = startFee;
  }

  for (let month = 1; month <= months; month += 1) {
    let contribution = 0;
    if (mode === "installmentSaving") {
      contribution = monthlyContribution;
      balance += contribution;
      totalPrincipal += contribution;
    }

    let interest = 0;
    if (mode === "depositSimple") {
      interest = startFee * monthlyRate;
      balance = startFee + interest * month;
    } else if (mode === "depositCompound") {
      interest = balance * monthlyRate;
      balance += interest;
    } else {
      interest = balance * monthlyRate;
      balance += interest;
    }

    totalInterest += interest;

    rows.push({
      month,
      contribution: mode === "installmentSaving" ? contribution : month === 1 ? startFee : 0,
      interest,
      balance,
    });
  }

  return {
    summary: {
      primaryValue: balance,
      primaryCaption: "만기 시점 예상 잔액입니다.",
      interestTotal: totalInterest,
      interestCaption: "세전 기준 예상 이자입니다.",
      totalValue: totalPrincipal,
      totalCaption: mode === "installmentSaving" ? "월별 납입 원금 합계입니다." : "초기 예치 원금입니다.",
    },
    rows,
  };
}

function calculateSalarySchedule({ principal, annualRate, mode, startFee, monthlyContribution }) {
  const baseAnnual = mode === "monthlySalary" ? principal * 12 : principal;
  const pension = baseAnnual * 0.045;
  const health = baseAnnual * 0.03545;
  const care = health * 0.1295;
  const employment = baseAnnual * 0.009;
  const dependents = Math.max(1, Math.floor(startFee || 1));
  const extraDeduction = monthlyContribution * 12;
  const incomeTaxBase = Math.max(0, baseAnnual - pension - health - employment - extraDeduction - dependents * 1500000);
  const incomeTax = incomeTaxBase * (annualRate / 100);
  const localTax = incomeTax * 0.1;
  const netAnnual = baseAnnual - pension - health - care - employment - incomeTax - localTax;
  const netMonthly = netAnnual / 12;

  const rows = [
    { label: "세전 금액", amount: baseAnnual },
    { label: "국민연금", amount: -pension },
    { label: "건강보험", amount: -health },
    { label: "장기요양", amount: -care },
    { label: "고용보험", amount: -employment },
    { label: "소득세(추정)", amount: -incomeTax },
    { label: "지방소득세", amount: -localTax },
    { label: "실수령 연봉", amount: netAnnual },
    { label: "실수령 월급", amount: netMonthly },
  ];

  return {
    summary: {
      primaryValue: netMonthly,
      primaryCaption: "예상 실수령 월급입니다.",
      interestTotal: baseAnnual - netAnnual,
      interestCaption: "공제 총액입니다.",
      totalValue: netAnnual,
      totalCaption: "예상 실수령 연봉입니다.",
    },
    rows,
  };
}

function calculateNetPay({ annualSalary, dependents, taxFreeMonthly }) {
  if (!Number.isFinite(annualSalary) || annualSalary <= 0) {
    throw new Error("세전 연봉을 입력해 주세요.");
  }

  const monthlyGross = annualSalary / 12;
  const monthlyTaxFree = Math.max(0, Math.min(monthlyGross, taxFreeMonthly || 0));
  const monthlyTaxable = Math.max(0, monthlyGross - monthlyTaxFree);
  const familyCount = Math.max(1, Math.floor(dependents || 1));
  const annualTaxableGross = monthlyTaxable * 12;

  const pensionBase = clamp(monthlyTaxable, 400000, 6370000);
  const pension = floorToTen(pensionBase * 0.0475);
  const health = floorToTen(monthlyTaxable * 0.03595);
  const longTermCare = floorToTen(health * 0.1295);
  const employment = floorToTen(monthlyTaxable * 0.009);
  const annualIncomeTax = estimateKoreanEarnedIncomeTax({
    annualTaxableGross,
    annualPension: pension * 12,
    annualHealth: health * 12,
    annualEmployment: employment * 12,
    familyCount,
  });
  const incomeTax = floorToTen(annualIncomeTax / 12);
  const localTax = floorToTen(incomeTax * 0.1);
  const monthlyDeduction = pension + health + longTermCare + employment + incomeTax + localTax;
  const netMonthly = Math.max(0, monthlyGross - monthlyDeduction);
  const netAnnual = netMonthly * 12;

  return {
    netMonthly,
    monthlyDeduction,
    netAnnual,
    rows: [
      { label: "세전 월급", value: formatCurrency(monthlyGross) },
      { label: "월 비과세액", value: formatCurrency(monthlyTaxFree) },
      { label: "월 과세 보수", value: formatCurrency(monthlyTaxable) },
      { label: "국민연금 기준소득월액", value: formatCurrency(pensionBase) },
      { label: "국민연금", value: formatCurrency(pension) },
      { label: "건강보험", value: formatCurrency(health) },
      { label: "장기요양보험", value: formatCurrency(longTermCare) },
      { label: "고용보험", value: formatCurrency(employment) },
      { label: "소득세 추정", value: formatCurrency(incomeTax) },
      { label: "지방소득세 추정", value: formatCurrency(localTax) },
      { label: "월 공제 합계", value: formatCurrency(monthlyDeduction) },
      { label: "예상 실수령 월급", value: formatCurrency(netMonthly) },
      { label: "계산 기준", value: "2026년 4대보험 근로자 부담분, 근로소득세 기본공제 추정" },
    ],
  };
}

function estimateKoreanEarnedIncomeTax({
  annualTaxableGross,
  annualPension,
  annualHealth,
  annualEmployment,
  familyCount,
}) {
  const earnedIncomeAmount = Math.max(0, annualTaxableGross - earnedIncomeDeduction(annualTaxableGross));
  const incomeDeduction = familyCount * 1500000 + annualPension + annualHealth + annualEmployment;
  const taxBase = Math.max(0, earnedIncomeAmount - incomeDeduction);
  const calculatedTax = estimateKoreanIncomeTax(taxBase);
  const earnedTaxCredit = earnedIncomeTaxCredit(calculatedTax, annualTaxableGross);
  const standardTaxCredit = calculatedTax > 0 ? 130000 : 0;
  return Math.max(0, calculatedTax - earnedTaxCredit - standardTaxCredit);
}

function earnedIncomeDeduction(gross) {
  let deduction = 0;
  if (gross <= 5000000) {
    deduction = gross * 0.7;
  } else if (gross <= 15000000) {
    deduction = 3500000 + (gross - 5000000) * 0.4;
  } else if (gross <= 45000000) {
    deduction = 7500000 + (gross - 15000000) * 0.15;
  } else if (gross <= 100000000) {
    deduction = 12000000 + (gross - 45000000) * 0.05;
  } else {
    deduction = 14750000 + (gross - 100000000) * 0.02;
  }
  return Math.min(deduction, 20000000);
}

function earnedIncomeTaxCredit(calculatedTax, gross) {
  if (calculatedTax <= 0) return 0;
  const creditBeforeCap =
    calculatedTax <= 1300000
      ? calculatedTax * 0.55
      : 715000 + (calculatedTax - 1300000) * 0.3;
  return Math.min(creditBeforeCap, earnedIncomeTaxCreditCap(gross));
}

function earnedIncomeTaxCreditCap(gross) {
  if (gross <= 33000000) return 740000;
  if (gross <= 70000000) {
    return Math.max(660000, 740000 - (gross - 33000000) * 0.008);
  }
  if (gross <= 120000000) {
    return Math.max(500000, 660000 - (gross - 70000000) * 0.5);
  }
  return Math.max(200000, 500000 - (gross - 120000000) * 0.5);
}

function estimateKoreanIncomeTax(taxBase) {
  const brackets = [
    { limit: 14000000, rate: 0.06, deduction: 0 },
    { limit: 50000000, rate: 0.15, deduction: 1260000 },
    { limit: 88000000, rate: 0.24, deduction: 5760000 },
    { limit: 150000000, rate: 0.35, deduction: 15440000 },
    { limit: 300000000, rate: 0.38, deduction: 19940000 },
    { limit: 500000000, rate: 0.4, deduction: 25940000 },
    { limit: 1000000000, rate: 0.42, deduction: 35940000 },
    { limit: Infinity, rate: 0.45, deduction: 65940000 },
  ];
  const bracket = brackets.find((item) => taxBase <= item.limit);
  return Math.max(0, taxBase * bracket.rate - bracket.deduction);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function floorToTen(value) {
  return Math.floor(Math.max(0, value) / 10) * 10;
}

function calculateCardSchedule({ principal, annualRate, months, mode, monthlyContribution, startFee }) {
  const monthlyRate = annualRate / 100 / 12;
  const rows = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = startFee;
  const cardCoveredMonths = Math.max(0, Math.min(months, Math.floor(monthlyContribution || 0)));
  const basePrincipal = principal / months;

  for (let month = 1; month <= months; month += 1) {
    const customerPaysInterest =
      mode !== "partialInterestFree" || month <= months - cardCoveredMonths;
    const interest = customerPaysInterest ? balance * monthlyRate : 0;
    const principalPaid = basePrincipal;
    const payment = principalPaid + interest;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    totalPaid += payment;

    rows.push({
      month,
      payment,
      principalPaid,
      interest,
      balance,
    });
  }

  return {
    summary: {
      primaryValue: rows.length ? rows[0].payment : 0,
      primaryCaption: "첫 달 기준 예상 납부액입니다.",
      interestTotal: totalInterest,
      interestCaption:
        mode === "partialInterestFree"
          ? `초반 ${Math.max(0, months - cardCoveredMonths)}개월은 본인 부담, 마지막 ${cardCoveredMonths}개월은 카드사 부담 기준입니다.`
          : "할부 전체 이자입니다.",
      totalValue: totalPaid,
      totalCaption: startFee > 0 ? `기타 비용 ${formatCurrency(startFee)} 포함` : "원금과 이자 합계입니다.",
    },
    rows,
  };
}

function renderSimpleRows(rows) {
  if (!rows.length) {
    return `<div class="empty-state"><p>표를 만들 데이터가 없습니다.</p></div>`;
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>항목</th>
          <th>값</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
              (row) => `
              <tr>
                <td data-label="항목">${escapeHtml(row.label)}</td>
                <td data-label="값">${escapeHtml(row.value)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function calculateLeaveAndTenure(startDate, baseDate) {
  assertDateInput(startDate, "입사일");
  assertDateInput(baseDate, "계산 기준일");
  const start = parseDate(startDate);
  const base = parseDate(baseDate);
  if (base < start) {
    throw new Error("계산 기준일은 입사일보다 빠를 수 없습니다.");
  }

  const serviceDays = Math.floor((base.getTime() - start.getTime()) / 86400000) + 1;
  const tenure = diffYmd(start, base);
  const completedYears = tenure.years;
  const completedMonths = Math.max(0, Math.min(11, monthDiff(start, base)));
  let leaveDays = 0;
  let leaveCaption = "일반 근로자 기본 산정 기준";

  if (serviceDays < 365) {
    leaveDays = completedMonths;
    leaveCaption = "1년 미만 근로자는 1개월 개근 시 1일 기준";
  } else {
    leaveDays = Math.min(25, 15 + Math.max(0, Math.floor((completedYears - 1) / 2)));
  }

  return {
    serviceDays,
    leaveDays,
    leaveCaption,
    tenureLabel: `${tenure.years}년 ${tenure.months}개월 ${tenure.days}일`,
    nextMilestone: formatFullDate(addMonths(startDate, (completedYears + 1) * 12)),
    rows: [
      { label: "입사일", value: formatFullDate(startDate) },
      { label: "계산 기준일", value: formatFullDate(baseDate) },
      { label: "계속근로일수", value: `${serviceDays.toLocaleString("ko-KR")}일` },
      { label: "근속연수", value: `${tenure.years}년 ${tenure.months}개월 ${tenure.days}일` },
      { label: "예상 연차", value: `${leaveDays}일` },
    ],
  };
}

function calculateSeverancePay({ startDate, endDate, threeMonthWage, annualBonus, leaveAllowance }) {
  assertDateInput(startDate, "입사일");
  assertDateInput(endDate, "퇴사일");
  if (!Number.isFinite(threeMonthWage) || threeMonthWage <= 0) {
    throw new Error("퇴직 전 3개월 임금총액을 입력해 주세요.");
  }
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (end < start) {
    throw new Error("퇴사일은 입사일보다 빠를 수 없습니다.");
  }

  const serviceDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  const threeMonthStart = new Date(Math.max(start.getTime(), addMonths(endDate, -3, true).getTime()));
  const periodDays = Math.max(1, Math.floor((end.getTime() - threeMonthStart.getTime()) / 86400000) + 1);
  const bonusPortion = Math.max(0, annualBonus || 0) * (3 / 12);
  const leavePortion = Math.max(0, leaveAllowance || 0) * (3 / 12);
  const averageDailyWage = (threeMonthWage + bonusPortion + leavePortion) / periodDays;
  const eligible = serviceDays >= 365;
  const severancePay = eligible ? averageDailyWage * 30 * (serviceDays / 365) : 0;
  const tenure = diffYmd(start, end);

  return {
    serviceDays,
    averageDailyWage,
    severancePay,
    tenureLabel: `${tenure.years}년 ${tenure.months}개월 ${tenure.days}일`,
    caption: eligible ? "평균임금 × 30일 × 계속근로일수 / 365" : "계속근로기간 1년 미만은 일반적으로 법정 퇴직금 대상이 아닙니다.",
    rows: [
      { label: "퇴직 전 3개월 임금총액", value: formatCurrency(threeMonthWage) },
      { label: "상여금 3개월분 반영", value: formatCurrency(bonusPortion) },
      { label: "연차수당 3개월분 반영", value: formatCurrency(leavePortion) },
      { label: "평균임금 산정 일수", value: `${periodDays}일` },
      { label: "1일 평균임금", value: formatCurrency(averageDailyWage) },
      { label: "예상 퇴직금", value: formatCurrency(severancePay) },
    ],
  };
}

function calculateUnemploymentBenefit({ monthlyWage, birthDate, employmentStart, employmentEnd, disabled }) {
  const birthIso = parseBirthDate8(birthDate);
  assertDateInput(employmentStart, "입사일");
  assertDateInput(employmentEnd, "퇴사일");
  if (!Number.isFinite(monthlyWage) || monthlyWage <= 0) {
    throw new Error("최종월급 세전 금액을 입력해 주세요.");
  }

  const start = parseDate(employmentStart);
  const end = parseDate(employmentEnd);
  if (end < start) {
    throw new Error("퇴사일은 입사일보다 빠를 수 없습니다.");
  }

  const age = calculateAgeAt(birthIso, employmentEnd);
  const insuredDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  const averageDailyWage = (monthlyWage * 3) / 90;
  const upperLimit = 68100;
  const lowerLimit = 66048;
  const qualified = insuredDays >= 180;
  const dailyBenefit = qualified ? Math.max(lowerLimit, Math.min(upperLimit, averageDailyWage * 0.6)) : 0;
  const benefitDays = qualified ? unemploymentBenefitDays(age, insuredDays, disabled) : 0;
  const totalBenefit = dailyBenefit * benefitDays;
  const insuredPeriodLabel = formatInsuredPeriod(insuredDays);
  const ageGroupLabel = disabled || age >= 50 ? "50세 이상 또는 장애인 기준" : "50세 미만 기준";

  return {
    age,
    insuredDays,
    insuredPeriodLabel,
    dailyBenefit,
    benefitDays,
    totalBenefit,
    eligibilityCaption: qualified ? insuredPeriodLabel : "피보험 단위기간 180일 미만은 수급 대상이 아닐 수 있습니다.",
    daysCaption: qualified ? ageGroupLabel : "가입기간 180일 미만",
    rows: [
      { label: "생년월일", value: formatFullDate(birthIso) },
      { label: "퇴사 당시 만 나이", value: `만 ${age}세` },
      { label: "장애인 여부", value: disabled ? "예" : "아니오" },
      { label: "입사일", value: formatFullDate(employmentStart) },
      { label: "퇴사일", value: formatFullDate(employmentEnd) },
      { label: "고용보험 가입기간", value: `${insuredDays.toLocaleString("ko-KR")}일 (${insuredPeriodLabel})` },
      { label: "최종월급 세전", value: formatCurrency(monthlyWage) },
      { label: "1일 평균임금", value: formatCurrency(averageDailyWage) },
      { label: "평균임금의 60%", value: formatCurrency(averageDailyWage * 0.6) },
      { label: "2026년 1일 하한액", value: formatCurrency(lowerLimit) },
      { label: "2026년 1일 상한액", value: formatCurrency(upperLimit) },
      { label: "예상 지급일수", value: `${benefitDays}일` },
      { label: "예상 총액", value: formatCurrency(totalBenefit) },
    ],
  };
}

function unemploymentBenefitDays(age, insuredDays, disabled) {
  const older = disabled || age >= 50;
  const insuredPeriod = insuredPeriodCodeFromDays(insuredDays);
  const table = {
    under1: older ? 120 : 120,
    "1to3": older ? 180 : 150,
    "3to5": older ? 210 : 180,
    "5to10": older ? 240 : 210,
    over10: older ? 270 : 240,
  };
  return table[insuredPeriod] || 120;
}

function insuredPeriodCodeFromDays(days) {
  if (days < 365) return "under1";
  if (days < 365 * 3) return "1to3";
  if (days < 365 * 5) return "3to5";
  if (days < 365 * 10) return "5to10";
  return "over10";
}

function formatInsuredPeriod(days) {
  const code = insuredPeriodCodeFromDays(days);
  const labels = {
    under1: "1년 미만",
    "1to3": "1년 이상 3년 미만",
    "3to5": "3년 이상 5년 미만",
    "5to10": "5년 이상 10년 미만",
    over10: "10년 이상",
  };
  return labels[code];
}

function parseBirthDate8(value) {
  const raw = String(value || "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(raw)) {
    throw new Error("생년월일 8자리를 입력해 주세요.");
  }
  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6));
  const day = Number(raw.slice(6, 8));
  if (!dayExists(year, month, day)) {
    throw new Error("생년월일을 올바르게 입력해 주세요.");
  }
  return isoDate(year, month, day);
}

function calculateAgeAt(birthIso, baseIso) {
  const birth = parseDate(birthIso);
  const base = parseDate(baseIso);
  let age = base.getFullYear() - birth.getFullYear();
  const hadBirthday =
    base.getMonth() > birth.getMonth() ||
    (base.getMonth() === birth.getMonth() && base.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return Math.max(0, age);
}

function monthDiff(start, end) {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

function addMonths(date, months, asDate = false) {
  const parsed = typeof date === "string" ? parseDate(date) : new Date(date);
  const result = new Date(parsed);
  result.setMonth(result.getMonth() + months);
  return asDate ? result : formatIso(result);
}

function assertDateInput(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    throw new Error(`${label}을 선택해 주세요.`);
  }
}
function renderInterestTable(rows, kind) {
  if (!rows.length) {
    return `<div class="empty-state"><p>표를 만들 데이터가 없습니다.</p></div>`;
  }

  if (kind === "loan") {
    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>회차</th>
            <th>월 납입액</th>
            <th>원금</th>
            <th>이자</th>
            <th>남은 원금</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td data-label="회차">${row.month}개월차</td>
                  <td data-label="월 납입액">${formatCurrency(row.payment)}</td>
                  <td data-label="원금">${formatCurrency(row.principalPaid)}</td>
                  <td data-label="이자">${formatCurrency(row.interest)}</td>
                  <td data-label="남은 원금">${formatCurrency(row.balance)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  if (kind === "salary") {
    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>항목</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td data-label="항목">${row.label}</td>
                  <td data-label="금액">${formatCurrency(row.amount)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  if (kind === "card") {
    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>회차</th>
            <th>월 납부액</th>
            <th>원금</th>
            <th>이자</th>
            <th>남은 금액</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td data-label="회차">${row.month}개월차</td>
                  <td data-label="월 납부액">${formatCurrency(row.payment)}</td>
                  <td data-label="원금">${formatCurrency(row.principalPaid)}</td>
                  <td data-label="이자">${formatCurrency(row.interest)}</td>
                  <td data-label="남은 금액">${formatCurrency(row.balance)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>회차</th>
          <th>납입액</th>
          <th>이자</th>
          <th>누적 잔액</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td data-label="회차">${row.month}개월차</td>
                <td data-label="납입액">${formatCurrency(row.contribution)}</td>
                <td data-label="이자">${formatCurrency(row.interest)}</td>
                <td data-label="누적 잔액">${formatCurrency(row.balance)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function diffYmd(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += previousMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function calculateAge(birthDate, baseDate) {
  assertDateInput(birthDate, "출생일");
  assertDateInput(baseDate, "기준일");
  const birth = parseDate(birthDate);
  const base = parseDate(baseDate);
  if (base < birth) {
    throw new Error("기준일은 출생일보다 빠를 수 없습니다.");
  }

  const hasHadBirthday =
    base.getMonth() > birth.getMonth() || (base.getMonth() === birth.getMonth() && base.getDate() >= birth.getDate());
  const fullAge = base.getFullYear() - birth.getFullYear() - (hasHadBirthday ? 0 : 1);
  const yearAge = base.getFullYear() - birth.getFullYear();

  return {
    fullAge,
    yearAge,
    elapsed: diffYmd(birth, base),
  };
}

function getZodiacInfo(birthDate) {
  assertDateInput(birthDate, "출생일");
  const [birthYear] = birthDate.split("-").map(Number);
  const ipchunDate = isoDate(birthYear, 2, 4);
  const zodiacYear = compareDate(birthDate, ipchunDate) < 0 ? birthYear - 1 : birthYear;
  const animals = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  const index = ((zodiacYear - 4) % 12 + 12) % 12;

  return {
    animal: animals[index],
    zodiacYear,
  };
}

function parsePageSpec(spec, maxPages) {
  const zeroBased = new Set();
  for (const token of spec.split(",")) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [startText, endText] = trimmed.split("-");
      const start = Number(startText);
      const end = Number(endText);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end > maxPages || start > end) {
        throw new Error("페이지 범위를 다시 확인해 주세요.");
      }
      for (let page = start; page <= end; page += 1) {
        zeroBased.add(page - 1);
      }
    } else {
      const page = Number(trimmed);
      if (!Number.isFinite(page) || page < 1 || page > maxPages) {
        throw new Error("페이지 번호를 다시 확인해 주세요.");
      }
      zeroBased.add(page - 1);
    }
  }

  return Array.from(zeroBased).sort((a, b) => a - b);
}

function parsePageGroups(spec, maxPages) {
  const groups = [];
  for (const token of spec.split(",")) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [startText, endText] = trimmed.split("-");
      const start = Number(startText);
      const end = Number(endText);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end > maxPages || start > end) {
        throw new Error("페이지 범위를 다시 확인해 주세요.");
      }
      groups.push({
        label: `${start}-${end}`,
        pages: Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index),
      });
    } else {
      const page = Number(trimmed);
      if (!Number.isFinite(page) || page < 1 || page > maxPages) {
        throw new Error("페이지 번호를 다시 확인해 주세요.");
      }
      groups.push({
        label: `${page}`,
        pages: [page - 1],
      });
    }
  }

  return groups;
}

function analyzeWritingText(text) {
  const normalized = String(text || "");
  const trimmed = normalized.trim();
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((item) => item.trim()).length : 0;
  const sentences = trimmed ? (trimmed.match(/[.!?。！？]|[다요죠까네음함임됨됨다]\./g) || []).length || 1 : 0;
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const withoutSpaces = normalized.replace(/\s/g, "").length;
  const bytes = new TextEncoder().encode(normalized).length;

  return {
    withSpaces: normalized.length,
    withoutSpaces,
    words,
    sentences,
    paragraphs,
    bytes,
    manuscriptPages: Math.ceil(withoutSpaces / 200),
  };
}

function renderWritingStats(rows) {
  return `
    <div class="writing-stat-list">
      ${rows
        .map(
          (row) => `
            <div class="writing-stat-row">
              <span>${escapeHtml(row.label)}</span>
              <strong>${escapeHtml(row.value)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function checkWritingText(text) {
  const rules = [
    { wrong: "몇일", right: "며칠", reason: "날짜의 수를 뜻할 때는 '며칠'이 표준어입니다." },
    { wrong: "왠만", right: "웬만", reason: "'웬만하다'가 표준 표기입니다." },
    { wrong: "금새", right: "금세", reason: "'금시에'가 줄어든 말은 '금세'입니다." },
    { wrong: "설겆이", right: "설거지", reason: "'설거지'가 표준어입니다." },
    { wrong: "어의", right: "어이", reason: "'어이가 없다'처럼 씁니다." },
    { wrong: "뵈요", right: "봬요", reason: "'뵈어요'의 준말은 '봬요'입니다." },
    { wrong: "안되서", right: "안 돼서", reason: "'되어서'의 준말은 '돼서'이고, 부정 표현은 띄어 씁니다." },
    { wrong: "안되요", right: "안 돼요", reason: "'되어요'의 준말은 '돼요'이고, 부정 표현은 띄어 씁니다." },
    { wrong: "안되", right: "안 돼", reason: "부정 표현은 띄고, '되어'의 준말은 '돼'입니다." },
    { wrong: "안돼요", right: "안 돼요", reason: "'안' 부정은 뒤 말과 띄어 씁니다." },
    { wrong: "않되", right: "안 돼", reason: "'않되'는 어색한 조합입니다. 문맥상 '안 돼'가 자연스럽습니다." },
    { wrong: "할수", right: "할 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "될수", right: "될 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "볼수", right: "볼 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "갈수", right: "갈 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "끝날수", right: "끝날 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "확인할수", right: "확인할 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "사용할수", right: "사용할 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "계산할수", right: "계산할 수", reason: "의존 명사 '수'는 앞말과 띄어 씁니다." },
    { wrong: "할 지", right: "할지", reason: "막연한 의문이나 추측의 연결 어미는 붙여 쓰는 경우가 많습니다." },
    { wrong: "되있는", right: "되어 있는", reason: "'되어 있는' 또는 '돼 있는'이 자연스럽습니다." },
    { wrong: "되있", right: "돼 있", reason: "'되어 있'의 준말은 '돼 있'입니다." },
  ];

  const fixedSuggestions = rules
    .map((rule) => {
      if (rule.skipSame) return null;
      const count = countTextMatches(text, rule.wrong);
      return count > 0 ? { ...rule, count } : null;
    })
    .filter(Boolean);

  return mergeWritingSuggestions([...fixedSuggestions, ...findSpacingSuggestions(text)]);
}

function findSpacingSuggestions(text) {
  const suggestions = [];
  const patterns = [
    {
      regex: /(확인|사용|계산|작성|수정|저장|다운로드|업로드|처리|진행|끝날|끝낼|볼|갈|올|먹을|읽을|쓸|할|될)수/g,
      reason: "의존 명사 '수'는 앞말과 띄어 씁니다.",
      right: (match) => `${match.slice(0, -1)} 수`,
    },
  ];

  for (const pattern of patterns) {
    for (const match of String(text || "").matchAll(pattern.regex)) {
      const wrong = match[0];
      const right = pattern.right(wrong);
      if (wrong === right) continue;
      suggestions.push({ wrong, right, reason: pattern.reason, count: 1 });
    }
  }

  return suggestions;
}

function mergeWritingSuggestions(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = `${item.wrong}\n${item.right}`;
    if (grouped.has(key)) {
      grouped.get(key).count += item.count;
    } else {
      grouped.set(key, { ...item });
    }
  }
  return Array.from(grouped.values());
}

function resizeWritingTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  const nextHeight = Math.max(220, Math.min(620, textarea.scrollHeight + 2));
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > 620 ? "auto" : "hidden";
}

function countTextMatches(text, needle) {
  if (!needle) return 0;
  return String(text || "").split(needle).length - 1;
}

function applyWritingSuggestions(text, suggestions) {
  return suggestions.reduce((result, item) => result.replaceAll(item.wrong, item.right), String(text || ""));
}

const VIDEO_FORMATS = ["mov", "mp4", "mkv", "avi", "wmv"];

function videoExtension(filename) {
  return String(filename || "").split(".").pop()?.toLocaleLowerCase("en-US") || "";
}

function videoMimeType(extension) {
  return {
    mov: "video/quicktime",
    mp4: "video/mp4",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    wmv: "video/x-ms-wmv",
  }[extension] || "application/octet-stream";
}

function buildVideoFfmpegArgs(inputName, outputName, outputExtension, mode, quality) {
  const args = ["-i", inputName, "-map", "0:v:0", "-map", "0:a?", "-sn"];
  const crf = mode === "convert" ? "18" : { strong: "32", balanced: "27", quality: "23" }[quality] || "27";
  const audioBitrate = mode === "convert" ? "256k" : { strong: "64k", balanced: "96k", quality: "128k" }[quality] || "96k";

  if (["mp4", "mov", "mkv"].includes(outputExtension)) {
    args.push("-c:v", "libx264", "-threads", "4", "-preset", "ultrafast", "-crf", crf, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", audioBitrate);
    if (outputExtension === "mp4") args.push("-movflags", "+faststart");
  } else if (outputExtension === "avi") {
    const videoQuality = mode === "convert" ? "2" : quality === "strong" ? "10" : quality === "quality" ? "5" : "7";
    args.push("-c:v", "mpeg4", "-q:v", videoQuality, "-c:a", "libmp3lame", "-b:a", audioBitrate);
  } else {
    const videoQuality = mode === "convert" ? "2" : quality === "strong" ? "10" : quality === "quality" ? "5" : "7";
    args.push("-c:v", "wmv2", "-q:v", videoQuality, "-c:a", "wmav2", "-b:a", audioBitrate);
  }

  args.push("-y", outputName);
  return args;
}

async function createVideoFfmpeg() {
  const { FFmpeg } = await import("/src/vendor/ffmpeg/index.js");
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: "/src/vendor/ffmpeg-core/ffmpeg-core.js",
    wasmURL: "/src/vendor/ffmpeg-core/ffmpeg-core.wasm",
    workerURL: "/src/vendor/ffmpeg-core/ffmpeg-core.worker.js",
  });
  return ffmpeg;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 파일을 읽을 수 없습니다."));
    };
    image.src = url;
  });
}

function imageExtension(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function uniqueImageFilename(baseName, extension, usedNames) {
  let filename = `${baseName}.${extension}`;
  let counter = 2;
  while (usedNames.has(filename.toLocaleLowerCase("en-US"))) {
    filename = `${baseName}-${counter}.${extension}`;
    counter += 1;
  }
  usedNames.add(filename.toLocaleLowerCase("en-US"));
  return filename;
}

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function groupOccurrencesByDate(items) {
  return items.reduce((acc, item) => {
    (acc[item.date] ||= []).push(item);
    return acc;
  }, {});
}

async function ensureHolidayYear(year) {
  if (state.fetchedHolidayYears.has(year)) return;
  state.fetchedHolidayYears.add(year);

  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
    if (!response.ok) throw new Error(`Holiday API ${response.status}`);
    const list = await response.json();
    if (!Array.isArray(list)) return;

    for (const item of list) {
      if (!item?.date) continue;
      const name = normalizeHolidayName(item.localName || item.name || "공휴일");
      const isSubstitute =
        name.includes("대체") || String(item.name || "").toLowerCase().includes("substitute");
      state.holidays[item.date] = {
        name: isSubstitute && !name.includes("대체") ? `대체공휴일(${name})` : name,
        isSubstitute,
      };
    }
  } catch {
    if (year === 2026) {
      Object.assign(state.holidays, builtInHolidays2026());
    }
  }

  render();
}

function normalizeHolidayName(name) {
  return (
    {
      "3·1절": "삼일절",
      노동절: "근로자의 날",
      "부처님 오신 날": "부처님오신날",
      크리스마스: "성탄절",
    }[name] || name
  );
}

function builtInHolidays2026() {
  return {
    "2026-01-01": { name: "새해" },
    "2026-02-16": { name: "설날 연휴" },
    "2026-02-17": { name: "설날" },
    "2026-02-18": { name: "설날 연휴" },
    "2026-03-01": { name: "삼일절" },
    "2026-03-02": { name: "대체공휴일", isSubstitute: true },
    "2026-05-01": { name: "근로자의 날" },
    "2026-05-05": { name: "어린이날" },
    "2026-05-24": { name: "부처님오신날" },
    "2026-05-25": { name: "대체공휴일", isSubstitute: true },
    "2026-06-03": { name: "전국동시지방선거" },
    "2026-06-06": { name: "현충일" },
    "2026-07-17": { name: "제헌절" },
    "2026-08-15": { name: "광복절" },
    "2026-08-17": { name: "대체공휴일", isSubstitute: true },
    "2026-09-24": { name: "추석 연휴" },
    "2026-09-25": { name: "추석" },
    "2026-09-26": { name: "추석 연휴" },
    "2026-10-03": { name: "개천절" },
    "2026-10-05": { name: "대체공휴일", isSubstitute: true },
    "2026-10-09": { name: "한글날" },
    "2026-12-25": { name: "성탄절" },
  };
}

function nthWeekdayInMonth(date) {
  return Math.floor((dayNumber(date) - 1) / 7) + 1;
}

function nthWeekdayOfMonth(year, month, nth, weekday) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const delta = (weekday - firstDay + 7) % 7;
  const day = 1 + delta + (nth - 1) * 7;
  if (!dayExists(year, month, day)) return null;
  return isoDate(year, month, day);
}

function firstBusinessDayOfMonth(year, month) {
  for (let day = 1; day <= 7; day += 1) {
    const candidate = isoDate(year, month, day);
    if (!isWeekend(candidate)) return candidate;
  }
  return isoDate(year, month, 1);
}

function lastBusinessDayOfMonth(year, month) {
  for (let day = daysInMonth(year, month); day >= Math.max(1, daysInMonth(year, month) - 6); day -= 1) {
    const candidate = isoDate(year, month, day);
    if (!isWeekend(candidate)) return candidate;
  }
  return isoDate(year, month, daysInMonth(year, month));
}

function getCalendarRange(monthIso) {
  const [year, month] = monthIso.split("-").map(Number);
  const first = isoDate(year, month, 1);
  const firstWeekday = new Date(`${first}T00:00:00`).getDay();
  const start = addDays(first, -firstWeekday);
  const last = isoDate(year, month, daysInMonth(year, month));
  const lastWeekday = new Date(`${last}T00:00:00`).getDay();
  const end = addDays(last, 6 - lastWeekday);
  return { start, end };
}

function cloneTemplate(id) {
  return document.getElementById(id).content.cloneNode(true);
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getInitialRoute() {
  const hashRoute = window.location.hash.replace(/^#/, "");
  if (ROUTE_META[hashRoute]) {
    return hashRoute;
  }
  const pathRoute = decodeURIComponent(window.location.pathname)
    .replace(/^\/+|\/+$/g, "")
    .trim();
  return ROUTE_META[pathRoute] ? pathRoute : "home";
}

function normalizeLegacyHashUrl(route) {
  if (!window.location.hash) return;
  const path = ROUTE_META[route]?.path || "/";
  window.history.replaceState({}, "", path);
}

function updateDocumentMeta(route) {
  const meta = ROUTE_META[route] || ROUTE_META.home;
  const pageTitle = route === "home" ? `${meta.title} - 무료 실무 계산기` : `${meta.title} - 직장인 도구 모음`;
  const url = `${SITE_ORIGIN}${meta.path || "/"}`;
  document.title = pageTitle;
  setMetaContent("description", meta.description);
  setMetaContent("robots", route === "coming-soon" ? "noindex, follow" : "index, follow");
  setMetaContent("og:title", pageTitle, "property");
  setMetaContent("og:description", meta.description, "property");
  setMetaContent("og:url", url, "property");
  setMetaContent("twitter:title", pageTitle);
  setMetaContent("twitter:description", meta.description);
  setLinkHref("canonical", url);
}

function setMetaContent(name, content, attribute = "name") {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function setLinkHref(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.append(element);
  }
  element.setAttribute("href", href);
}

function hasOpenModal() {
  return Boolean(document.querySelector("[data-modal]"));
}

function explainError(error, fallback) {
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatWon(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("ko-KR")}원`;
}

function parseWonInput(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatWonInput(value) {
  const number = parseWonInput(value);
  return number ? number.toLocaleString("ko-KR") : "";
}

function formatMonthTitle(monthIso) {
  const [year, month] = monthIso.split("-").map(Number);
  return `${year}년 ${month}월`;
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${date}T00:00:00`));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function monthStart(date) {
  const [year, month] = date.slice(0, 7).split("-").map(Number);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(monthIso, delta) {
  const [year, month] = monthIso.split("-").map(Number);
  const moved = new Date(year, month - 1 + delta, 1);
  return `${moved.getFullYear()}-${String(moved.getMonth() + 1).padStart(2, "0")}`;
}

function listDates(from, to) {
  const dates = [];
  let cursor = from;
  while (compareDate(cursor, to) <= 0) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function addDays(date, days) {
  const instance = parseDate(date);
  instance.setDate(instance.getDate() + days);
  return formatIso(instance);
}

function compareDate(a, b) {
  return a.localeCompare(b);
}

function inRange(date, from, to) {
  return compareDate(date, from) >= 0 && compareDate(date, to) <= 0;
}

function todayIso() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayNumber(date) {
  return Number(date.slice(8, 10));
}

function monthNumber(date) {
  return Number(date.slice(5, 7));
}

function weekdayNumber(date) {
  return new Date(`${date}T00:00:00`).getDay();
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function dayExists(year, month, day) {
  return day >= 1 && day <= daysInMonth(year, month);
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function clampPriority(priority) {
  return Math.max(1, Math.min(3, Number(priority) || 2));
}

function colorIntToHex(value) {
  return `#${Number(value).toString(16).slice(-6).padStart(6, "0")}`;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}




