// ============================================
// CONTADOR DAS MÉTRICAS
// ============================================
function animarContador(elemento, valorFinal, sufixo = '') {
  if (!elemento) return;

  let valorAtual = 0;
  const passo = Math.ceil(valorFinal / 60);

  const intervalo = setInterval(() => {
    valorAtual += passo;
    if (valorAtual >= valorFinal) {
      valorAtual = valorFinal;
      clearInterval(intervalo);
    }
    elemento.textContent = '+' + valorAtual.toLocaleString('pt-BR') + sufixo;
  }, 20);
}

const metricas = document.querySelectorAll('.metrica strong');

window.addEventListener('load', () => {
  if (metricas.length >= 3) {
    animarContador(metricas[0], 10000);
    animarContador(metricas[1], 500);

    let uptime = 0;
    const intervaloUptime = setInterval(() => {
      uptime += 1.7;
      if (uptime >= 99.8) {
        uptime = 99.8;
        clearInterval(intervaloUptime);
      }
      metricas[2].textContent = uptime.toFixed(1).replace('.', ',') + '%';
    }, 20);
  }
});

// ============================================
// CARROSSEL DA DEMONSTRAÇÃO
// ============================================
const carrossel = document.getElementById('carrossel');

if (carrossel) {
  const trilha = document.getElementById('carrossel-trilha');
  const slides = trilha ? trilha.querySelectorAll('.carrossel-slide') : [];
  const btnPrev = carrossel.querySelector('.carrossel-prev');
  const btnNext = carrossel.querySelector('.carrossel-next');
  const indicadores = document.getElementById('carrossel-indicadores');

  const total = slides.length;
  let slideAtual = 0;
  let autoPlay = null;

  if (total > 0 && trilha && btnPrev && btnNext && indicadores) {

    // Cria os indicadores dinamicamente
    slides.forEach((_, indice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'indicador' + (indice === 0 ? ' ativo' : '');
      btn.setAttribute('aria-label', 'Ir para o slide ' + (indice + 1));
      btn.addEventListener('click', () => {
        irParaSlide(indice);
        reiniciarAutoPlay();
      });
      indicadores.appendChild(btn);
    });

    const listaIndicadores = indicadores.querySelectorAll('.indicador');

    function irParaSlide(indice) {
      slideAtual = indice;
      trilha.style.transform = `translateX(-${indice * 100}%)`;

      listaIndicadores.forEach((ind, i) => {
        ind.classList.toggle('ativo', i === indice);
      });
    }

    function proximoSlide() {
      irParaSlide((slideAtual + 1) % total);
    }

    function slideAnterior() {
      irParaSlide((slideAtual - 1 + total) % total);
    }

    function iniciarAutoPlay() {
      pararAutoPlay();
      autoPlay = setInterval(proximoSlide, 6000);
    }

    function pararAutoPlay() {
      if (autoPlay) {
        clearInterval(autoPlay);
        autoPlay = null;
      }
    }

    function reiniciarAutoPlay() {
      pararAutoPlay();
      iniciarAutoPlay();
    }

    // Botões de navegação
    btnNext.addEventListener('click', () => {
      proximoSlide();
      reiniciarAutoPlay();
    });

    btnPrev.addEventListener('click', () => {
      slideAnterior();
      reiniciarAutoPlay();
    });

    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        proximoSlide();
        reiniciarAutoPlay();
      }
      if (e.key === 'ArrowLeft') {
        slideAnterior();
        reiniciarAutoPlay();
      }
    });

    // Swipe em dispositivos móveis
    let inicioX = 0;

    carrossel.addEventListener('touchstart', (e) => {
      inicioX = e.touches[0].clientX;
    }, { passive: true });

    carrossel.addEventListener('touchend', (e) => {
      const fimX = e.changedTouches[0].clientX;
      const delta = fimX - inicioX;

      if (Math.abs(delta) > 50) {
        if (delta < 0) proximoSlide();
        else slideAnterior();
        reiniciarAutoPlay();
      }
    });

    // Pausa ao passar o mouse
    carrossel.addEventListener('mouseenter', pararAutoPlay);
    carrossel.addEventListener('mouseleave', iniciarAutoPlay);

    // Inicia
    iniciarAutoPlay();
  }
}

// ---------- VLIBRAS ----------
if (window.VLibras) {
  new window.VLibras.Widget('https://vlibras.gov.br');
}