import { data } from "./dummyData.js";

// ----------GLOBAL VARIABLES----------- //

// Convert integer speed (1-10) to a usable pixel value (0.2 to 2)
const rawSpeed = parseInt(data.config.slider1) || 4; // default to 4 if not provided
const speed_of_carousel = rawSpeed / 5; // This will convert speed 1-10 to 0.2-2 pixels per frame

let position = 0;
let animationFrameId = null;
let isPaused = false;
let listSponsors = [];

// Drag related variables
let isDragging = false;
let startPosition = 0;
let startX = 0;
let currentX = 0;

const itemsDesktop = data.config.itemsDesktop ?? 6;
const itemsTablet = data.config.itemsTablet ?? 4;
const itemsMobile = data.config.itemsMobile ?? 3;

const desktopImageHeight = data.config.desktopImageHeight ?? 60;
const tabletImageHeight = data.config.tabletImageHeight ?? 60;
const mobileImageHeight = data.config.mobileImageHeight ?? 60;

// ----------FUNCTIONS----------- //

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function createSponsorElement(sponsor) {
  const item = document.createElement("div");
  item.className = "item";
  item.draggable = false; // Prevent default drag behavior

  const link = document.createElement("a");
  link.href = sponsor.url;
  link.target = "_blank";
  link.title = sponsor.title;
  link.draggable = false; // Prevent default drag behavior

  const img = document.createElement("img");
  img.src = sponsor.image;
  img.alt = `${sponsor.title} logo`;
  img.draggable = false; // Prevent default drag behavior

  link.appendChild(img);
  item.appendChild(link);

  return item;
}

function updateResponsiveLayout() {
  const carouselWrap = document.querySelector(".sponsors-carousel-wrap");
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

  // Set CSS variables for responsive layout
  carouselWrap.style.setProperty("--items-to-show", itemsToShow);
  carouselWrap.style.setProperty("--image-height", `${imageHeight}px`);

  return itemsToShow;
}

// Drag functionality
function touchStart(event, carouselInner) {
  stopAnimation();
  isPaused = true;
  startX = event.type.includes("mouse")
    ? event.pageX
    : event.touches[0].clientX;
  isDragging = true;
  startPosition = position;
}

function touchMove(event, carouselInner) {
  if (!isDragging) return;

  currentX = event.type.includes("mouse")
    ? event.pageX
    : event.touches[0].clientX;
  const diff = currentX - startX;
  position = startPosition + diff;

  // Apply the transform
  carouselInner.style.transform = `translateX(${position}px)`;
}

function touchEnd(event, carouselInner, carouselItems) {
  if (!isDragging) return;

  isDragging = false;
  isPaused = false;

  // Calculate the width of the first set of items
  const firstSetWidth = Array.from(carouselItems).reduce(
    (width, item) => width + item.offsetWidth + 15,
    0
  );

  // Reset position if dragged too far
  if (Math.abs(position) >= firstSetWidth) {
    position = 0;
  } else if (position > 0) {
    position = 0;
  }

  // Resume animation
  animate(carouselInner, carouselItems);
}

function setupDragListeners(carouselInner, carouselItems) {
  // Mouse events
  carouselInner.addEventListener("mousedown", (e) => {
    e.preventDefault(); // Prevent text selection
    touchStart(e, carouselInner);
  });

  window.addEventListener("mousemove", (e) => {
    e.preventDefault();
    touchMove(e, carouselInner);
  });

  window.addEventListener("mouseup", (e) => {
    touchEnd(e, carouselInner, carouselItems);
  });

  // Touch events
  carouselInner.addEventListener("touchstart", (e) => {
    touchStart(e, carouselInner);
  });

  carouselInner.addEventListener("touchmove", (e) => {
    touchMove(e, carouselInner);
  });

  carouselInner.addEventListener("touchend", (e) => {
    touchEnd(e, carouselInner, carouselItems);
  });

  // Handle mouse leave
  window.addEventListener("mouseleave", () => {
    if (isDragging) {
      touchEnd(null, carouselInner, carouselItems);
    }
  });
}

function fetchSponsors() {
  const carouselInner = document.querySelector(
    ".sponsors-carousel-wrap .sponsors-carousel-inner"
  );

  if (!carouselInner) {
    setTimeout(fetchSponsors, 50);
    return;
  }

  // Clear existing content
  carouselInner.innerHTML = "";

  // Get sponsors data
  listSponsors = data.config.list1;

  // Append sponsors
  listSponsors.forEach((sponsor) => {
    const sponsorElement = createSponsorElement(sponsor);
    carouselInner.appendChild(sponsorElement);
  });

  // Get fresh items after appending
  const carouselItems = carouselInner.querySelectorAll(".item");

  // Clone items for infinite scroll effect
  carouselItems.forEach((item) => {
    const clone = item.cloneNode(true);
    carouselInner.appendChild(clone);
  });

  // Add event listeners
  carouselInner.addEventListener("mouseenter", () => {
    stopAnimation();
    isPaused = true;
  });

  carouselInner.addEventListener("mouseleave", () => {
    if (!isDragging) {
      isPaused = false;
      animate(carouselInner, carouselItems);
    }
  });

  // Setup drag functionality
  setupDragListeners(carouselInner, carouselItems);

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    stopAnimation();
  });

  // Set up responsive layout
  updateResponsiveLayout();

  // Add resize listener for responsive updates
  window.addEventListener("resize", () => {
    updateResponsiveLayout();
    // Reset position to prevent layout issues
    position = 0;
    carouselInner.style.transform = `translateX(${position}px)`;
  });

  // Start animation
  animate(carouselInner, carouselItems);
}

function animate(carouselInner, carouselItems) {
  // Stop any existing animation before starting a new one
  stopAnimation();

  if (!isPaused && !isDragging) {
    position -= speed_of_carousel;

    // Reset position when first set of items has scrolled past
    const firstSetWidth = Array.from(carouselItems).reduce(
      (width, item) => width + item.offsetWidth + 15,
      0
    );
    if (Math.abs(position) >= firstSetWidth) {
      position = 0;
    }

    carouselInner.style.transform = `translateX(${position}px)`;
  }

  // Only request new frame if not paused and not dragging
  if (!isPaused && !isDragging) {
    animationFrameId = requestAnimationFrame(() =>
      animate(carouselInner, carouselItems)
    );
  }
}

// -----------INITIALIZE----------- //
fetchSponsors();
