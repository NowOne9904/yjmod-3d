// ── 화면 · 옵션 로직 (3D 모듈이 늦게 오거나 실패해도 동작) ──
window.YJ = (function () {
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // 업계 평균 외형 규격 (mm)
  var SIZES = {
    mid:  { grp: 'tower', form: 'tower', label: '미들 타워', name: 'YJMOD TOWER M', w: 230, h: 490, d: 480, maxGpu: 2, gpuSet: [1, 2], sockets: [1], hddSet: [0, 1, 2, 3] },
    full: { grp: 'tower', form: 'tower', label: '풀 타워', name: 'YJMOD TOWER XL', w: 335, h: 646, d: 579, maxGpu: 4, gpuSet: [1, 2, 4], sockets: [1, 2], hddSet: [0, 2, 4, 8, 12] },
    u2:   { grp: 'bare', form: 'rack', label: '2U', name: 'YJMOD RACK 2U', u: 2, w: 438, h: 88.9, d: 800, maxGpu: 4, gpuSet: [1, 2, 4], sockets: [1, 2], hddSet: [0, 2, 4] },
    u4:   { grp: 'bare', form: 'rack', label: '4U', name: 'YJMOD RACK 4U', u: 4, w: 438, h: 177.8, d: 800, maxGpu: 8, gpuSet: [2, 4, 6, 8], sockets: [1, 2], hddSet: [0, 4, 8] },
    u6:   { grp: 'bare', form: 'rack', label: '6U', name: 'YJMOD RACK 6U', u: 6, w: 438, h: 266.7, d: 800, maxGpu: 8, gpuSet: [2, 4, 6, 8], sockets: [1, 2], hddSet: [0, 4, 8] }
  };
  // GPU 라인업 (look: 3D 형상 - axial 워크스테이션 듀얼팬 · blower 블로워 · passive 서버 패시브 · lp 로우프로파일)
  // 랙마운트 조립형: 4U/6U 산업용 섀시 + SSI-EEB 서버 · 워크스테이션 보드 (PCIe x16 7슬롯)
  // 2U 조립형: Alphacool ES 2U 19" ServerRack 기준 (깊이 730.75mm, 5.25" 베이 4개 → 3.5" 최대 12개, 2.5" 6개, 4 × 80mm 라디에이터, 수냉 최대 880W)
  SIZES.d2 = { grp: 'diy', form: 'rack', label: '2U', name: 'YJMOD RACK 2U', u: 2, w: 438, h: 88.9, d: 730.8, maxGpu: 3, gpuSet: [1, 2, 3], sockets: [1, 2], hddSet: [0, 1, 2, 3, 4] };
  SIZES.d4 = { grp: 'diy', form: 'rack', label: '4U', name: 'YJMOD RACK 4U', u: 4, w: 438, h: 177.8, d: 738, maxGpu: 4, gpuSet: [1, 2, 4], sockets: [1, 2], hddSet: [0, 2, 4] };
  SIZES.d6 = { grp: 'diy', form: 'rack', label: '6U', name: 'YJMOD RACK 6U', u: 6, w: 438, h: 266.7, d: 650, maxGpu: 4, gpuSet: [1, 2, 4], sockets: [1, 2], hddSet: [0, 2, 4, 6] };
  var GPUS = [
    { id: 'pro6000', fam: 'NVIDIA RTX PRO · Blackwell', name: 'RTX PRO 6000 Blackwell', sub: '96GB · 600W', vram: 96, w: 600, look: 'axial', tower: true },
    { id: 'pro6000se', fam: 'NVIDIA RTX PRO · Blackwell', name: 'RTX PRO 6000 Blackwell 서버 에디션', sub: '96GB · 600W · 패시브', vram: 96, w: 600, look: 'passive', rack: true },
    { id: 'pro6000q', fam: 'NVIDIA RTX PRO · Blackwell', name: 'RTX PRO 6000 Blackwell Max-Q', sub: '96GB · 300W · 블로워', vram: 96, w: 300, look: 'blower' },
    { id: 'pro5000', fam: 'NVIDIA RTX PRO · Blackwell', name: 'RTX PRO 5000 Blackwell', sub: '48GB · 300W', vram: 48, w: 300, look: 'blower' },
    { id: 'pro4500', fam: 'NVIDIA RTX PRO · Blackwell', name: 'RTX PRO 4500 Blackwell', sub: '32GB · 200W', vram: 32, w: 200, look: 'blower' },
    { id: 'pro4000', fam: 'NVIDIA RTX PRO · Blackwell', name: 'RTX PRO 4000 Blackwell', sub: '24GB · 140W · 싱글 슬롯', vram: 24, w: 140, look: 'blower', slim: true },
    { id: 'h200', fam: 'NVIDIA 데이터센터 · Hopper', name: 'H200 NVL', sub: '141GB · 600W', vram: 141, w: 600, look: 'passive', rack: true },
    { id: 'h100', fam: 'NVIDIA 데이터센터 · Hopper', name: 'H100 NVL', sub: '94GB · 400W', vram: 94, w: 400, look: 'passive', rack: true },
    { id: 'l40s', fam: 'NVIDIA Ada Lovelace', name: 'L40S', sub: '48GB · 350W · 패시브', vram: 48, w: 350, look: 'passive', rack: true },
    { id: 'l4', fam: 'NVIDIA Ada Lovelace', name: 'L4', sub: '24GB · 72W · 로우프로파일', vram: 24, w: 72, look: 'lp', rack: true },
    { id: 'a6000ada', fam: 'NVIDIA Ada Lovelace', name: 'RTX 6000 Ada', sub: '48GB · 300W', vram: 48, w: 300, look: 'blower' },
    { id: 'a5000ada', fam: 'NVIDIA Ada Lovelace', name: 'RTX 5000 Ada', sub: '32GB · 250W', vram: 32, w: 250, look: 'blower' },
    { id: 'r5090', fam: 'NVIDIA GeForce', name: 'RTX 5090', sub: '32GB · 575W', vram: 32, w: 575, look: 'axial' },
    { id: 'r4090', fam: 'NVIDIA GeForce', name: 'RTX 4090', sub: '24GB · 450W', vram: 24, w: 450, look: 'axial' }
  ];
  // 네트워크 · 소프트웨어 · 보증
  var NETS = [{ id: '10g', name: '10GbE 듀얼 포트', sub: '온보드 · 기본 포함', cards: 0 }, { id: '25g', name: '25GbE 듀얼 SFP28', sub: 'NIC 1장', cards: 1 }, { id: '100g', name: '100GbE 듀얼 QSFP28', sub: 'NIC 1장', cards: 1 }, { id: '400g', name: '400Gb/s InfiniBand NDR', sub: 'NIC 2장 · 멀티 노드 학습', cards: 2, rack: true }];
  var OSES = [{ id: 'none', name: '설치 안 함' }, { id: 'ubuntu', name: 'Ubuntu 24.04 LTS', sub: 'CUDA · 드라이버 세팅' }, { id: 'rocky', name: 'Rocky Linux 9', sub: 'CUDA · 드라이버 세팅' }, { id: 'winsrv', name: 'Windows Server 2025', rack: true }, { id: 'win11', name: 'Windows 11 Pro', sub: 'for Workstations', tower: true }];
  var WARRS = [{ id: '3y', name: '3년 무상 보증', sub: '기본 포함' }, { id: '5y', name: '5년 연장 보증', sub: '부품 · 출장 수리' }];
  // CPU 라인업 (v: 추천 제품 매칭용 제조사 계열, single: 싱글 소켓 전용)
  var CPUS = [
    { id: 'x6980p', fam: 'Intel Xeon 6 · 서버', name: 'Xeon 6 6980P', sub: '128코어 · 500W', w: 500, v: 'xeon' },
    { id: 'x6972p', fam: 'Intel Xeon 6 · 서버', name: 'Xeon 6 6972P', sub: '96코어 · 500W', w: 500, v: 'xeon' },
    { id: 'x6767p', fam: 'Intel Xeon 6 · 서버', name: 'Xeon 6 6767P', sub: '64코어 · 350W', w: 350, v: 'xeon' },
    { id: 'e9965', fam: 'AMD EPYC 9005 · 서버', name: 'EPYC 9965', sub: '192코어 · 500W', w: 500, v: 'epyc' },
    { id: 'e9755', fam: 'AMD EPYC 9005 · 서버', name: 'EPYC 9755', sub: '128코어 · 500W', w: 500, v: 'epyc' },
    { id: 'e9655', fam: 'AMD EPYC 9005 · 서버', name: 'EPYC 9655', sub: '96코어 · 400W', w: 400, v: 'epyc' },
    { id: 'e9555', fam: 'AMD EPYC 9005 · 서버', name: 'EPYC 9555', sub: '64코어 · 360W', w: 360, v: 'epyc' },
    { id: 'e9355', fam: 'AMD EPYC 9005 · 서버', name: 'EPYC 9355', sub: '32코어 · 280W', w: 280, v: 'epyc' },
    { id: 'tr9995', fam: 'AMD Threadripper PRO 9000 WX · 워크스테이션', name: 'Threadripper PRO 9995WX', sub: '96코어 · 350W', w: 350, v: 'epyc', single: true, tower: true },
    { id: 'tr9975', fam: 'AMD Threadripper PRO 9000 WX · 워크스테이션', name: 'Threadripper PRO 9975WX', sub: '32코어 · 350W', w: 350, v: 'epyc', single: true, tower: true },
    { id: 'w3595', fam: 'Intel Xeon W-3500 · 워크스테이션', name: 'Xeon w9-3595X', sub: '60코어 · 385W', w: 385, v: 'xeon', single: true, tower: true }
  ];
  var CPU_DEF = { xeon: 'x6767p', epyc: 'e9555' };
  // 계열별로 묶어서 표시
  function famChips(key, list, dis, st) { if (dis) list = list.filter(function (o) { return !dis(o); }); var fams = []; list.forEach(function (o) { if (fams.indexOf(o.fam) < 0) fams.push(o.fam); }); return fams.map(function (f) { return '<p class="sub-h fam">' + f + '</p>' + chips(key, list.filter(function (o) { return o.fam === f; }).map(function (o) { var r = dis && dis(o); return { v: o.id, b: o.name, s: r || o.sub, dis: !!r, st: st }; }), 1, true); }).join(''); }
  var RAMS = [256, 512, 1024, 2048];
  // 스토리지 모델 (개수는 각 옵션의 − n + 로 조절)
  var SSDS = [{ id: 's384', name: 'NVMe U.2 3.84TB', sub: 'PCIe 5.0 · 엔터프라이즈', tb: 3.84 }, { id: 's768', name: 'NVMe U.2 7.68TB', sub: 'PCIe 5.0 · 엔터프라이즈', tb: 7.68 }, { id: 's1536', name: 'NVMe U.2 15.36TB', sub: 'PCIe 5.0 · 엔터프라이즈', tb: 15.36 }];
  var HDDS = [{ id: 'none', name: 'HDD 사용 안 함', sub: 'SSD만 사용', tb: 0 }, { id: 'h16', name: '3.5인치 HDD 16TB', sub: 'SATA · 7200rpm', tb: 16 }, { id: 'h24', name: '3.5인치 HDD 24TB', sub: 'SAS · 7200rpm', tb: 24 }];
  function hddTB() { var h = HDDS.filter(function (x) { return x.id === cfg.hddM; })[0]; return h ? h.tb : 0; }
  function ssdTB() { return SSDS.filter(function (x) { return x.id === cfg.ssd; })[0].tb; }
  var UNIT = { count: '장', sockets: '개', disk: '개', hdd: '개' };
  function stepSet(k) { return k === 'count' ? countSet() : k === 'sockets' ? (cpuOf().single ? [1] : S.sockets) : k === 'disk' ? (cfg.size === 'd2' ? [1, 2, 4, 6] : [1, 2, 4, 8]) : S.hddSet.filter(function (n) { return n > 0; }); }
  var DISKS = [{ n: 1, tb: 7.68 }, { n: 2, tb: 15.36 }, { n: 4, tb: 30.72 }, { n: 8, tb: 61.44 }];
  var PRODUCTS = [
    { name: 'ASUS 4GPU SERVER', sub: 'Intel Xeon · 2U 공냉', size: 'u2', cpu: 'xeon', gpu: 4, wc: 'none', img: 'img/rack.webp' },
    { name: 'ASUS 4GPU SERVER', sub: 'AMD EPYC · 2U 공냉', size: 'u2', cpu: 'epyc', gpu: 4, wc: 'none', img: 'img/rack.webp' },
    { name: 'ASUS 8GPU SERVER', sub: 'Intel Xeon · 4U 공냉', size: 'u4', cpu: 'xeon', gpu: 8, wc: 'none', img: 'img/rack.webp' },
    { name: 'MITAC 8GPU SERVER', sub: 'AMD EPYC · 4U 공냉', size: 'u4', cpu: 'epyc', gpu: 8, wc: 'none', img: 'img/rack.webp' },
    { name: 'MOBYDICK', sub: '4U 워터쿨링 GPU 서버', size: 'u4', cpu: 'xeon', gpu: 8, wc: 'both', img: 'img/hero.webp' },
    { name: 'DEVILRAY 6U', sub: 'Intel Xeon · 워터쿨링', size: 'u6', cpu: 'xeon', gpu: 8, wc: 'both', img: 'img/hero.webp' },
    { name: 'DEVILRAY 6U', sub: 'AMD EPYC · 워터쿨링', size: 'u6', cpu: 'epyc', gpu: 8, wc: 'both', img: 'img/hero.webp' },
    { name: 'YJMOD LIQUID SERVER', sub: 'Intel Xeon · 수냉 워크스테이션', size: 'full', cpu: 'xeon', gpu: 4, wc: 'both', img: 'img/tower.webp' },
    { name: 'YJMOD TRX AIR GPU', sub: 'AMD EPYC · 공냉 워크스테이션', size: 'full', cpu: 'epyc', gpu: 4, wc: 'none', img: 'img/tower.webp' }
  ];
  var form = null, cfg = null, S = null, view = 'iso', dims = true, sub = 0;
  // 옵션 단계 (cat = 3D에서 강조할 부품 그룹)
  var STEPS = [{ t: '규격', cat: 'chassis' }, { t: 'GPU', cat: 'gpu' }, { t: 'CPU', cat: 'cpu' }, { t: '메모리', cat: 'ram' }, { t: '스토리지', cat: 'disk' }, { t: '네트워크', cat: 'net' }, { t: '쿨링', cat: 'cool' }, { t: '소프트웨어 · 보증', cat: null }, { t: '추천 · 확인', cat: null }];
  function wc() { var c = cfg.cpuCool !== 'air', g = cfg.gpuCool !== 'air'; return c && g ? 'both' : c ? 'cpu' : g ? 'gpu' : 'none'; }
  function coolStyle() { return cfg.cpuCool === 'custom' || cfg.gpuCool === 'custom' ? 'custom' : 'aio'; }
  var COOL_N = { air: '공냉', aio: '일체형 수냉', custom: '커스텀 수냉' };
  function gpuOf() { return GPUS.filter(function (g) { return g.id === cfg.gpu; })[0]; }
  function cpuOf() { return CPUS.filter(function (c) { return c.id === cfg.cpu; })[0]; }
  function netOf() { return NETS.filter(function (n) { return n.id === cfg.net; })[0]; }
  function osOf() { return OSES.filter(function (n) { return n.id === cfg.os; })[0]; }
  // 실제 장착 가능한 GPU 수: 케이스 슬롯 수 · 카드 두께 기준
  //  미들 타워 ATX(7슬롯): 2슬롯 2장 · 3슬롯 1장 · 1슬롯 4장 / 풀 타워 E-ATX(8슬롯 케이스): 2슬롯 4장 · 3슬롯 2장 · 1슬롯 7장
  //  랙: 2U 4장(라이저 수평 장착) · 4U · 6U 8장 (FHFL 2슬롯 기준)
  function slotClass(g) { return g.slim ? 'single' : (g.id === 'r4090' && S.grp !== 'bare') ? 'triple' : 'dual'; }
  function countSet() {
    var c = slotClass(gpuOf());
    if (cfg.size === 'd2') return gpuOf().look === 'lp' ? [1, 2, 4, 7] : [1, 2, 3]; // Alphacool ES 2U 공식: 로우프로파일 7장 또는 1슬롯 카드 3장
    if (S.grp !== 'bare') return cfg.size === 'mid' ? (c === 'single' ? [1, 2, 4] : c === 'triple' ? [1] : [1, 2]) : (c === 'single' ? (cpuOf().single ? [1, 2, 4, 7] : [1, 2, 4]) : c === 'triple' ? [1, 2] : [1, 2, 4]);
    // 베어본: RTX 4090 · 5090은 3슬롯 · 450~575W 액시얼 공냉 카드 → 2슬롯 간격 8GPU 베이에 공냉으로는 최대 4장(한 칸 건너 장착), 8장은 커스텀 수냉(1슬롯 워터블록)만
    return S.gpuSet;
  }
  // GPU 커스텀 수냉 강제 - 공냉 카드가 물리적 · 열적으로 들어가지 않는 구성
  function forceReason() {
    var g = gpuOf(); if (!g || !cfg) return '';
    if (S.grp === 'bare' && consumerGpu() && cfg.size === 'u2') return g.name + '은(는) 3슬롯 공냉 카드라 2U GPU 칸에 들어가지 않습니다';
    if (S.grp === 'bare' && consumerGpu() && cfg.count >= 6) return g.name + ' ' + cfg.count + '장은 3슬롯 공냉 쿨러가 2슬롯 간격 GPU 칸에 들어가지 않습니다';
    if (S.grp !== 'bare' && g.look === 'axial' && cfg.count >= 4) return '듀얼 팬 ' + g.name + ' ' + cfg.count + '장은 카드 사이 간격이 없어 공냉 흡기가 불가능합니다';
    return '';
  }
  function consumerGpu() { return cfg.gpu === 'r4090' || cfg.gpu === 'r5090'; }
  // 발열 검토: 규격별 공냉 한계와 내부 라디에이터 처리 용량(W, YJMOD 설계 기준 추정치)
  var AIR_LIM = { mid: 700, full: 1300, d2: 900, d4: 1800, d6: 2400, u2: 1400, u4: 4800, u6: 6000 }, RAD_LIM = { mid: 900, full: 1500, d2: 880, d4: 1500, d6: 2600, u2: 1000, u4: 2000, u6: 3500 };
  function kW(w) { return (w / 1000).toFixed(1) + 'kW'; }
  function thermal() {
    var g = gpuOf(), c = cpuOf(), gp = g.w * cfg.count, cp = c.w * cfg.sockets, w = wc(), r = [];
    if (w === 'none' || w === 'cpu') {
      if (gp > AIR_LIM[cfg.size]) r.push('GPU 발열 합계 ' + kW(gp) + '가 ' + S.label + ' 공냉 처리 한계(약 ' + kW(AIR_LIM[cfg.size]) + ')를 넘을 수 있습니다');
      else if (S.grp !== 'bare' && g.look === 'axial' && cfg.count >= 3) r.push('듀얼 팬(액시얼) 카드 ' + cfg.count + '장을 붙여 꽂으면 뜨거운 공기가 옆 카드로 유입될 수 있습니다');
    }
    if (w !== 'none') { var load = (w !== 'cpu' ? gp : 0) + (w !== 'gpu' ? cp : 0); var lim = RAD_LIM[cfg.size] * (coolStyle() === 'aio' ? .6 : 1); if (load > lim) r.push('수냉 루프 발열 ' + kW(load) + '가 ' + S.label + ' 내부 라디에이터 처리 용량(약 ' + kW(lim) + ')을 넘을 수 있습니다'); }
    return r;
  }
  var WARN_HEAD = '견적 구성에 따라 공간이 협소하여, 외부 쿨링 장치가 필요할 수 있습니다.';
  // GPU 4장 이상: 외장 라디에이터(Alphacool NexXxoS XT45 Nova 1080 + 팬박스) 필수
  function novaReq() { return cfg && cfg.count >= 4; }
  var NOVA_HEAD = 'GPU 4장 이상 구성은 외장 라디에이터가 필수입니다';
  function novaHTML() { return novaReq() ? '<div class="warn nova" role="note"><b>' + NOVA_HEAD + '</b><p>Alphacool NexXxoS XT45 Full Copper 1080mm Nova 라디에이터(378 × 360 × 46.5mm, 120mm 팬 9개)와 전용 팬박스(374 × 395 × 87mm)를 서버 외부에 함께 구성합니다. 3D에서 서버 왼쪽 옆에 함께 표시되며, 마지막 확인 단계에서는 실제 제품 외관으로 보여 줍니다.</p></div>' : ''; }
  function warnHTML(full) { var t = novaReq() ? [] : thermal(); if (!t.length) return novaHTML(); return '<div class="warn" role="note"><b>' + WARN_HEAD + '</b>' + (full ? '<ul>' + t.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p>외장 라디에이터 · 칠러(CDU) 등 외부 냉각 장치를 함께 구성하거나, GPU 수량 · 모델 또는 규격을 조정하면 내부 냉각만으로 운영할 수 있습니다. 실제 필요 여부는 사용 환경에 따라 달라지며, 담당 엔지니어가 견적 시 확인해 안내합니다.</p>' : '') + '</div>'; }
  // 타워 PCIe 슬롯(7개) 중 GPU가 차지하는 칸: 2슬롯 카드는 2칸, 1슬롯은 1칸
  function freeSlots() {
    if (S.grp === 'bare') return 9;
    if (cfg.size === 'd2') return gpuOf().look === 'lp' ? 7 - cfg.count : 0; // 2U: 로우프로파일 7슬롯 또는 90° 라이저 3슬롯(둘 중 하나)
    var g = gpuOf(), n = cfg.count, used = g.slim ? n : n === 1 ? 2 : n === 2 ? 4 : 7;
    if (slotClass(g) === 'triple') used = Math.min(7, n * 3);
    return Math.max(0, 7 - used);
  }
  function okF(o) { return !(o.rack && S.form !== 'rack') && !(o.tower && S.grp === 'bare'); }
  function diskOf() { return { n: cfg.disk, tb: +(ssdTB() * cfg.disk).toFixed(2) }; }
  function wmm(s) { s = s || S; return s.form === 'rack' ? 482.6 : s.w; }
  function three() { return window.YJ3D && window.YJ3D.ready ? window.YJ3D : null; }
  function redraw(resetView, drop) { var t = three(); if (!t || !S) return; t.focus(STEPS[sub].cat); cfg.netCards = netOf().cards; cfg.gpuLook = gpuOf().look; cfg.gpuSlim = !!gpuOf().slim; cfg.loop = coolStyle(); cfg.nova = novaReq(); cfg.final = sub === STEPS.length - 1; t.build(S, cfg, wc(), drop || (resetView ? 'all' : null)); if (power) t.power(true, wc() !== 'none'); t.setDims(dims); if (resetView) t.setView(view, true); }

  document.querySelector('.forms').addEventListener('click', function (e) { var b = e.target.closest('.fc'); if (b) start(b.dataset.f); });
  $('toPick').addEventListener('click', function (e) { e.preventDefault(); showStep(1); });
  function setSteps(n) { document.querySelectorAll('#steps li').forEach(function (li) { var s = +li.dataset.s; li.removeAttribute('aria-current'); if (s === n) li.setAttribute('aria-current', 'step'); li.classList.toggle('past', s < n); li.querySelector('button').disabled = (s > 1 && !cfg) || (s === 3 && (!cfg || reach < STEPS.length - 1)); }); }
  // 상단 단계 표시를 누르면 해당 단계로 이동
  $('steps').addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b || b.disabled) return; var g = +b.dataset.go;
    if (!$('sheet').hidden && g !== 3) { $('sheet').hidden = true; $('sheetBg').hidden = true; }
    if (g === 1) showStep(1); else if (g === 2) showStep(2); else { showStep(2); openSheet(); }
  });
  function showStep(n) { $('pick').hidden = n !== 1; $('cfg').hidden = n === 1; $('toPick').hidden = n === 1; setSteps(n); var t = three(); if (t) { t.active(n === 2); if (n === 2) t.resize(); } window.scrollTo(0, 0); }

  // 단계별 필수 선택 항목: 고객이 직접 고르기 전에는 '다음'이 잠김
  var picked = {}, reach = 0;
  function need(i) { return [['size'], ['gpu'], ['cpu'], ['ram'], ['ssd', 'hddM'], ['net'], ['cpuCool', 'gpuCool'], S.form === 'rack' ? ['os', 'warr', 'rail'] : ['os', 'warr'], []][i]; }
  function stepDone(i) { return need(i).every(function (k) { return picked[k]; }); }
  function isOn(key, v) { return !!picked[key] && String(cfg[key]) === String(v); }
  function start(f, preset, keepSub) {
    form = f; if (!keepSub) { sub = 0; picked = {}; reach = 0; } else { ['size', 'gpu', 'count', 'cpu', 'sockets', 'ram', 'disk', 'hdd', 'ssd', 'hddM', 'net', 'cool', 'wc', 'cpuCool', 'gpuCool', 'os', 'warr', 'rail'].forEach(function (k) { picked[k] = true; }); reach = STEPS.length - 1; }
    cfg = { size: f === 'tower' ? 'full' : f === 'diy' ? 'd4' : 'u4', gpu: f !== 'bare' ? 'pro6000' : 'pro6000se', count: 0, cpu: f !== 'bare' ? 'tr9995' : 'x6767p', sockets: 0, ram: 512, disk: 2, hdd: 0, ssd: 's768', hddM: 'none', net: '10g', os: 'ubuntu', warr: '3y', rail: 'yes', cool: 'water', wc: 'both' };
    if (preset) for (var k in preset) cfg[k] = preset[k];
    if (CPU_DEF[cfg.cpu]) cfg.cpu = CPU_DEF[cfg.cpu];
    if (!preset || !preset.cpuCool) { var wv = cfg.cool === 'air' ? 'none' : cfg.wc; cfg.cpuCool = wv === 'cpu' || wv === 'both' ? 'custom' : 'air'; cfg.gpuCool = wv === 'gpu' || wv === 'both' ? 'custom' : 'air'; }
    fit(); view = 'iso'; showStep(2); renderOpts(); redraw(true);
  }
  function fit() {
    S = SIZES[cfg.size];
    if (S.sockets.indexOf(cfg.sockets) < 0) cfg.sockets = S.sockets[S.sockets.length - 1];
    var okForm = okF;
    if (!gpuOf() || !okForm(gpuOf())) cfg.gpu = S.grp !== 'bare' ? 'pro6000' : 'pro6000se';
    if (!cpuOf() || !okForm(cpuOf())) cfg.cpu = S.grp !== 'bare' ? 'tr9995' : 'x6767p';
    if (cpuOf().single) cfg.sockets = 1;
    if (cfg.size === 'd2') { if (!gpuOf().slim && gpuOf().look !== 'lp') cfg.gpu = 'pro4000'; if (cfg.gpuCool === 'aio' || gpuOf().look === 'lp') cfg.gpuCool = 'air'; }
    var cs = countSet(); if (cs.indexOf(cfg.count) < 0) cfg.count = cs.filter(function (n) { return n <= cfg.count; }).pop() || cs[cs.length - 1]; if (!okForm(netOf())) cfg.net = '100g'; if (netOf().cards > freeSlots()) cfg.net = '10g'; if (!okForm(osOf())) cfg.os = 'ubuntu';
    if (!cfg.hddM || (cfg.hddM === 'none' && cfg.hdd)) cfg.hddM = cfg.hdd ? 'h24' : 'none';
    if (forceReason()) cfg.gpuCool = 'custom';
    if (cfg.hddM === 'none') cfg.hdd = 0; else { var hs = stepSet('hdd'); if (hs.indexOf(cfg.hdd) < 0) cfg.hdd = hs.filter(function (n) { return n <= cfg.hdd; }).pop() || hs[0]; }
    $('sK').textContent = (S.form === 'tower' ? 'Tower · ' : S.grp === 'diy' ? 'Rackmount · 조립형 · ' : 'Rackmount · 베어본 · ') + S.label;
    $('sName').textContent = S.name;
    $('sDims').innerHTML = '<b><span>W</span>' + wmm() + '</b><b><span>H</span>' + S.h + '</b><b><span>D</span>' + S.d + '<span style="margin:0 0 0 4px">mm</span></b>';
  }

  function chips(key, list, cols, row) {
    list = list.filter(function (o) { return !o.dis; }); // 선택할 수 없는 항목은 감춤
    if (!row) cols = Math.min(cols || 3, list.length) || 1;
    return '<div class="chips' + (row ? ' rows' : '') + '" style="--cols:' + (cols || 3) + '">' + list.map(function (o) {
      var on = isOn(key, o.v), st = on && o.st, h = '';
      if (st) { var set = stepSet(st), ix = set.indexOf(cfg[st]); h = '<span class="stp" role="group" aria-label="' + esc(o.b) + ' 수량"><button type="button" data-st="' + st + '" data-d="-1" aria-label="수량 줄이기"' + (ix <= 0 ? ' disabled' : '') + '>−</button><b aria-live="polite">' + cfg[st] + UNIT[st] + '</b><button type="button" data-st="' + st + '" data-d="1" aria-label="수량 늘리기"' + (ix >= set.length - 1 ? ' disabled' : '') + '>+</button></span>'; }
      return '<div class="cw' + (st ? ' has-st' : '') + '"><button type="button" class="chip" data-k="' + key + '" data-v="' + o.v + '" aria-pressed="' + on + '"' + (o.dis ? ' disabled' : '') + '><b>' + esc(o.b) + '</b>' + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</button>' + h + '</div>';
    }).join('') + '</div>';
  }
  function seg(key, list) { return '<div class="seg" role="group" style="--cols:' + list.filter(function (o) { return !o.dis; }).length + '">' + list.filter(function (o) { return !o.dis; }).map(function (o) { return '<button type="button" data-k="' + key + '" data-v="' + o.v + '" aria-pressed="' + isOn(key, o.v) + '"' + (o.dis ? ' disabled' : '') + '>' + esc(o.b) + '</button>'; }).join('') + '</div>'; }
  function grp(n, title, hint, body) { return '<div class="grp"><div class="grp-h">' + (n ? '<em>' + n + '</em>' : '') + '<h3>' + title + '</h3>' + (hint ? '<small>' + hint + '</small>' : '') + '</div>' + body + '</div>'; }
  function renderOpts() {
    var sizes = Object.keys(SIZES).filter(function (k) { return SIZES[k].grp === form; }), h = '', all = [];
    var grp0 = grp; grp = function (n, title, hint, body) { all.push(grp0(n, title, hint, body)); return ''; };
    h += grp('01', '규격', S.form === 'rack' ? '19인치 랙 표준' : '', chips('size', sizes.map(function (k) { var s = SIZES[k]; return { v: k, b: s.label, s: k === 'd2' ? 'Alphacool ES 2U 기준' : k === 'd4' ? 'Alphacool ES 4U 기준' : s.form === 'rack' ? '높이 ' + s.h + 'mm' : s.h + 'mm 높이' }; }), sizes.length));
    h += grp('02', 'GPU', '최대 ' + countSet()[countSet().length - 1] + '장', famChips('gpu', GPUS.filter(okF), function (g) { return cfg.size === 'd2' && !g.slim && g.look !== 'lp' ? '2U는 1슬롯 · 로우프로파일 카드만 장착 가능' : ''; }, 'count') + (forceReason() ? '<p class="sub-h" style="color:#2a2fa8;font-weight:700">이 구성은 GPU 커스텀 수냉(1슬롯 워터블록)으로만 구성할 수 있습니다 · ' + forceReason() + '. 쿨링 단계에서 자동으로 커스텀 수냉이 적용됩니다</p>' : '') + '<p class="sub-h">' + (slotClass(gpuOf()) === 'triple' ? 'RTX 4090은 3슬롯 두께라 장착 수가 제한됩니다' : slotClass(gpuOf()) === 'single' ? ((S.form === 'tower' && cfg.size === 'full') || S.grp === 'diy' ? (cpuOf().single ? '싱글 슬롯 카드는 PCIe 5.0 x16 슬롯 7개짜리 워크스테이션 보드(ASUS Pro WS WRX90E-SAGE SE 등, SSI-EEB)에서 최대 7장까지 장착할 수 있습니다' : '7장 구성은 Threadripper PRO · Xeon W 워크스테이션 보드에서만 가능합니다. 서버 CPU 보드는 최대 4장입니다') : '싱글 슬롯 카드라 더 많이 장착할 수 있습니다') : '2슬롯 FHFL 카드 기준 최대 장착 수입니다') + '</p>' + warnHTML(true));
    var cpuH = famChips('cpu', CPUS.filter(okF), function (c) { return S.grp !== 'bare' && cfg.count > 4 && !c.single ? 'GPU ' + cfg.count + '장 구성 미지원' : ''; }, 'sockets'), cc = cpuOf();
    if (S.grp !== 'bare' && cfg.count > 4) cpuH = '<p class="sub-h" style="color:#c2410c">GPU ' + cfg.count + '장 구성은 PCIe x16 슬롯 7개짜리 워크스테이션 보드가 필요해 Threadripper PRO · Xeon W만 선택할 수 있습니다. 서버 CPU를 쓰려면 GPU 단계에서 4장 이하로 줄여 주세요.</p>' + cpuH;
    cpuH += ''
      + '<p class="sub-h">' + (cc.single ? cc.name + '은(는) 싱글 소켓 전용 워크스테이션 CPU입니다. 듀얼 CPU는 Xeon 6 · EPYC 9005를 선택하세요' : S.sockets.length > 1 ? '듀얼 CPU는 코어 수와 메모리 채널이 두 배가 되어 데이터 전처리 · 가상화에 유리합니다' : '미들 타워(ATX 보드)는 싱글 CPU만 장착할 수 있습니다. 듀얼 CPU는 풀 타워를 선택하세요') + '</p>';
    h += grp('03', 'CPU', '', cpuH);
    h += grp('04', '시스템 메모리', 'DDR5 ECC RDIMM', chips('ram', RAMS.map(function (n) { var k = Math.min(16, n / 64); return { v: n, b: n >= 1024 ? n / 1024 + 'TB' : n + 'GB', s: k + '×' + (n / k) + 'GB' }; }), 4));
    h += grp('05', '스토리지', 'SSD + HDD', '<p class="sub-h fam">NVMe SSD · 작업 · 학습 데이터</p>' + chips('ssd', SSDS.map(function (d) { return { v: d.id, b: d.name, s: d.sub, st: 'disk' }; }), 1, true)
      + '<p class="sub-h fam">HDD · 대용량 보관 · 백업</p>' + chips('hddM', HDDS.map(function (d) { return { v: d.id, b: d.name, s: d.sub, st: d.id === 'none' ? null : 'hdd' }; }), 1, true)
      + '<p class="sub-h">선택한 모델 오른쪽의 − + 로 개수를 조절하세요 · 합계 SSD ' + diskOf().tb + 'TB' + (cfg.hdd ? ' + HDD ' + cfg.hdd * hddTB() + 'TB' : '') + '</p>'
      + '<p class="sub-h">부팅용 NVMe M.2 SSD 1TB 기본 포함</p>');
    h += grp('06', '네트워크', '서버 간 · 스토리지 연결', chips('net', NETS.filter(okF).map(function (n) { var no = n.cards > freeSlots(); return { v: n.id, b: n.name, s: no ? '남는 PCIe 슬롯 없음' : n.sub, dis: no }; }), 1, true)
      + (S.grp !== 'bare' && freeSlots() < 1 ? '<p class="sub-h" style="color:#c2410c">' + (cfg.size === 'd2' && gpuOf().look !== 'lp' ? '2U에서 1슬롯 GPU를 쓰면 90° 라이저 패널이 확장 슬롯을 모두 사용해' : 'GPU ' + cfg.count + '장이 PCIe 슬롯을 모두 사용해') + ' 추가 네트워크 카드를 장착할 수 없습니다. 온보드 10GbE를 사용하거나, GPU 단계에서 수량을 줄이면 선택할 수 있습니다.</p>' : ''));
    var COOLS = [{ v: 'air', b: '공냉', s: '방열판 + 고정압 팬' }, { v: 'aio', b: '일체형 수냉', s: '기성 일체형(AIO) 제품 구성' }, { v: 'custom', b: '커스텀 수냉', s: '워터 블록 기반 커스텀 설계' }];
    var coolH = '<p class="sub-h fam">CPU 쿨링</p>' + chips('cpuCool', COOLS, 1, true) + '<p class="sub-h fam">GPU 쿨링</p>' + (forceReason() ? '<p class="sub-h" style="color:#2a2fa8;font-weight:700">GPU 커스텀 수냉 필수 · ' + forceReason() + '</p>' : '') + chips('gpuCool', COOLS.map(function (o) { return forceReason() && o.v !== 'custom' ? { v: o.v, b: o.b, dis: true } : cfg.size === 'd2' && (o.v === 'aio' || (gpuOf().look === 'lp' && o.v !== 'air')) ? { v: o.v, b: o.b, s: '2U 높이 제한으로 선택 불가', dis: true } : o; }), 1, true)
      + '<p class="sub-h">일체형 수냉은 펌프 · 라디에이터가 하나로 된 기성 제품이고, 커스텀 수냉은 워터 블록 · 리저버 · 하드 튜빙으로 YJMOD가 직접 설계하는 시스템입니다</p>';
    h += grp('07', '쿨링', 'CPU · GPU 각각 선택', coolH + warnHTML(true));
    var svc = '<p class="sub-h">운영체제 사전 설치</p>' + chips('os', OSES.filter(okF).map(function (o) { return { v: o.id, b: o.name, s: o.sub || '' }; }), 1, true)
      + '<p class="sub-h">보증</p>' + chips('warr', WARRS.map(function (o) { return { v: o.id, b: o.name, s: o.sub }; }), 2)
      + (S.form === 'rack' ? '<p class="sub-h">랙 설치</p>' + seg('rail', [{ v: 'yes', b: '슬라이드 레일 포함' }, { v: 'no', b: '레일 없음' }]) : '')
      + '<p class="sub-h">모든 시스템은 출고 전 72시간 번인 테스트를 거칩니다</p>';
    h += grp('08', '소프트웨어 · 보증', '출고 세팅', svc);
    var spec = '<dl class="spec mini">' + specRows().map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';
    h += grp('09', '추천 제품 · 구성 확인', 'YJMOD 판매 제품', recHTML() + '<p class="sub-h">지금 구성한 사양</p>' + spec + '<p class="disc disc-box"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v5.5\"/><path d=\"M12 7.6v.2\" stroke-width=\"2.4\"/></svg><span>본 3D 시뮬레이션과 구성은 이해를 돕기 위한 참고용으로, 실제 제품의 외형 · 부품 배치 · 사양과 다를 수 있습니다. 부품 수급, 호환성 검증, 제조사 사양 변경 등의 사유로 일부 구성이 변경될 수 있으며, 최종 사양과 금액은 담당 엔지니어의 견적서로 확정됩니다.</span></p>');
    grp = grp0;
    var GUIDE = ['설치할 공간에 맞는 크기를 고르세요. 3D에서 섀시가 강조됩니다.', '연산에 쓸 GPU 모델을 고르고, 오른쪽 − + 로 장착 수량을 조절하세요.', 'CPU 모델을 고르고, 오른쪽 − + 로 CPU 개수(싱글 · 듀얼)를 조절하세요.', '시스템 메모리 용량을 고르세요. CPU 채널에 맞춰 균등하게 장착합니다.', '빠른 작업용 NVMe SSD와 대용량 보관용 HDD를 고르세요. HDD는 쓰지 않아도 됩니다.', '서버 간 통신 · 스토리지 연결 속도를 고르세요. 멀티 노드 학습이면 InfiniBand를 권장합니다.', 'CPU와 GPU 각각의 쿨링 방식을 고르세요: 공냉 · 일체형 수냉 · 커스텀 수냉.', '출고 시 설치할 운영체제와 보증 기간을 고르세요.', '구성과 비슷한 YJMOD 제품을 확인하고 견적을 요청하세요.'];
    $('opts').innerHTML = all[sub].replace('</div>', '</div><p class="guide">' + GUIDE[sub] + '</p>');
    $('wizN').textContent = 'STEP ' + ('0' + (sub + 1)).slice(-2) + ' / ' + ('0' + STEPS.length).slice(-2);
    $('wizBar').style.width = ((sub + 1) / STEPS.length * 100) + '%';
    $('wizTabs').innerHTML = STEPS.map(function (st, i) { return '<li><button type="button" data-sub="' + i + '"' + (i === sub ? ' aria-current="step"' : '') + (i < sub && stepDone(i) ? ' class="past"' : '') + (i > reach ? ' disabled' : '') + '>' + st.t + '</button></li>'; }).join('');
    var cur = $('wizTabs').querySelector('[aria-current]'); if (cur) { var tb = $('wizTabs'), r1 = tb.getBoundingClientRect(), r2 = cur.getBoundingClientRect(); tb.style.scrollBehavior = 'auto'; tb.scrollLeft += (r2.left + r2.width / 2) - (r1.left + r1.width / 2); tb.style.scrollBehavior = ''; }
    $('prevBtn').disabled = sub === 0; setSteps($('sheet').hidden ? 2 : 3);
    var ok = stepDone(sub); $('nextBtn').disabled = !ok; $('nextBtn').title = ok ? '' : '이 단계의 항목을 모두 선택해 주세요';
    var left = need(sub).filter(function (k) { return !picked[k]; }).length; $('needHint').hidden = ok; $('needHint').textContent = '이 단계에서 ' + left + '개 항목을 더 선택하면 다음 단계로 넘어갈 수 있습니다';
    $('nextBtn').innerHTML = (sub < STEPS.length - 1 ? '다음 · ' + STEPS[sub + 1].t : '이 구성으로 견적 요청') + ' <i aria-hidden="true">→</i>';
    summary(); buildList();
  }
  var BL_IC = ["<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><path d=\"M8 7h8M8 11h8\"/></svg>", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2\" y=\"7\" width=\"20\" height=\"10\" rx=\"1.5\"/><circle cx=\"9\" cy=\"12\" r=\"2.5\"/><circle cx=\"16\" cy=\"12\" r=\"2.5\"/><path d=\"M5 17v3\"/></svg>", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"1.5\"/><rect x=\"9.5\" y=\"9.5\" width=\"5\" height=\"5\"/><path d=\"M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4\"/></svg>", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2\" y=\"8\" width=\"20\" height=\"8\" rx=\"1\"/><path d=\"M6 11v2M10 11v2M14 11v2M18 11v2M5 16v3M19 16v3\"/></svg>", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><circle cx=\"12\" cy=\"11\" r=\"4\"/><path d=\"M8 18h3\"/></svg>", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"14\" width=\"18\" height=\"6\" rx=\"1\"/><path d=\"M12 14V9M7 9h10M7 9V5M17 9V5\"/></svg>", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 12c0-4 2-6 5-6M12 12c4 0 6 2 6 5M12 12c0 4-2 6-5 6M12 12c-4 0-6-2-6-5\"/></svg>", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\"/><path d=\"M9 12l2 2 4-4\"/></svg>"];
  function blSum(i) {
    var g = gpuOf(), c = cpuOf(), d = diskOf();
    return [S.label + ' · ' + wmm() + '×' + S.h + '×' + S.d, g.name + ' × ' + cfg.count, c.name + ' × ' + cfg.sockets, (cfg.ram >= 1024 ? cfg.ram / 1024 + 'TB' : cfg.ram + 'GB') + ' DDR5 ECC', 'SSD ' + d.tb + 'TB' + (cfg.hdd ? ' · HDD ' + cfg.hdd * hddTB() + 'TB' : ''), netOf().name, coolText(), osOf().name + ' · ' + (cfg.warr === '5y' ? '5년' : '3년') + ' 보증'][i];
  }
  function allDone() { for (var i = 0; i < 8; i++) if (!stepDone(i)) return false; return true; }
  function buildList() {
    var n = 0, h = '';
    for (var i = 0; i < 8; i++) {
      var ok = stepDone(i), cur = i === sub; if (ok) n++;
      var st = cur ? '선택 중' : ok ? '선택 완료' : i > reach ? '잠김' : '선택 대기';
      h += '<li><button type="button" class="bl-it' + (ok ? ' fin' : '') + '" data-bl="' + i + '"' + (cur ? ' aria-current="step"' : '') + (i > reach ? ' disabled' : '') + '><span class="bl-ic">' + BL_IC[i] + '</span><span class="bl-tx"><b>' + STEPS[i].t + '<em>' + st + '</em></b><small>' + (ok ? esc(blSum(i)) : '아직 선택하지 않았습니다') + '</small></span></button></li>';
    }
    $('blItems').innerHTML = h; $('blN').textContent = n + ' / 8'; $('blPct').textContent = Math.round(n / 8 * 100) + '%';
    $('blSeg').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<i' + (stepDone(i) ? ' class="on"' : '') + '></i>'; }).join('');
    var can = allDone(); $('pwrBtn').disabled = !can; if (!can && power) setPower(false);
  }
  $('blItems').addEventListener('click', function (e) { var b = e.target.closest('[data-bl]'); if (b && !b.disabled) goSub(+b.dataset.bl); });
  var power = false, hudT = null;
  function hudVals() {
    var w = wc(), gw = gpuOf().w * cfg.count, j = function (a, b) { return a + Math.random() * (b - a); };
    var gT = w === 'gpu' || w === 'both' ? j(46, 52) : j(66, 74), cT = w === 'cpu' || w === 'both' ? j(44, 50) : j(58, 66);
    var rpm = S.form === 'rack' ? (w === 'none' ? j(8800, 9600) : j(2400, 2800)) : (w === 'none' ? j(1500, 1700) : j(1100, 1300));
    var rows = [['GPU 온도 (평균)', gT.toFixed(0) + '°C'], ['CPU 온도', cT.toFixed(0) + '°C'], ['팬 속도', Math.round(rpm / 10) * 10 + ' RPM']];
    if (w !== 'none') rows.push(['냉각수 온도', j(31, 34).toFixed(1) + '°C'], ['펌프 유량', j(4.2, 4.6).toFixed(1) + ' L/min']);
    rows.push(['소비 전력 (부하)', ((gw + cpuOf().w * cfg.sockets + 300) * j(.82, .88) / 1000).toFixed(2) + ' kW']);
    $('hudDl').innerHTML = rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');
  }
  function setPower(on) {
    power = on; $('pwrBtn').setAttribute('aria-pressed', on); $('pwrT').textContent = on ? '전원 끄기' : '전원 켜기';
    $('hud').hidden = !on; clearInterval(hudT); if (on) { hudVals(); hudT = setInterval(hudVals, 1200); }
    var t = three(); if (t) t.power(on, wc() !== 'none');
  }
  $('pwrBtn').addEventListener('click', function () { if (!this.disabled) setPower(!power); });
  function goSub(i) { var was = sub === STEPS.length - 1; sub = Math.max(0, Math.min(STEPS.length - 1, i)); renderOpts(); $('opts').scrollTop = 0; var t = three(); if (t) t.focus(STEPS[sub].cat); if (was !== (sub === STEPS.length - 1) && novaReq()) redraw(false); }
  // 단계 탭: 마우스 드래그 · 휠(가로)로 슬라이드
  (function () {
    var el = $('wizTabs'), down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add('dragging'); } if (moved) el.scrollLeft = sl - dx; });
    addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { el.classList.remove('dragging'); }, 0); });
    el.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    el.addEventListener('wheel', function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) { e.preventDefault(); el.scrollLeft += e.deltaY; } }, { passive: false });
  })();
  $('wizTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-sub]'); if (b) goSub(+b.dataset.sub); });
  $('prevBtn').addEventListener('click', function () { goSub(sub - 1); });
  $('nextBtn').addEventListener('click', function () { if (!stepDone(sub)) return; if (sub < STEPS.length - 1) { reach = Math.max(reach, sub + 1); goSub(sub + 1); } else openSheet(); });
  $('opts').addEventListener('click', function (e) {
    var sb = e.target.closest('[data-st]'); if (sb) { if (sb.disabled) return; var sk = sb.dataset.st, set = stepSet(sk), ix = Math.max(0, set.indexOf(cfg[sk])) + +sb.dataset.d; if (ix < 0 || ix >= set.length) return; var sst = $('opts').scrollTop;
      cfg[sk] = set[ix]; fit(); renderOpts(); $('opts').scrollTop = sst; redraw(false, { count: 'gpu', sockets: 'cpu', disk: 'disk', hdd: 'disk' }[sk]); var nb = $('opts').querySelector('[data-st="' + sk + '"][data-d="' + sb.dataset.d + '"]'); if (nb && !nb.disabled) nb.focus(); return; }
    var rc = e.target.closest('.rec'); if (rc) { loadProduct(+rc.dataset.rec); return; }
    var b = e.target.closest('[data-k]'); if (!b) return;
    var k = b.dataset.k, v = b.dataset.v, st = $('opts').scrollTop;
    cfg[k] = /^\d+$/.test(v) ? +v : v; picked[k] = true;
    if (k === 'hddM') { if (v === 'none') cfg.hdd = 0; else if (!cfg.hdd) cfg.hdd = stepSet('hdd')[0]; }
    if (k === 'size' || k === 'cpu' || k === 'gpu' || k === 'gpuCool' || k === 'count') fit();
    var DROP = { ssd: 'disk', hddM: 'disk', gpu: 'gpu', count: 'gpu', cpu: 'cpu', sockets: 'cpu', ram: 'ram', disk: 'disk', hdd: 'disk', net: 'net', cool: 'cool', wc: 'cool', cpuCool: 'cool', gpuCool: 'cool' };
    renderOpts(); $('opts').scrollTop = st; redraw(k === 'size', DROP[k]);
  });
  function summary() {
    var wb = $('warnBar'), nv = novaReq(), t = nv ? [] : thermal(); wb.hidden = !t.length && !nv; wb.innerHTML = nv ? '<b>' + NOVA_HEAD + '</b>' : t.length ? '<b>' + WARN_HEAD + '</b>' : ''; $('extBadge').hidden = !t.length; $('novaBadge').hidden = !nv;
    var g = gpuOf(), c = cpuOf(), d = diskOf();
    $('kVram').innerHTML = (g.vram * cfg.count).toLocaleString() + '<em>GB</em>';
    $('kDisk').innerHTML = +(d.tb + cfg.hdd * hddTB()).toFixed(2) + '<em>TB</em>';
    $('kPow').innerHTML = ((g.w * cfg.count + c.w * cfg.sockets + 300) / 1000).toFixed(1) + '<em>kW</em>';
  }
  function coolText() { return 'CPU ' + COOL_N[cfg.cpuCool] + ' · GPU ' + COOL_N[cfg.gpuCool]; }
  function specRows() {
    var g = gpuOf(), c = cpuOf(), d = diskOf();
    return [['형태', (S.form === 'tower' ? '타워형 · ' : S.grp === 'diy' ? '랙마운트 (조립형) · ' : '랙마운트 (베어본) · ') + S.label], ['외형 규격', wmm() + ' × ' + S.h + ' × ' + S.d + ' mm'], ['GPU', g.name + ' (' + g.sub + ') × ' + cfg.count], ['CPU', c.name + ' (' + c.sub + ') × ' + cfg.sockets], ['메모리', (cfg.ram >= 1024 ? cfg.ram / 1024 + 'TB' : cfg.ram + 'GB') + ' DDR5 ECC'], ['스토리지', 'NVMe U.2 ' + d.tb + 'TB (' + d.n + '개)' + (cfg.hdd ? ' + HDD ' + cfg.hdd * hddTB() + 'TB (' + cfg.hdd + '개)' : '') + ' + 부팅 1TB'], ['네트워크', netOf().name + (netOf().cards ? ' (' + netOf().sub + ')' : ' (온보드)')], ['쿨링', coolText() + (forceReason() ? ' (GPU 커스텀 수냉 필수)' : '') + (novaReq() ? ' · 외장 라디에이터(Nova 1080) 필수' : '') + (!novaReq() && thermal().length ? ' · 외부 쿨링 장치가 필요할 수 있음' : '')], ['운영체제', osOf().name], ['보증', WARRS.filter(function (w) { return w.id === cfg.warr; })[0].name]].concat(S.form === 'rack' ? [['랙 설치', cfg.rail === 'yes' ? '슬라이드 레일 포함' : '레일 없음']] : []);
  }
  function recommend() {
    var w = wc();
    return PRODUCTS.map(function (p) {
      var ps = SIZES[p.size], sc = 0;
      if (ps.form === S.form) sc += 30;
      if (p.size === cfg.size) sc += 10;
      if (p.wc === w) sc += 25; else if (p.wc !== 'none' && w !== 'none') sc += 12;
      if (p.cpu === cpuOf().v) sc += 15;
      sc += 20 - Math.min(20, Math.abs(p.gpu - cfg.count) * 4);
      return { p: p, sc: sc };
    }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 3);
  }
  function recHTML() {
    return '<div class="recs">' + recommend().map(function (r, i) {
      var p = r.p;
      return '<button type="button" class="rec" data-rec="' + PRODUCTS.indexOf(p) + '"><span class="ri" style="background-image:url(' + p.img + ')" aria-hidden="true"></span><span class="rt"><span class="rm">' + r.sc + '% 일치' + (i === 0 ? ' · 가장 비슷함' : '') + '</span><b>' + esc(p.name) + '</b><small>' + esc(p.sub) + '</small></span><i aria-hidden="true">→</i></button>';
    }).join('') + '</div>';
  }
  function loadProduct(i) {
    var p = PRODUCTS[i];
    start(SIZES[p.size].grp, { size: p.size, gpu: cfg.gpu, count: p.gpu, cpu: CPU_DEF[p.cpu], ram: cfg.ram, disk: cfg.disk, cool: p.wc === 'none' ? 'air' : 'water', wc: p.wc === 'none' ? 'both' : p.wc }, true);
  }

  document.querySelector('.views').addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]'); if (!b) return; view = b.dataset.v;
    document.querySelectorAll('.views [data-v]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    var t = three(); if (t) t.setView(view);
  });
  $('dimBtn').addEventListener('click', function () { dims = !dims; this.setAttribute('aria-pressed', dims); var t = three(); if (t) t.setDims(dims); });

  function openSheet() {
    $('specList').innerHTML = specRows().map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    $('sheetRecs').innerHTML = recHTML().replace(/<button type="button" class="rec"/g, '<div class="rec static"').replace(/<\/button>/g, '</div>');
    $('sheet').hidden = false; $('sheetBg').hidden = false; setSteps(3); setTimeout(function () { $('fNm').focus(); }, 50);
  }
  function closeSheet() { $('sheet').hidden = true; $('sheetBg').hidden = true; setSteps(2); $('nextBtn').focus(); } $('closeSheet').addEventListener('click', closeSheet); $('sheetBg').addEventListener('click', closeSheet);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });
  $('qForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = [];
    if (!$('fNm').value.trim()) err.push('담당자명을 입력해 주세요');
    if (!/^[0-9\-+ ]{9,}$/.test($('fTel').value.trim())) err.push('연락처를 숫자로 입력해 주세요');
    if (!$('fAgree').checked) err.push('개인정보 수집 · 이용에 동의해 주세요');
    if (err.length) { $('fErr').textContent = err.join(' · '); $('fErr').hidden = false; return; }
    $('fErr').hidden = true; $('done').hidden = false;
    // 기존 서버몰에는 견적 전송 기능이 없어서, 구성 내용을 글로 만들어 문의하기 게시판 · 메일로 보냄
    var v = function (id) { return $(id).value.trim(); };
    var txt = '[3D 서버 구성 견적 문의]\n' + specRows().map(function (r) { return '- ' + r[0] + ': ' + r[1]; }).join('\n') +
      '\n\n회사 · 기관: ' + (v('fCo') || '-') + '\n담당자: ' + v('fNm') + '\n연락처: ' + v('fTel') + '\n이메일: ' + (v('fMail') || '-') + (v('fMemo') ? '\n요청 사항: ' + v('fMemo') : '');
    var mail = 'mailto:svr@yjmod.kr?subject=' + encodeURIComponent('[3D 구성 견적 문의] ' + (v('fCo') || v('fNm'))) + '&body=' + encodeURIComponent(txt);
    $('doneCard').innerHTML = '<div class="ok" aria-hidden="true">✓</div><h3 id="doneT">견적 문의 내용을 만들었습니다</h3><p id="cpMsg">아래 내용을 복사해 문의하기 게시판에 붙여 넣거나, 메일로 보내 주세요.</p>' +
      '<textarea class="qtxt" id="qTxt" readonly></textarea><div class="qbtns"><button type="button" id="qCopy">내용 복사</button><a class="pri" href="http://www.yjmod.kr/bbs/contact_us.php" target="_blank" rel="noopener">문의하기 게시판 열기</a><a href="' + mail + '">메일로 보내기</a></div><button type="button" class="cta" id="doneOk">닫기</button>';
    $('qTxt').value = txt;
    var copy = function () { var ok = function () { $('cpMsg').textContent = '내용을 복사했습니다. 문의하기 게시판의 내용 칸에 붙여 넣어 주세요.'; }; try { navigator.clipboard.writeText(txt).then(ok, function () { $('qTxt').select(); }); } catch (x) { $('qTxt').select(); } };
    copy(); $('qCopy').addEventListener('click', copy);
    $('doneOk').addEventListener('click', function () { $('done').hidden = true; closeSheet(); }); $('doneOk').focus();
  });

  // 3D 모듈이 준비되면 호출
  function on3D() { var t = three(); t.init($('gl')); t.active(!$('cfg').hidden); if (S) { t.resize(); redraw(true); } }
  function goStep(i) { if (cfg) goSub(i); }
  // 메인 헤더의 '견적 요청': 구성 중이면 견적 시트, 아니면 형태 선택으로
  $('gnbQuote').addEventListener('click', function () { if (cfg) { showStep(2); openSheet(); } else showStep(1); });
  function noGL() { if (document.querySelector('.nogl')) return; var p = document.createElement('p'); p.className = 'nogl'; p.textContent = '이 브라우저에서는 3D 미리보기를 표시할 수 없습니다. 오른쪽에서 구성을 고르면 그대로 견적을 요청할 수 있습니다.'; $('gl').hidden = true; $('gl').parentNode.appendChild(p); }
  setTimeout(function () { if (!three()) noGL(); }, 8000);

  var hsh = location.hash.replace('#', '');
  if (hsh === 'tower' || hsh === 'diy' || hsh === 'bare') start(hsh); else if (hsh === 'rack') start('bare'); else if (SIZES[hsh]) start(SIZES[hsh].grp, { size: hsh }); else showStep(1);
  return { on3D: on3D, noGL: noGL, start: start, goStep: goStep, cfg: function () { return cfg; } };
})();
