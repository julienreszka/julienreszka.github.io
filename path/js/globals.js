      // Global variables
      let cy;
      let currentProvider = localStorage.getItem("aiProvider") || "groq";
      let groqApiKey = localStorage.getItem("groqApiKey") || "";
      let grokApiKey = localStorage.getItem("grokApiKey") || "";
      let currentLayout = localStorage.getItem("graphLayout") || "auto";

      // Touch/tap detection variables for mobile double-tap
      let lastTapTime = 0;
      let lastTapTarget = null;
      const DOUBLE_TAP_DELAY = 300; // ms

      // Desktop click detection variables
      let lastClickTime = 0;
      let lastClickTarget = null;
      const DOUBLE_CLICK_DELAY = 300; // ms

      // Check if device is mobile/touch-capable
      function isMobileDevice() {
        return "ontouchstart" in window || navigator.maxTouchPoints > 0;
      }

      // Initialize Cytoscape
      function initializeCytoscape() {
        try {
          if (typeof cytoscape === "undefined") {
            showError("Cytoscape library not loaded. Please refresh the page.");
            return;
          }

          // Register the dagre extension if available
          if (
            typeof cytoscape !== "undefined" &&
            typeof dagre !== "undefined" &&
            cytoscape.use
          ) {
            try {
              // Check if dagre extension is available and register it
              if (
                window.cytoscapeDagre &&
                typeof window.cytoscapeDagre === "function"
              ) {
                cytoscape.use(window.cytoscapeDagre);
              }
            } catch (error) {
              console.warn("Could not register dagre extension:", error);
            }
          }

          cy = cytoscape({
