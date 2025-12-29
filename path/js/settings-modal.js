      // Settings modal functionality
      function openSettingsModal() {
        // Load current settings
        const providerRadio = document.querySelector(
          `input[name="provider"][value="${currentProvider}"]`
        );
        if (providerRadio) {
          providerRadio.checked = true;
        }

        // Handle layout selection with fallback for invalid values
        const validLayouts = ["auto", "cose", "dagre"];
        const layoutToUse = validLayouts.includes(currentLayout)
          ? currentLayout
          : "auto";
        const layoutRadio = document.querySelector(
          `input[name="layout"][value="${layoutToUse}"]`
        );
        if (layoutRadio) {
          layoutRadio.checked = true;
        }

        // Update currentLayout if it was invalid
        if (!validLayouts.includes(currentLayout)) {
          currentLayout = "auto";
          localStorage.setItem("graphLayout", currentLayout);
        }

        document.getElementById("groqApiKey").value = groqApiKey;
        document.getElementById("grokApiKey").value = grokApiKey;

        // Show appropriate API key section
        toggleApiKeySection();

        // Open modal
        document.getElementById("settingsModal").showModal();
        document.body.style.overflow = "hidden";
      }

      function toggleApiKeySection() {
        const selectedProvider = document.querySelector(
          'input[name="provider"]:checked'
        ).value;
        document.getElementById("groqKeySection").style.display =
          selectedProvider === "groq" ? "block" : "none";
        document.getElementById("grokKeySection").style.display =
          selectedProvider === "grok" || selectedProvider === "grok-fast"
            ? "block"
            : "none";
      }

      function closeSettingsModal() {
        document.getElementById("settingsModal").close();
        document.body.style.overflow = "auto";
      }

      // Settings modal event listeners
      document
        .getElementById("closeSettingsModal")
        .addEventListener("click", closeSettingsModal);

      document
        .getElementById("settingsModal")
        .addEventListener("click", (e) => {
          if (e.target === document.getElementById("settingsModal")) {
            closeSettingsModal();
          }
        });

      // Provider radio buttons
      document.querySelectorAll('input[name="provider"]').forEach((radio) => {
        radio.addEventListener("change", toggleApiKeySection);
      });

      // API key toggle buttons
      document.getElementById("toggleGroqKey").addEventListener("click", () => {
        const input = document.getElementById("groqApiKey");
        const button = document.getElementById("toggleGroqKey");
        if (input.type === "password") {
          input.type = "text";
          button.textContent = "🙈";
        } else {
          input.type = "password";
          button.textContent = "👁️";
        }
      });

      document.getElementById("toggleGrokKey").addEventListener("click", () => {
        const input = document.getElementById("grokApiKey");
        const button = document.getElementById("toggleGrokKey");
        if (input.type === "password") {
          input.type = "text";
          button.textContent = "🙈";
        } else {
          input.type = "password";
          button.textContent = "👁️";
        }
      });

      // Save settings
      document.getElementById("saveSettings").addEventListener("click", () => {
        const selectedProvider = document.querySelector(
          'input[name="provider"]:checked'
        ).value;
        const selectedLayout = document.querySelector(
          'input[name="layout"]:checked'
        ).value;
        const newGroqKey = document.getElementById("groqApiKey").value.trim();
        const newGrokKey = document.getElementById("grokApiKey").value.trim();

        // Update global variables
        currentProvider = selectedProvider;
        currentLayout = selectedLayout;
        groqApiKey = newGroqKey;
        grokApiKey = newGrokKey;

        // Save to localStorage
        localStorage.setItem("aiProvider", currentProvider);
        localStorage.setItem("graphLayout", currentLayout);
        localStorage.setItem("groqApiKey", groqApiKey);
        localStorage.setItem("grokApiKey", grokApiKey);

        closeSettingsModal();
        hideError();

        // Re-apply layout if there's an existing graph
        if (cy && cy.nodes().length > 0) {
          const layoutOptions = getLayoutOptions(cy.nodes().length);
          cy.layout(layoutOptions).run();
          showSuccess("Layout updated! Settings saved successfully!");
        } else {
          // Show success message
          showSuccess("Settings saved successfully!");
        }
      });

      // Copy app link with API keys
      document.getElementById("copyAppLink").addEventListener("click", () => {
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

        // Build query params
        const params = new URLSearchParams();
        params.set("provider", selectedProvider);

        if (currentGroqKey) {
          params.set("groqKey", currentGroqKey);
        }

        if (currentGrokKey) {
          params.set("grokKey", currentGrokKey);
        }

        const shareableUrl = `${baseUrl}?${params.toString()}`;

        // Copy to clipboard
        navigator.clipboard
          .writeText(shareableUrl)
          .then(() => {
            // Close modal temporarily to show toast
            closeSettingsModal();
            showSuccess("App link copied to clipboard! 📋");
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
            showSuccess("App link copied to clipboard! 📋");
          });
      });

