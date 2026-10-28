function initSlider(slider) {
  const track = slider.querySelector(".s-inicio__pista");
  const slides = Array.from(slider.querySelectorAll(".s-inicio__lamina"));
  const dotsContainer = slider.querySelector(".s-inicio__puntos");
  const prevButton = slider.querySelector(".s-inicio__nav--prev");
  const nextButton = slider.querySelector(".s-inicio__nav--next");
  const AUTOPLAY_DELAY_MS = 10000;

  if (slides.length === 0) return;

  const dots = slides.map((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "s-inicio__punto";
    dot.setAttribute(
      "aria-label",
      `Ir al anuncio ${index + 1} de ${slides.length}`,
    );
    dot.addEventListener("click", () => {
      goToSlide(index);
      restartAutoplay();
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  let currentIndex = 0;
  let autoplayId = null;

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle("s-inicio__punto--activo", i === currentIndex);
    });
  }

  function restartAutoplay() {
    clearInterval(autoplayId);
    autoplayId = setInterval(
      () => goToSlide(currentIndex + 1),
      AUTOPLAY_DELAY_MS,
    );
  }

  function stopAutoplay() {
    clearInterval(autoplayId);
  }

  prevButton.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
    restartAutoplay();
  });

  nextButton.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
    restartAutoplay();
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", restartAutoplay);
  slider.addEventListener("focusin", stopAutoplay);
  slider.addEventListener("focusout", restartAutoplay);

  goToSlide(0);
  restartAutoplay();
}

document.querySelectorAll(".s-inicio__carrusel").forEach(initSlider);
