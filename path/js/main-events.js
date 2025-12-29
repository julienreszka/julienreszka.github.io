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

