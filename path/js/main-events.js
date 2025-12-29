// Event listeners
document.getElementById("generateBtn").addEventListener("click", () => {
  const startingPoint = document
    .getElementById("startingPoint")
    .value.trim();
  const destinations = getDestinations();

  if (!startingPoint && destinations.length === 0) {
    // If both are empty, show journey discovery modal
    showJourneyDiscoveryDialog();
    return;
  }
  if (!startingPoint && destinations.length > 0) {
    // If no starting point but has destinations, suggest starting points
    suggestStartingPoints(destinations[0]);
    return;
  }
  if (destinations.length === 0 && startingPoint) {
    // If no destinations but has starting point, suggest goals
    suggestGoals(startingPoint);
    return;
  }

  generateDiagram(startingPoint, destinations);
});

document.getElementById("settingsBtn").addEventListener("click", () => {
  openSettingsModal();
});

document.getElementById("shareBtn").addEventListener("click", () => {
  shareDiagram();
});

// Mobile drawer toggle functionality
document.getElementById("drawerToggle").addEventListener("click", () => {
  toggleDrawer();
});

document.getElementById("drawerOverlay").addEventListener("click", () => {
  closeDrawer();
});

// Close drawer on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isDrawerOpen()) {
    closeDrawer();
  }
});

function toggleDrawer() {
  const drawer = document.getElementById("appDrawer");
  const overlay = document.getElementById("drawerOverlay");

  if (drawer.classList.contains("open")) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

function openDrawer() {
  const drawer = document.getElementById("appDrawer");
  const overlay = document.getElementById("drawerOverlay");

  drawer.classList.add("open");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

function closeDrawer() {
  const drawer = document.getElementById("appDrawer");
  const overlay = document.getElementById("drawerOverlay");

  drawer.classList.remove("open");
  overlay.classList.remove("active");
  document.body.style.overflow = "auto"; // Restore scrolling
}

function isDrawerOpen() {
  return document.getElementById("appDrawer").classList.contains("open");
}

