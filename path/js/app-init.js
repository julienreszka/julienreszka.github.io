// Parse URL parameters on load
function parseUrlParams() {
  // First check for shared diagram data
  const hasSharedDiagram = parseSharedDiagram();

  // Then parse other URL parameters (API keys, provider)
  const urlParams = new URLSearchParams(window.location.search);

  const providerParam = urlParams.get("provider");
  const groqKeyParam = urlParams.get("groqKey");
  const grokKeyParam = urlParams.get("grokKey");

  // Update settings if parameters are present
  if (
    providerParam &&
    ["groq", "grok", "grok-fast"].includes(providerParam)
  ) {
    currentProvider = providerParam;
    localStorage.setItem("aiProvider", currentProvider);
  }

  if (groqKeyParam) {
    groqApiKey = groqKeyParam;
    localStorage.setItem("groqApiKey", groqApiKey);
  }

  if (grokKeyParam) {
    grokApiKey = grokKeyParam;
    localStorage.setItem("grokApiKey", grokApiKey);
  }

  // Show success message if any parameters were loaded (but not if shared diagram was loaded)
  if (
    !hasSharedDiagram &&
    (providerParam || groqKeyParam || grokKeyParam)
  ) {
    setTimeout(() => {
      showSuccess("Settings loaded from URL! 🔗");
    }, 1000);
  }
}

// Check if device is mobile
function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialize application
window.addEventListener("load", () => {
  // Parse URL parameters first
  parseUrlParams();

  // Wait for all libraries to load
  setTimeout(() => {
    initializeCytoscape();

    // Initialize destination management
    document
      .getElementById("addDestinationBtn")
      .addEventListener("click", addDestination);

    // Initialize drag and drop for existing destinations
    initializeDestinationDragAndDrop();

    // Load shared diagram after Cytoscape is initialized
    loadSharedDiagram();

    // Auto-open drawer on mobile devices
    if (isMobileDevice()) {
      openDrawer();
    }

    // Listen for theme changes and update Cytoscape
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      if (cy) {
        // Reinitialize Cytoscape with new theme colors
        setTimeout(() => {
          const currentElements = cy.elements().jsons();
          cy.destroy();
          initializeCytoscape();
          if (currentElements.length > 0) {
            cy.add(currentElements);
            const layoutOptions = getLayoutOptions(cy.nodes().length);
            cy.layout(layoutOptions).run();
          }
        }, 100);
      }
    });
  }, 100);
});
