const slides = Array.from(document.querySelectorAll('.guide-slide'));
const slideTabs = Array.from(document.querySelectorAll('.slide-tab'));
const previousButton = document.querySelector('#previous-slide');
const nextButton = document.querySelector('#next-slide');
const slideCount = document.querySelector('.slide-count');
const progress = document.querySelector('.slide-progress span');
const currentSlideTitle = document.querySelector('.current-slide-title');
const stage = document.querySelector('.slide-stage');
const slideTitles = slideTabs.map((tab) => tab.textContent.replace(/^\d+/, '').trim());
let currentSlide = 0;
let touchStartX = null;

function getSlideFromHash() {
  const match = window.location.hash.match(/^#slide-(\d+)$/);
  const requestedSlide = match ? Number(match[1]) - 1 : 0;
  return Math.min(Math.max(requestedSlide, 0), slides.length - 1);
}

function showSlide(index, updateHash = true) {
  currentSlide = Math.min(Math.max(index, 0), slides.length - 1);

  slides.forEach((slide, slideIndex) => {
    const isCurrent = slideIndex === currentSlide;
    slide.hidden = !isCurrent;
    slide.classList.toggle('is-active', isCurrent);
  });

  slideTabs.forEach((tab, tabIndex) => {
    const isCurrent = tabIndex === currentSlide;
    tab.classList.toggle('is-active', isCurrent);
    if (isCurrent) {
      tab.setAttribute('aria-current', 'step');
    } else {
      tab.removeAttribute('aria-current');
    }
  });

  previousButton.disabled = currentSlide === 0;
  nextButton.disabled = currentSlide === slides.length - 1;
  slideCount.textContent = `${currentSlide + 1} / ${slides.length}`;
  progress.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
  currentSlideTitle.textContent = slideTitles[currentSlide];

  if (updateHash) {
    window.history.replaceState(null, '', `#slide-${currentSlide + 1}`);
  }
}

slideTabs.forEach((tab) => {
  tab.addEventListener('click', () => showSlide(Number(tab.dataset.slideTarget)));
});

previousButton.addEventListener('click', () => showSlide(currentSlide - 1));
nextButton.addEventListener('click', () => showSlide(currentSlide + 1));

document.addEventListener('keydown', (event) => {
  if (event.target.closest('button, a, input, select, textarea')) return;
  if (event.key === 'ArrowLeft') showSlide(currentSlide - 1);
  if (event.key === 'ArrowRight') showSlide(currentSlide + 1);
  if (event.key === 'Home') showSlide(0);
  if (event.key === 'End') showSlide(slides.length - 1);
});

stage.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

stage.addEventListener('touchend', (event) => {
  if (touchStartX === null) return;
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 60) showSlide(currentSlide + (distance < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

window.addEventListener('hashchange', () => showSlide(getSlideFromHash(), false));
showSlide(getSlideFromHash(), false);