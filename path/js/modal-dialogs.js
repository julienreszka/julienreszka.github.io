      // Show success message function
      function showSuccess(message) {
        const successDiv = document.createElement("div");
        successDiv.textContent = message;
        successDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #27ae60;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 1.75rem;
          z-index: 2147483647;
          font-weight: 500;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
          successDiv.remove();
        }, 3000);
      }

      // Add Enter key support for input fields
      document
        .getElementById("startingPoint")
        .addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            const firstDestinationInput =
              document.querySelector(".destination-input");
            if (firstDestinationInput) {
              firstDestinationInput.focus();
            }
          }
        });

      // Add Enter key support for destination inputs (delegated event)
      document.addEventListener("keypress", (e) => {
        if (
          e.target.classList.contains("destination-input") &&
          e.key === "Enter"
        ) {
          const destinationInputs =
            document.querySelectorAll(".destination-input");
          const currentIndex = Array.from(destinationInputs).indexOf(e.target);

          // If this is the last destination input or if it has a value, trigger generation
          if (
            currentIndex === destinationInputs.length - 1 ||
            e.target.value.trim()
          ) {
            document.getElementById("generateBtn").click();
          }
        }
      });

      // Help modal functionality
      document.getElementById("helpBtn").addEventListener("click", () => {
        const modal = document.getElementById("helpModal");
        const startingPoint = document
          .getElementById("startingPoint")
          .value.trim();
        const destinations = getDestinations();

        // Sync current journey to modal if exists
        if (startingPoint && destinations.length > 0) {
          const journeyText = `${startingPoint} → ${destinations.join(" → ")}`;
          document.getElementById("modalCurrentJourney").textContent =
            journeyText;
          document.getElementById("modalJourneyDisplay").style.display =
            "block";
        } else {
          document.getElementById("modalJourneyDisplay").style.display = "none";
        }

        modal.showModal();
        document.body.style.overflow = "hidden";
      });

      // Close modal functionality
      document
        .getElementById("closeModal")
        .addEventListener("click", closeHelpModal);
      document.getElementById("helpModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("helpModal")) {
          closeHelpModal();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (document.getElementById("helpModal").open) {
            closeHelpModal();
          } else if (document.getElementById("settingsModal").open) {
            closeSettingsModal();
          } else if (document.getElementById("goalSuggestionDialog").open) {
            closeGoalSuggestionDialog();
          } else if (document.getElementById("startingSuggestionDialog").open) {
            closeStartingSuggestionDialog();
          } else if (document.getElementById("journeyDiscoveryDialog").open) {
            closeJourneyDiscoveryDialog();
          }
        }
      });

      // Goal suggestion dialog event listeners
      document
        .getElementById("useSelectedGoal")
        .addEventListener("click", () => {
          const selectedGoal = document.querySelector(
            'input[name="suggestedGoal"]:checked'
          );
          if (selectedGoal) {
            document.querySelector(".destination-input").value =
              selectedGoal.value;
            closeGoalSuggestionDialog();

            // Auto-generate the diagram
            const startingPoint = document
              .getElementById("startingPoint")
              .value.trim();
            generateDiagram(startingPoint, selectedGoal.value);
          }
        });

      document.getElementById("customGoalBtn").addEventListener("click", () => {
        closeGoalSuggestionDialog();
        // Focus on the destination input for custom entry
        setTimeout(() => {
          document.querySelector(".destination-input").focus();
        }, 100);
      });

      // Close goal suggestion dialog when clicking outside
      document
        .getElementById("goalSuggestionDialog")
        .addEventListener("click", (e) => {
          if (e.target === document.getElementById("goalSuggestionDialog")) {
            closeGoalSuggestionDialog();
          }
        });

      // Starting point suggestion dialog event listeners
      document
        .getElementById("useSelectedStarting")
        .addEventListener("click", () => {
          const selectedStarting = document.querySelector(
            'input[name="suggestedStarting"]:checked'
          );
          if (selectedStarting) {
            document.getElementById("startingPoint").value =
              selectedStarting.value;
            closeStartingSuggestionDialog();

            // Auto-generate the diagram
            const destinations = getDestinations();
            if (destinations.length > 0) {
              generateDiagram(selectedStarting.value, destinations);
            }
          }
        });

      document
        .getElementById("customStartingBtn")
        .addEventListener("click", () => {
          closeStartingSuggestionDialog();
          // Focus on the starting point input for custom entry
          setTimeout(() => {
            document.getElementById("startingPoint").focus();
          }, 100);
        });

      // Close starting point suggestion dialog when clicking outside
      document
        .getElementById("startingSuggestionDialog")
        .addEventListener("click", (e) => {
          if (
            e.target === document.getElementById("startingSuggestionDialog")
          ) {
            closeStartingSuggestionDialog();
          }
        });

      // Journey discovery dialog event listeners
      document
        .getElementById("useSelectedJourney")
        .addEventListener("click", () => {
          const selectedJourney = document.querySelector(
            'input[name="suggestedJourney"]:checked'
          );
          if (selectedJourney) {
            const startingPoint = selectedJourney.dataset.starting;
            const destination = selectedJourney.dataset.destination;

            document.getElementById("startingPoint").value = startingPoint;
            document.querySelector(".destination-input").value = destination;
            closeJourneyDiscoveryDialog();

            // Auto-generate the diagram
            generateDiagram(startingPoint, [destination]);
          }
        });

      document
        .getElementById("customJourneyBtn")
        .addEventListener("click", () => {
          closeJourneyDiscoveryDialog();
          // Focus on the starting point input for custom entry
          setTimeout(() => {
            document.getElementById("startingPoint").focus();
          }, 100);
        });

      // Close journey discovery dialog when clicking outside
      document
        .getElementById("journeyDiscoveryDialog")
        .addEventListener("click", (e) => {
          if (e.target === document.getElementById("journeyDiscoveryDialog")) {
            closeJourneyDiscoveryDialog();
          }
        });

      function closeHelpModal() {
        document.getElementById("helpModal").close();
        document.body.style.overflow = "auto";
      }

