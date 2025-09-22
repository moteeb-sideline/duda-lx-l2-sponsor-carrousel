import { data } from "./dummyData.js";

// ----------GLOBAL VARIABLES----------- //

const elementId = data.elementId;

// Convert integer speed (1-10) to a usable pixel value (0.2 to 2)
const rawSpeed = parseInt(data.config.slider1) || 4; // default to 4 if not provided
const speed_of_carousel = rawSpeed / 5; // This will convert speed 1-10 to 0.2-2 pixels per frame

const itemsDesktop = data.config.itemsDesktop ?? 6;
const itemsTablet = data.config.itemsTablet ?? 4;
const itemsMobile = data.config.itemsMobile ?? 3;

const desktopImageHeight = data.config.desktopImageHeight ?? 60;
const tabletImageHeight = data.config.tabletImageHeight ?? 60;
const mobileImageHeight = data.config.mobileImageHeight ?? 60;

// ----------CAROUSEL CLASS----------- //

class Carousel {
  constructor(elementId) {
    this.elementId = elementId;
    this.position = 0;
    this.animationFrameId = null;
    this.isPaused = false;
    this.isDragging = false;
    this.startPosition = 0;
    this.startX = 0;
    this.currentX = 0;

    // Get carousel elements
    const container = document.getElementById(elementId);
    if (!container) return;

    this.carouselInner = container.querySelector(".sponsors-carousel-inner");
    if (!this.carouselInner) return;

    this.init();
  }

  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  touchStart(event) {
    this.stopAnimation();
    this.isPaused = true;
    this.startX = event.type.includes("mouse")
      ? event.pageX
      : event.touches[0].clientX;
    this.isDragging = true;
    this.startPosition = this.position;
  }

  touchMove(event) {
    if (!this.isDragging) return;

    this.currentX = event.type.includes("mouse")
      ? event.pageX
      : event.touches[0].clientX;
    const diff = this.currentX - this.startX;
    this.position = this.startPosition + diff;

    // Apply the transform
    this.carouselInner.style.transform = `translateX(${this.position}px)`;
  }

  touchEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.isPaused = false;

    // Calculate the width of the first set of items
    const firstSetWidth = Array.from(this.items).reduce(
      (width, item) => width + item.offsetWidth + 15,
      0
    );

    // Reset position if dragged too far
    if (Math.abs(this.position) >= firstSetWidth) {
      this.position = 0;
    } else if (this.position > 0) {
      this.position = 0;
    }

    // Resume animation
    this.animate();
  }

  setupDragListeners() {
    // Mouse events
    this.carouselInner.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.touchStart(e);
    });

    window.addEventListener("mousemove", (e) => {
      e.preventDefault();
      this.touchMove(e);
    });

    window.addEventListener("mouseup", () => {
      this.touchEnd();
    });

    // Touch events
    this.carouselInner.addEventListener("touchstart", (e) => {
      this.touchStart(e);
    });

    this.carouselInner.addEventListener("touchmove", (e) => {
      this.touchMove(e);
    });

    this.carouselInner.addEventListener("touchend", () => {
      this.touchEnd();
    });

    // Handle mouse leave
    window.addEventListener("mouseleave", () => {
      if (this.isDragging) {
        this.touchEnd();
      }
    });
  }

  updateResponsiveLayout() {
    const carouselWrap = document
      .getElementById(this.elementId)
      .querySelector(".sponsors-carousel-wrap");
    if (!carouselWrap) return;

    const windowWidth = window.innerWidth;
    let itemsToShow, imageHeight;

    if (windowWidth >= 1000) {
      itemsToShow = itemsDesktop;
      imageHeight = desktopImageHeight;
    } else if (windowWidth >= 600) {
      itemsToShow = itemsTablet;
      imageHeight = tabletImageHeight;
    } else {
      itemsToShow = itemsMobile;
      imageHeight = mobileImageHeight;
    }

    carouselWrap.style.setProperty("--items-to-show", itemsToShow);
    carouselWrap.style.setProperty("--image-height", `${imageHeight}px`);
  }

  animate() {
    this.stopAnimation();

    if (!this.isPaused && !this.isDragging) {
      this.position -= speed_of_carousel;

      // Reset position when first set of items has scrolled past
      const firstSetWidth = Array.from(this.items).reduce(
        (width, item) => width + item.offsetWidth + 15,
        0
      );
      if (Math.abs(this.position) >= firstSetWidth) {
        this.position = 0;
      }

      this.carouselInner.style.transform = `translateX(${this.position}px)`;
    }

    if (!this.isPaused && !this.isDragging) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  init() {
    // Clear existing content
    this.carouselInner.innerHTML = "";

    // Append sponsors
    data.config.list1.forEach((sponsor) => {
      const sponsorElement = createSponsorElement(sponsor);
      this.carouselInner.appendChild(sponsorElement);
    });

    // Get fresh items after appending
    this.items = this.carouselInner.querySelectorAll(".item");

    // Clone items for infinite scroll effect
    this.items.forEach((item) => {
      const clone = item.cloneNode(true);
      this.carouselInner.appendChild(clone);
    });

    // Add event listeners
    this.carouselInner.addEventListener("mouseenter", () => {
      this.stopAnimation();
      this.isPaused = true;
    });

    this.carouselInner.addEventListener("mouseleave", () => {
      if (!this.isDragging) {
        this.isPaused = false;
        this.animate();
      }
    });

    // Setup drag functionality
    this.setupDragListeners();

    // Set up responsive layout
    this.updateResponsiveLayout();

    // Add resize listener
    window.addEventListener("resize", () => {
      this.updateResponsiveLayout();
      this.position = 0;
      this.carouselInner.style.transform = `translateX(${this.position}px)`;
    });

    // Start animation
    this.animate();
  }
}

// ----------HELPER FUNCTIONS----------- //

function createSponsorElement(sponsor) {
  const item = document.createElement("div");
  item.className = "item";
  item.draggable = false;

  const link = document.createElement("a");
  link.href = sponsor.url;
  link.target = "_blank";
  link.title = sponsor.title;
  link.draggable = false;

  const img = document.createElement("img");
  img.src = sponsor.image;
  img.alt = `${sponsor.title} logo`;
  img.draggable = false;

  link.appendChild(img);
  item.appendChild(link);

  return item;
}

// ----------INITIALIZE----------- //

// Initialize carousel for the specified element ID
if (elementId) {
  new Carousel(elementId);
}
