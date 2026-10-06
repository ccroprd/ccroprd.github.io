/* ===== Menu hambúrguer ===== */
const hamburger_menu = document.querySelector(".hamburger-menu");
const container = document.querySelector(".container");

hamburger_menu.addEventListener("click", () => {
  container.classList.toggle("active");
});

/* ===== Fundo rotativo por visita ===== */
(function () {
  const imagens = [
    "escada.jpg",
    "beco.jpg",
    "beco2.jpg",
    "corredor.jpg",
    "door.jpg",
    "escada1.jpg",
    "escada2.jpg",
    "street.jpg",
    "street1.jpg"
  ];

  const alvo = document.querySelector("header");
  if (!alvo || !imagens.length) return;

  let idx = 0;
  try {
    const salvo = parseInt(localStorage.getItem("bgIdx"), 10);
    const novaVisita = !sessionStorage.getItem("bgSessao");

    if (isNaN(salvo)) {
      idx = Math.floor(Math.random() * imagens.length);
    } else if (novaVisita) {
      idx = (salvo + 1) % imagens.length;
    } else {
      idx = salvo % imagens.length;
    }
    localStorage.setItem("bgIdx", idx);
    sessionStorage.setItem("bgSessao", "1");
  } catch (e) {
    idx = Math.floor(Math.random() * imagens.length);
  }

  // Tenta carregar a imagem; se falhar, tenta a próxima
  function carregar(i, tentativas) {
    if (tentativas >= imagens.length) return;
    const url = new URL(imagens[i], document.baseURI).href;
    const img = new Image();
    img.onload = () => {
      alvo.style.setProperty("--bg", 'url("' + url + '")');
      alvo.classList.add("bg-ready");
    };
    img.onerror = () => {
      console.warn("Imagem não encontrada:", url);
      carregar((i + 1) % imagens.length, tentativas + 1);
    };
    img.src = url;
  }
  carregar(idx, 0);
})();

/* ===== Caixa de contato ===== */
(function () {
  const btn = document.getElementById("contactBtn");
  const box = document.getElementById("contactBox");
  const send = document.getElementById("cSend");
  if (!btn || !box) return;

  const fechar = () => {
    box.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    box.hidden = !box.hidden;
    btn.setAttribute("aria-expanded", String(!box.hidden));
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".contact")) fechar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fechar();
  });

  send.addEventListener("click", () => {
    const assunto = document.getElementById("cSubject").value.trim() || "Contato pelo site";
    const msg = document.getElementById("cMessage").value.trim();
    window.location.href =
      "mailto:contato@ccro.com.br?subject=" + encodeURIComponent(assunto) +
      "&body=" + encodeURIComponent(msg);
    fechar();
  });
})();
