      // Get API configuration based on selected provider
      function getApiConfig() {
        if (currentProvider === "groq") {
          return {
            url: "https://api.groq.com/openai/v1/chat/completions",
            key: groqApiKey,
            model: "llama-3.1-8b-instant",
          };
        } else if (currentProvider === "grok-fast") {
          return {
            url: "https://api.x.ai/v1/chat/completions",
            key: grokApiKey,
            model: "grok-4-1-fast",
          };
        } else {
          return {
            url: "https://api.x.ai/v1/chat/completions",
            key: grokApiKey,
            model: "grok-4",
          };
        }
      }

      // UI Helper functions
      function showLoading(show) {
        document.getElementById("loadingIndicator").style.display = show
          ? "block"
          : "none";
      }

      function showError(message) {
        const errorDiv = document.getElementById("errorDisplay");
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
      }

      function hideError() {
        document.getElementById("errorDisplay").style.display = "none";
      }

      function showInfo(message) {
        const errorDiv = document.getElementById("errorDisplay");
        errorDiv.textContent = message;
        errorDiv.style.background = "var(--info-bg)";
        errorDiv.style.color = "var(--border-focus)";
        errorDiv.style.borderLeft = "4px solid var(--border-focus)";
        errorDiv.style.display = "block";
      }

      function hideInfo() {
        const errorDiv = document.getElementById("errorDisplay");
        errorDiv.style.background = "var(--error-bg)";
        errorDiv.style.color = "var(--error-text)";
        errorDiv.style.borderLeft = "none";
        errorDiv.style.display = "none";
      }

      function showJourney(startingPoint, destinations) {
        // Update modal journey display
        const journeyText = Array.isArray(destinations)
          ? `${startingPoint} → ${destinations.join(" → ")}`
          : `${startingPoint} → ${destinations}`;
        document.getElementById("modalCurrentJourney").textContent =
          journeyText;
        document.getElementById("modalJourneyDisplay").style.display = "block";
      }

      // Prompt for new topic to add to existing diagram
      function promptForNewTopic() {
        const newTopic = prompt(
          "What topic would you like to add to this diagram?\n\nThis will generate new nodes and connect them to the existing diagram."
        );

        if (newTopic && newTopic.trim()) {
          expandGraphWithTopic(newTopic.trim());
        }
      }

      // Dialog management functions
      function showNodeDialog(nodeLabel, explanation) {
        document.getElementById(
          "nodeDialogTitle"
        ).textContent = `📊 ${nodeLabel}`;
        document.getElementById("nodeDialogContent").innerHTML =
          marked.parse(explanation);
        document.getElementById("nodeDialog").showModal();
      }

      function closeNodeDialog() {
        document.getElementById("nodeDialog").close();
      }

      function showRelationshipDialog(title, explanation) {
        document.getElementById("relationshipDialogTitle").textContent = title;
        document.getElementById("relationshipDialogContent").innerHTML =
          marked.parse(explanation);
        document.getElementById("relationshipDialog").showModal();
      }

      function closeRelationshipDialog() {
        document.getElementById("relationshipDialog").close();
      }

      // Goal suggestion dialog management
      function closeGoalSuggestionDialog() {
        document.getElementById("goalSuggestionDialog").close();
        document.body.style.overflow = "auto";
      }

      // Suggest goals based on starting point
      async function suggestGoals(startingPoint) {
        if (!(await ensureApiKey())) return;

        showLoading(true);
        hideError();

        const prompt = `Given the starting point "${startingPoint}", suggest 5-6 relevant improvement goals that someone might want to achieve.

        Return a JSON array of goal suggestions with this structure:
        [
            {"goal": "Specific improvement goal", "description": "Brief explanation of this goal"},
            {"goal": "Another goal", "description": "Brief explanation"}
        ]

        Rules:
        - Make goals specific, achievable, and relevant to "${startingPoint}"
        - Include both short-term and long-term improvement options
        - Vary the scope from small improvements to major transformations
        - Keep descriptions under 15 words
        - Focus on positive outcomes and growth
        
        Only return valid JSON array, no additional text.`;

        const apiConfig = getApiConfig();

        try {
          const response = await fetch(apiConfig.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiConfig.key}`,
            },
            body: JSON.stringify({
              model: apiConfig.model,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.8,
              max_tokens: 800,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const content = data.choices[0].message.content.trim();

          let goalSuggestions;
          try {
            const jsonString = content
              .replace(/```json\n?/, "")
              .replace(/```$/, "");
            goalSuggestions = JSON.parse(jsonString);
          } catch (parseError) {
            throw new Error(
              `Failed to parse goal suggestions: ${parseError.message}`
            );
          }

          showGoalSuggestionDialog(startingPoint, goalSuggestions);
        } catch (error) {
          showError(`Failed to suggest goals: ${error.message}`);
        } finally {
          showLoading(false);
        }
      }

      // Show goal suggestion dialog
      function showGoalSuggestionDialog(startingPoint, suggestions) {
        document.getElementById("goalSuggestionStartingPoint").textContent =
          startingPoint;

        const goalList = document.getElementById("goalSuggestionList");
        goalList.innerHTML = "";

        suggestions.forEach((suggestion, index) => {
          const goalOption = document.createElement("div");
          goalOption.className = "radio-option";
          goalOption.innerHTML = `
            <input type="radio" name="suggestedGoal" id="goal${index}" value="${suggestion.goal}">
            <label for="goal${index}" class="radio-label">
              <strong>${suggestion.goal}</strong>
              <small>${suggestion.description}</small>
            </label>
          `;
          goalList.appendChild(goalOption);
        });

        // Add event listeners to radio buttons
        document
          .querySelectorAll('input[name="suggestedGoal"]')
          .forEach((radio) => {
            radio.addEventListener("change", () => {
              document.getElementById("useSelectedGoal").disabled = false;
            });
          });

        document.getElementById("goalSuggestionDialog").showModal();
        document.body.style.overflow = "hidden";
      }

      // Starting point suggestion dialog management
      function closeStartingSuggestionDialog() {
        document.getElementById("startingSuggestionDialog").close();
        document.body.style.overflow = "auto";
      }

      // Suggest starting points based on destination goal
      async function suggestStartingPoints(destination) {
        if (!(await ensureApiKey())) return;

        showLoading(true);
        hideError();

        const prompt = `Given the destination goal "${destination}", suggest 5-6 relevant starting points that someone might be coming from to reach this goal.

        Return a JSON array of starting point suggestions with this structure:
        [
            {"starting": "Specific starting situation", "description": "Brief explanation of this starting point"},
            {"starting": "Another starting point", "description": "Brief explanation"}
        ]

        Rules:
        - Make starting points realistic and relatable to "${destination}"
        - Include both beginner and intermediate starting situations
        - Vary the scope from complete novice to partial progress scenarios
        - Keep descriptions under 15 words
        - Focus on realistic current situations people might be in
        
        Only return valid JSON array, no additional text.`;

        const apiConfig = getApiConfig();

        try {
          const response = await fetch(apiConfig.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiConfig.key}`,
            },
            body: JSON.stringify({
              model: apiConfig.model,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.8,
              max_tokens: 800,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const content = data.choices[0].message.content.trim();

          let startingSuggestions;
          try {
            const jsonString = content
              .replace(/```json\n?/, "")
              .replace(/```$/, "");
            startingSuggestions = JSON.parse(jsonString);
          } catch (parseError) {
            throw new Error(
              `Failed to parse starting point suggestions: ${parseError.message}`
            );
          }

          showStartingSuggestionDialog(destination, startingSuggestions);
        } catch (error) {
          showError(`Failed to suggest starting points: ${error.message}`);
        } finally {
          showLoading(false);
        }
      }

      // Show starting point suggestion dialog
      function showStartingSuggestionDialog(destination, suggestions) {
        document.getElementById("startingSuggestionGoal").textContent =
          destination;

        const startingList = document.getElementById("startingSuggestionList");
        startingList.innerHTML = "";

        suggestions.forEach((suggestion, index) => {
          const startingOption = document.createElement("div");
          startingOption.className = "radio-option";
          startingOption.innerHTML = `
            <input type="radio" name="suggestedStarting" id="starting${index}" value="${suggestion.starting}">
            <label for="starting${index}" class="radio-label">
              <strong>${suggestion.starting}</strong>
              <small>${suggestion.description}</small>
            </label>
          `;
          startingList.appendChild(startingOption);
        });

        // Add event listeners to radio buttons
        document
          .querySelectorAll('input[name="suggestedStarting"]')
          .forEach((radio) => {
            radio.addEventListener("change", () => {
              document.getElementById("useSelectedStarting").disabled = false;
            });
          });

        document.getElementById("startingSuggestionDialog").showModal();
        document.body.style.overflow = "hidden";
      }

      // Journey discovery dialog management
      function closeJourneyDiscoveryDialog() {
        document.getElementById("journeyDiscoveryDialog").close();
        document.body.style.overflow = "auto";
      }

      // Show journey discovery dialog with popular examples
      function showJourneyDiscoveryDialog() {
        const popularJourneys = [
          {
            starting: "Unfit",
            destination: "Fit and Healthy",
            description: "Build fitness habits and improve overall health",
          },
          {
            starting: "Broke",
            destination: "Financially Stable",
            description: "Create emergency fund and stable income",
          },
          {
            starting: "Anxious",
            destination: "Confident",
            description: "Build self-confidence and reduce anxiety",
          },
          {
            starting: "Beginner",
            destination: "Learn Programming",
            description: "Master coding skills from scratch",
          },
          {
            starting: "Lonely",
            destination: "Strong Social Circle",
            description: "Build meaningful friendships and connections",
          },
          {
            starting: "Disorganized",
            destination: "Highly Productive",
            description: "Master time management and productivity",
          },
        ];

        const journeyList = document.getElementById("journeyDiscoveryList");
        journeyList.innerHTML = "";

        popularJourneys.forEach((journey, index) => {
          const journeyOption = document.createElement("div");
          journeyOption.className = "radio-option";
          journeyOption.innerHTML = `
            <input type="radio" name="suggestedJourney" id="journey${index}" 
                   data-starting="${journey.starting}" data-destination="${journey.destination}">
            <label for="journey${index}" class="radio-label">
              <strong>${journey.starting} → ${journey.destination}</strong>
              <small>${journey.description}</small>
            </label>
          `;
          journeyList.appendChild(journeyOption);
        });

        // Add event listeners to radio buttons
        document
          .querySelectorAll('input[name="suggestedJourney"]')
          .forEach((radio) => {
            radio.addEventListener("change", () => {
              document.getElementById("useSelectedJourney").disabled = false;
            });
          });

        document.getElementById("journeyDiscoveryDialog").showModal();
        document.body.style.overflow = "hidden";
      }

      // Expand existing graph with a new topic
      async function expandGraphWithTopic(newTopic) {
        if (!(await ensureApiKey())) return;

        showLoading(true);
        hideError();

        // Get current diagram context
        const currentNodes = cy.nodes().map((n) => n.data("label"));
        const startingPoint = document
          .getElementById("startingPoint")
          .value.trim();
        const destinations = getDestinations();
        const currentJourney =
          startingPoint && destinations.length > 0
            ? `${startingPoint} → ${destinations.join(" → ")}`
            : "current path";

        const basePrompt = `Given an existing journey path about "${currentJourney}", add the topic "${newTopic}" to expand the diagram with relevant connections.`;

        const newsPrompt =
          currentProvider === "grok" || currentProvider === "grok-fast"
            ? " Consider recent developments and current events for both topics."
            : "";

        const prompt = `${basePrompt}${newsPrompt}

        Current diagram nodes: ${currentNodes.join(", ")}
        New topic to integrate: "${newTopic}"
        
        Return a JSON object with this structure:
        {
            "newNodes": [
                {"id": "new_node_1", "label": "New Variable Name"},
                {"id": "new_node_2", "label": "Another New Variable"}
            ],
            "newEdges": [
                {"source": "existing_node_id", "target": "new_node_1", "polarity": "+", "description": "explanation"},
                {"source": "new_node_1", "target": "existing_node_id", "polarity": "-", "description": "explanation"}
            ]
        }

        Rules:
        - Create 3-5 new nodes related to "${newTopic}"
        - Connect these new nodes meaningfully to existing nodes where logical relationships exist
        - Use "+" for positive relationships, "-" for negative relationships
        - For existing nodes, use their exact labels as IDs (replace spaces with underscores, lowercase)
        - Ensure the new topic enhances the systemic understanding of the overall diagram
        - Make the integration feel natural and logical
        
        Only return valid JSON, no additional text.`;

        const apiConfig = getApiConfig();

        try {
          const response = await fetch(apiConfig.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiConfig.key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: apiConfig.model,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const data = await response.json();

          let expansionData;
          try {
            const content = data.choices[0].message.content.trim();

            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : content;

            expansionData = JSON.parse(jsonString);
          } catch (parseError) {
            showError(
              "Failed to parse AI response for topic expansion. Please try again."
            );
            return;
          }

          addNodesToExistingDiagram(expansionData, null, null);

          // Show success message for topic addition
          showSuccess(`Added "${newTopic}" to your journey path!`);
        } catch (error) {
          showError(
            `Failed to expand diagram with new topic: ${error.message}`
          );
        } finally {
          showLoading(false);
        }
      }

      // Destination management functions
      function addDestination() {
        const destinationsList = document.getElementById("destinationsList");
        const destinationGroups =
          destinationsList.querySelectorAll(".destination-group");

        // Show remove button on all existing destinations
        destinationGroups.forEach((group) => {
          const removeBtn = group.querySelector(".remove-destination-btn");
          removeBtn.style.display = "flex";
        });

        const newDestinationGroup = document.createElement("div");
        newDestinationGroup.className = "input-group destination-group";
        newDestinationGroup.innerHTML = `
          <div class="input-with-buttons">
            <input type="text" class="destination-input" placeholder="e.g., Next goal" />
            <button class="remove-destination-btn">×</button>
          </div>
        `;

        destinationsList.appendChild(newDestinationGroup);

        // Add event listener to the new remove button
        const removeBtn = newDestinationGroup.querySelector(
          ".remove-destination-btn"
        );
        removeBtn.addEventListener("click", () =>
          removeDestination(newDestinationGroup)
        );

        // Focus on the new input
        const newInput =
          newDestinationGroup.querySelector(".destination-input");
        newInput.focus();
      }

      function removeDestination(destinationGroup) {
        destinationGroup.remove();

        // Check if only one destination remains, hide remove button
        const destinationsList = document.getElementById("destinationsList");
        const remainingGroups =
          destinationsList.querySelectorAll(".destination-group");

        if (remainingGroups.length === 1) {
          const lastRemoveBtn = remainingGroups[0].querySelector(
            ".remove-destination-btn"
          );
          lastRemoveBtn.style.display = "none";
        }
      }

      function getDestinations() {
        const destinationInputs =
          document.querySelectorAll(".destination-input");
        return Array.from(destinationInputs)
          .map((input) => input.value.trim())
          .filter((value) => value !== "");
      }

