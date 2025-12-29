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
            container: document.getElementById("cy"),

            style: [
              {
                selector: "node",
                style: {
                  "background-color": getComputedStyle(document.documentElement)
                    .getPropertyValue("--node-bg")
                    .trim(),
                  label: "data(label)",
                  color: getComputedStyle(document.documentElement)
                    .getPropertyValue("--node-text")
                    .trim(),
                  "text-valign": "center",
                  "text-halign": "center",
                  "font-size": "12px",
                  "font-weight": "bold",
                  width: "80px",
                  height: "80px",
                  "text-wrap": "wrap",
                  "text-max-width": "70px",
                  "border-width": 2,
                  "border-color": getComputedStyle(document.documentElement)
                    .getPropertyValue("--node-border")
                    .trim(),
                },
              },
              {
                selector: 'node[type = "start"]',
                style: {
                  "background-color": "#2ecc71",
                  "border-color": "#27ae60",
                  shape: "round-octagon",
                  width: "90px",
                  height: "90px",
                },
              },
              {
                selector: 'node[type = "goal"]',
                style: {
                  "background-color": "#f39c12",
                  "border-color": "#e67e22",
                  shape: "star",
                  width: "90px",
                  height: "90px",
                },
              },
              {
                selector: 'node[type = "milestone"]',
                style: {
                  "background-color": "#9b59b6",
                  "border-color": "#8e44ad",
                  shape: "diamond",
                  width: "85px",
                  height: "85px",
                },
              },
              {
                selector: 'node[type = "action"]',
                style: {
                  "background-color": "#3498db",
                  "border-color": "#2980b9",
                  shape: "round-rectangle",
                  width: "80px",
                  height: "80px",
                },
              },
              {
                selector: 'node[type = "resource"]',
                style: {
                  "background-color": "#f39c12",
                  "border-color": "#e67e22",
                  shape: "hexagon",
                  width: "75px",
                  height: "75px",
                },
              },
              {
                selector: "edge",
                style: {
                  width: 3,
                  "line-color": getComputedStyle(document.documentElement)
                    .getPropertyValue("--border-focus")
                    .trim(),
                  "target-arrow-color": getComputedStyle(
                    document.documentElement
                  )
                    .getPropertyValue("--border-focus")
                    .trim(),
                  "target-arrow-shape": "triangle",
                  "curve-style": "bezier",
                  "control-point-step-size": 60,
                  "control-point-weights": [0.25, 0.75],
                  "edge-distances": "node-position",
                  label: "",
                  "font-size": "14px",
                  "font-weight": "bold",
                  "text-background-color": getComputedStyle(
                    document.documentElement
                  )
                    .getPropertyValue("--surface-color")
                    .trim(),
                  "text-background-opacity": 0.9,
                  "text-background-padding": "3px",
                  color: getComputedStyle(document.documentElement)
                    .getPropertyValue("--text-primary")
                    .trim(),
                },
              },
              {
                selector: 'edge[type = "leads_to"]',
                style: {
                  "line-color": "#3498db",
                  "target-arrow-color": "#3498db",
                  "line-style": "solid",
                },
              },
              {
                selector: 'edge[type = "achieves"]',
                style: {
                  "line-color": "#27ae60",
                  "target-arrow-color": "#27ae60",
                  "line-style": "solid",
                },
              },
              {
                selector: 'edge[type = "requires"]',
                style: {
                  "line-color": "#e74c3c",
                  "target-arrow-color": "#e74c3c",
                  "line-style": "dashed",
                },
              },
            ],

            layout: {
              name: "cose",
              padding: 50,
              nodeOverlap: 20,
              idealEdgeLength: 100,
              nodeRepulsion: 8000,
            },
          });

          // Add universal tap/click handlers for both desktop and mobile
          cy.on("tap", "node", function (evt) {
            handleNodeTap(evt);
          });

          cy.on("tap", function (evt) {
            // Check if the target is the background (not a node or edge)
            if (evt.target === cy) {
              handleBackgroundTap(evt);
            }
          });

          // Add click handler for edges to explain relationships
          cy.on("tap", "edge", function (evt) {
            const edge = evt.target;
            explainRelationship(edge);
          });

          // Note: Desktop double-click is now handled in handleNodeTap function

          // Keep double-click for desktop compatibility
          cy.on("dblclick", function (evt) {
            // Check if the target is the background (not a node or edge)
            if (evt.target === cy) {
              // Check if we have an existing diagram
              if (cy.nodes().length === 0) {
                showError(
                  "Please generate a diagram first before adding topics"
                );
                return;
              }

              // Prompt for new topic
              promptForNewTopic();
            }
          });
        } catch (error) {
          showError(`Failed to initialize graph: ${error.message}`);
        }
      }

