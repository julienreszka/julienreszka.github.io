      // Shared function to collect current diagram data with all properties
      function collectDiagramData() {
        if (!cy || cy.nodes().length === 0) {
          return null;
        }

        const nodes = cy.nodes().map((node) => ({
          id: node.data("id"),
          label: node.data("label"),
          type: node.data("type") || "action", // Include node type for styling
        }));

        const edges = cy.edges().map((edge) => ({
          source: edge.source().data("id"),
          target: edge.target().data("id"),
          type: edge.data("type") || edge.data("relationship") || "leads_to", // Include edge type
          relationship:
            edge.data("relationship") || edge.data("type") || "leads_to",
          polarity: edge.data("polarity"), // Keep for backwards compatibility
          description: edge.data("description") || "",
        }));

        const startingPoint = document
          .getElementById("startingPoint")
          .value.trim();
        const destinations = getDestinations();
        const currentJourney =
          startingPoint && destinations.length > 0
            ? `${startingPoint} → ${destinations.join(" → ")}`
            : "Unnamed Journey";

        return {
          nodes,
          edges,
          journey: currentJourney,
          startingPoint,
          destinations,
          destination: destinations[0] || "", // Keep for backwards compatibility
        };
      }

      // Unicode-safe base64 encoding
      function unicodeBase64Encode(str) {
        try {
          // First encode to UTF-8, then to base64
          return btoa(
            encodeURIComponent(str).replace(
              /%([0-9A-F]{2})/g,
              function (match, p1) {
                return String.fromCharCode(parseInt(p1, 16));
              }
            )
          );
        } catch (error) {
          // Fallback: use URL encoding if base64 fails
          return encodeURIComponent(str);
        }
      }

      // Unicode-safe base64 decoding
      function unicodeBase64Decode(str) {
        try {
          // First decode from base64, then from UTF-8
          return decodeURIComponent(
            Array.prototype.map
              .call(atob(str), function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          );
        } catch (error) {
          // Fallback: assume it's URL encoded
          return decodeURIComponent(str);
        }
      }

      // Copy complete app link with API keys AND current journey path
      document
        .getElementById("copyAppLinkWithGraph")
        .addEventListener("click", () => {
          // Check if there's a current diagram
          if (!cy || cy.nodes().length === 0) {
            closeSettingsModal();
            showError(
              "Please generate a diagram first before sharing complete app link"
            );
            setTimeout(hideError, 3000);
            return;
          }

          try {
            const diagramData = collectDiagramData();
            if (!diagramData) {
              closeSettingsModal();
              showError("Please generate a diagram first before sharing");
              setTimeout(hideError, 3000);
              return;
            }

            const currentGroqKey = document
              .getElementById("groqApiKey")
              .value.trim();
            const currentGrokKey = document
              .getElementById("grokApiKey")
              .value.trim();
            const selectedProvider = document.querySelector(
              'input[name="provider"]:checked'
            ).value;

            // Get current URL without query params
            const baseUrl = window.location.origin + window.location.pathname;

            // Build query params with both API keys and graph data
            const params = new URLSearchParams();
            params.set("provider", selectedProvider);

            if (currentGroqKey) {
              params.set("groqKey", currentGroqKey);
            }

            if (currentGrokKey) {
              params.set("grokKey", currentGrokKey);
            }

            // Encode diagram data as base64 (Unicode-safe)
            const encodedData = unicodeBase64Encode(
              JSON.stringify(diagramData)
            );
            params.set("data", encodedData);

            const shareableUrl = `${baseUrl}?${params.toString()}`;

            // Copy to clipboard
            navigator.clipboard
              .writeText(shareableUrl)
              .then(() => {
                // Close modal temporarily to show toast
                closeSettingsModal();
                showSuccess(
                  "Complete app link with settings and journey copied! 📋🗺️"
                );
              })
              .catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = shareableUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                // Close modal temporarily to show toast
                closeSettingsModal();
                showSuccess("Complete app link copied to clipboard! 🔗📊");
              });
          } catch (error) {
            closeSettingsModal();
            showError(`Failed to create complete app link: ${error.message}`);
            setTimeout(hideError, 3000);
          }
        });

      // Share diagram by encoding data in URL (path data only, no API keys)
      function shareDiagram() {
        if (!cy || cy.nodes().length === 0) {
          showError("Please generate a diagram first before sharing");
          return;
        }

        try {
          // Collect current diagram data only (no API keys)
          const diagramData = collectDiagramData();
          if (!diagramData) {
            showError("No diagram data to share");
            return;
          }

          // Encode data as base64 to make URL cleaner (Unicode-safe)
          const encodedData = unicodeBase64Encode(JSON.stringify(diagramData));

          // Get current URL without query params
          const baseUrl = window.location.origin + window.location.pathname;

          // Build shareable URL with only diagram data
          const shareUrl = `${baseUrl}?data=${encodedData}`;

          // Copy to clipboard
          navigator.clipboard
            .writeText(shareUrl)
            .then(() => {
              showSuccess("Journey path copied to clipboard! 🗺️");
            })
            .catch(() => {
              // Fallback for older browsers
              const textArea = document.createElement("textarea");
              textArea.value = shareUrl;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand("copy");
              document.body.removeChild(textArea);
              showSuccess("Journey path copied to clipboard! 🗺️");
            });
        } catch (error) {
          showError(`Failed to create share link: ${error.message}`);
        }
      }

      // Parse shared diagram data from URL
      function parseSharedDiagram() {
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get("data");

        if (dataParam) {
          try {
            // Decode the base64 data (Unicode-safe)
            const decodedData = JSON.parse(unicodeBase64Decode(dataParam));

            if (
              decodedData.nodes &&
              decodedData.edges &&
              (decodedData.journey ||
                (decodedData.startingPoint && decodedData.destination))
            ) {
              // Store the data to be loaded after Cytoscape is initialized
              window.sharedDiagramData = decodedData;
              return true;
            }
          } catch (error) {
            console.error("Failed to parse shared diagram:", error);
            showError("Invalid shared diagram link");
            setTimeout(hideError, 3000);
          }
        }

        return false;
      }

      // Load shared diagram after Cytoscape is initialized
      function loadSharedDiagram() {
        if (window.sharedDiagramData && cy) {
          const decodedData = window.sharedDiagramData;

          // Set the journey inputs
          if (decodedData.startingPoint) {
            document.getElementById("startingPoint").value =
              decodedData.startingPoint;
          }
          if (decodedData.destinations && decodedData.destinations.length > 0) {
            // Handle multiple destinations
            decodedData.destinations.forEach((destination, index) => {
              if (index === 0) {
                // Set first destination
                document.querySelector(".destination-input").value =
                  destination;
              } else {
                // Add additional destinations
                addDestination();
                const destinationInputs =
                  document.querySelectorAll(".destination-input");
                destinationInputs[destinationInputs.length - 1].value =
                  destination;
              }
            });
          } else if (decodedData.destination) {
            // Legacy single destination support
            document.querySelector(".destination-input").value =
              decodedData.destination;
          }

          // Render the diagram
          renderDiagram(decodedData);

          // Show journey in help modal
          if (decodedData.startingPoint && decodedData.destination) {
            showJourney(decodedData.startingPoint, decodedData.destination);
          }

          // Show success message
          setTimeout(() => {
            showSuccess("Shared journey loaded! 🗺️");
          }, 500);

          // Clear the stored data
          delete window.sharedDiagramData;
        }
      }

