      // Check API key and prompt if needed
      async function ensureApiKey() {
        const currentKey = currentProvider === "groq" ? groqApiKey : grokApiKey;
        if (!currentKey) {
          const providerName =
            currentProvider === "groq"
              ? "Groq"
              : currentProvider === "grok-fast"
              ? "Grok 4.1 Fast"
              : "Grok 4";
          showError(`Please set your ${providerName} API key in Settings ⚙️`);
          return false;
        }
        return true;
      }

      // Get layout options based on user preference and node count
      function getLayoutOptions(nodeCount) {
        // Ensure nodeCount is a valid number (fallback to 1 if invalid)
        nodeCount = nodeCount && nodeCount > 0 ? nodeCount : 1;

        const layoutType = currentLayout === "auto" ? "cose" : currentLayout;

        switch (layoutType) {
          case "cose":
            return {
              name: "cose",
              padding: 60,
              nodeOverlap: 400,
              idealEdgeLength: 150,
              nodeRepulsion: 12000,
              nestingFactor: 1.2,
              gravity: 1,
              numIter: 1000,
              initialTemp: 1000,
              coolingFactor: 0.99,
              minTemp: 1.0,
              avoidOverlap: true,
              nodeDimensionsIncludeLabels: true,
            };

          case "dagre":
            // Check if dagre extension is available
            try {
              // Test if we can create a dagre layout
              if (typeof dagre === "undefined" || !cy || !cy.layout) {
                console.warn(
                  "Dagre extension not available, falling back to COSE layout"
                );
                return {
                  name: "cose",
                  padding: 60,
                  nodeOverlap: 400,
                  idealEdgeLength: 150,
                  nodeRepulsion: 12000,
                  nestingFactor: 1.2,
                  gravity: 1,
                  numIter: 1000,
                  initialTemp: 1000,
                  coolingFactor: 0.99,
                  minTemp: 1.0,
                  avoidOverlap: true,
                  nodeDimensionsIncludeLabels: true,
                };
              }
              // Try to create a test layout to see if dagre is registered
              const testLayout = cy.layout({ name: "dagre" });
              if (!testLayout) {
                throw new Error("Dagre layout not available");
              }
            } catch (error) {
              console.warn(
                "Dagre extension not available, falling back to COSE layout:",
                error
              );
              return {
                name: "cose",
                padding: 60,
                nodeOverlap: 400,
                idealEdgeLength: 150,
                nodeRepulsion: 12000,
                nestingFactor: 1.2,
                gravity: 1,
                numIter: 1000,
                initialTemp: 1000,
                coolingFactor: 0.99,
                minTemp: 1.0,
                avoidOverlap: true,
                nodeDimensionsIncludeLabels: true,
              };
            }
            return {
              name: "dagre",
              padding: 60,
              directed: true,
              rankDir: "TB", // Top to bottom
              spacingFactor: 1.5,
              avoidOverlap: true,
              nodeDimensionsIncludeLabels: true,
            };

          default:
            // Default to COSE layout
            return {
              name: "cose",
              padding: 60,
              nodeOverlap: 400,
              idealEdgeLength: 150,
              nodeRepulsion: 12000,
              nestingFactor: 1.2,
              gravity: 1,
              numIter: 1000,
              initialTemp: 1000,
              coolingFactor: 0.99,
              minTemp: 1.0,
              avoidOverlap: true,
              nodeDimensionsIncludeLabels: true,
            };
        }
      }

      // Generate path finder journey using selected AI provider
      async function generateDiagram(startingPoint, destinations) {
        if (!(await ensureApiKey())) return;

        showLoading(true);
        hideError();

        const destinationText =
          destinations.length > 1
            ? `multiple destinations: ${destinations.join(" → ")}`
            : destinations[0];
        const basePrompt = `Create a personalized journey path from "${startingPoint}" to ${destinationText}.`;

        const newsPrompt =
          currentProvider === "grok" || currentProvider === "grok-fast"
            ? " Consider current opportunities, trends, and real-world constraints that might affect this journey."
            : "";

        const prompt = `${basePrompt}${newsPrompt}

        ${
          destinations.length > 1
            ? `This is a multi-destination journey. Create a path that goes through each destination in order: ${destinations
                .map((dest, i) => `${i + 1}. ${dest}`)
                .join(
                  ", "
                )}. Show clear progression from one destination to the next.`
            : `Focus on creating a clear path to reach "${destinations[0]}".`
        }
            
            Return a JSON object with this structure:
            {
                "nodes": [
                    {"id": "start", "label": "Current State", "type": "start"},
                    {"id": "action1", "label": "First Action Step", "type": "action"},
                    {"id": "milestone1", "label": "First Milestone", "type": "milestone"},
                    {"id": "resource1", "label": "Needed Resource", "type": "resource"},
                    {"id": "goal", "label": "Final Goal", "type": "goal"}
                ],
                "edges": [
                    {"source": "start", "target": "action1", "type": "leads_to", "description": "why this step comes first"},
                    {"source": "action1", "target": "milestone1", "type": "achieves", "description": "how this action leads to milestone"}
                ]
            }

            Rules:
            - Create ${
              destinations.length > 1 ? "12-20" : "8-12"
            } nodes representing the journey from "${startingPoint}" ${
          destinations.length > 1
            ? `through each destination (${destinations.join(", ")})`
            : `to "${destinations[0]}"`
        }
            - ${
              destinations.length > 1
                ? `Ensure each destination (${destinations.join(
                    ", "
                  )}) is represented as a milestone node`
                : 'Node types: "start" (1), "action" (specific steps to take), "milestone" (achievements), "resource" (tools/knowledge needed), "goal" (1)'
            }
            - Connect nodes logically showing progression and dependencies
            - Make steps concrete, actionable, and realistic
            - Consider the person's starting constraints and situation
            - Include realistic timeframes and resource requirements
            - Show both sequential steps and parallel opportunities
            ${
              destinations.length > 1
                ? "- Clearly show the progression from one destination to the next"
                : ""
            }
            
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

          let diagramData;
          try {
            const content = data.choices[0].message.content.trim();

            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : content;

            diagramData = JSON.parse(jsonString);
          } catch (parseError) {
            showError("Failed to parse AI response. Please try again.");
            return;
          }

          renderDiagram(diagramData);
          showJourney(startingPoint, destinations);
        } catch (error) {
          showError(`Failed to generate diagram: ${error.message}`);
        } finally {
          showLoading(false);
        }
      }

      // Render the diagram in Cytoscape
      function renderDiagram(data) {
        try {
          if (!cy) {
            showError("Graph not initialized. Please refresh the page.");
            return;
          }

          if (!data || !data.nodes || !data.edges) {
            showError("Invalid diagram data received from API");
            return;
          }

          // Create a set of valid node IDs for validation
          const nodeIds = new Set(data.nodes.map((node) => node.id));

          // Check for duplicate node IDs and fix them
          const uniqueNodes = [];
          const seenIds = new Set();

          data.nodes.forEach((node, index) => {
            let nodeId = node.id;

            // If we've seen this ID before, make it unique
            if (seenIds.has(nodeId)) {
              nodeId = `${node.id}_${index}`;
              console.warn(
                `Duplicate node ID detected: ${node.id}, renamed to: ${nodeId}`
              );
            }

            seenIds.add(nodeId);
            uniqueNodes.push({
              ...node,
              id: nodeId,
            });
          });

          // Update nodeIds set with unique IDs
          const finalNodeIds = new Set(uniqueNodes.map((node) => node.id));

          // Filter out edges that reference non-existent nodes
          const validEdges = data.edges.filter((edge) => {
            const sourceExists = finalNodeIds.has(edge.source);
            const targetExists = finalNodeIds.has(edge.target);

            // Also filter out self-loops which can cause overlapping issues
            const notSelfLoop = edge.source !== edge.target;

            // Log problematic edges for debugging
            if (!sourceExists) {
              console.warn(
                `Edge references non-existent source node: ${edge.source}`
              );
            }
            if (!targetExists) {
              console.warn(
                `Edge references non-existent target node: ${edge.target}`
              );
            }
            if (!notSelfLoop) {
              console.warn(
                `Self-loop detected: ${edge.source} -> ${edge.target}`
              );
            }

            return sourceExists && targetExists && notSelfLoop;
          });

          // Deduplicate edges to prevent multiple edges between same nodes
          const uniqueEdges = [];
          const seenEdgePairs = new Set();

          validEdges.forEach((edge) => {
            const edgeKey = `${edge.source}-${edge.target}`;

            // Only add if we haven't seen this exact edge before
            if (!seenEdgePairs.has(edgeKey)) {
              seenEdgePairs.add(edgeKey);
              uniqueEdges.push(edge);
            }
          });

          const elements = [
            ...uniqueNodes.map((node, index) => ({
              data: {
                id: node.id,
                label: node.label,
                type: node.type || "action",
              },
              position: {
                x: (index % 4) * 200 + Math.random() * 50,
                y: Math.floor(index / 4) * 150 + Math.random() * 50,
              },
            })),
            ...uniqueEdges.map((edge) => {
              const edgeId = `${edge.source}-${edge.target}`;

              return {
                data: {
                  id: edgeId,
                  source: edge.source,
                  target: edge.target,
                  type: edge.type || edge.relationship || "leads_to",
                  description: edge.description || "",
                  polarity: edge.polarity,
                  relationship: edge.relationship || edge.type || "leads_to",
                },
              };
            }),
          ];

          cy.elements().remove();
          cy.add(elements);

          // Use preset positions first, then improve with layout
          cy.layout({
            name: "preset",
            fit: true,
            padding: 50,
          }).run();

          // After preset, apply COSE layout for better arrangement
          setTimeout(() => {
            const nodeElements = elements.filter((el) => !el.data.source);
            const nodeCount = nodeElements.length || 1; // Ensure at least 1
            const layoutOptions = getLayoutOptions(nodeCount);

            cy.layout({
              ...layoutOptions,
              randomize: false, // Use existing positions as starting point
              fit: true,
            }).run();
          }, 100);
        } catch (error) {
          showError(`Failed to render diagram: ${error.message}`);
        }
      }

      // Expand node with additional connections
      async function expandNode(nodeLabel, theme) {
        if (!(await ensureApiKey())) return;

        const expansionTimestamp = Date.now();
        console.log("🚀 EXPAND NODE START - Label:", JSON.stringify(nodeLabel));
        console.log("🚀 EXPAND NODE - Theme:", theme);
        console.log("🚀 EXPAND NODE - Timestamp:", expansionTimestamp);

        // Track this as the most recent expansion request
        lastExpansionTimestamp = expansionTimestamp;
        lastRequestedExpansion = nodeLabel;
        console.log(
          "🚀 EXPAND NODE - Set as most recent expansion:",
          JSON.stringify(nodeLabel)
        );

        showLoading(true);
        hideError();

        // Get current nodes and edges for context
        const currentNodes = cy.nodes().map((n) => n.data("label"));
        console.log("🚀 EXPAND NODE - Current nodes:", currentNodes);
        const currentEdges = cy.edges().map((e) => ({
          source: e.source().data("label"),
          target: e.target().data("label"),
          relationship: e.data("relationship") || e.data("polarity"), // Support both old and new format
        }));

        const prompt = `Given an existing journey path from "${theme}", expand the node "${nodeLabel}" with 2-4 additional relevant steps or resources.

        Current path context:
        - Existing nodes: ${currentNodes.join(", ")}
        - Node to expand: "${nodeLabel}"
        
        Return a JSON object with this structure:
        {
            "newNodes": [
                {"id": "newnode1", "label": "New Step or Resource", "type": "action"},
                {"id": "newnode2", "label": "Another Step or Resource", "type": "resource"}
            ],
            "newEdges": [
                {"source": "existing_node_id", "target": "newnode1", "relationship": "leads_to", "description": "explanation"},
                {"source": "newnode1", "target": "existing_node_id", "relationship": "requires", "description": "explanation"}
            ]
        }

        Rules:
        - Create 2-4 new nodes that logically connect to "${nodeLabel}" in the journey context
        - Include edges that connect new nodes to "${nodeLabel}" and/or existing nodes
        - Use node types: "action", "milestone", "resource"
        - Use relationship types: "leads_to", "achieves", "requires"
        - Ensure new connections enhance the journey path from ${theme}
        - For existing nodes, use their exact labels as IDs (replace spaces with underscores, lowercase)
        - For "${nodeLabel}", use the ID: "${nodeLabel
          .toLowerCase()
          .replace(/\s+/g, "_")}"
        
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
              max_tokens: 1500,
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
              "Failed to parse AI expansion response. Please try again."
            );
            return;
          }

          console.log(
            "🚀 EXPAND NODE - About to call addNodesToExistingDiagram with nodeLabel:",
            JSON.stringify(nodeLabel)
          );
          console.log(
            "🚀 EXPAND NODE - Current global focus operation:",
            JSON.stringify(currentFocusOperation)
          );
          console.log("🚀 EXPAND NODE - Last focus time:", lastFocusTime);

          // After adding nodes, highlight the expanded node after layout
          addNodesToExistingDiagram(
            expansionData,
            function () {
              console.log(
                "🚀 EXPAND NODE - addNodesToExistingDiagram callback completed for:",
                JSON.stringify(nodeLabel)
              );
              // Node highlighting is now handled in panAndZoomToExpandedNode
            },
            nodeLabel
          );
        } catch (error) {
          showError(`Failed to expand node: ${error.message}`);
        } finally {
          showLoading(false);
        }
      }

      // Add new nodes and edges to existing diagram
      function addNodesToExistingDiagram(
        data,
        afterLayoutCallback,
        expandedNodeLabel
      ) {
        console.log(
          "📦 ADD NODES - Function called with expandedNodeLabel:",
          JSON.stringify(expandedNodeLabel)
        );
        console.log("📦 ADD NODES - Timestamp:", Date.now());

        try {
          if (!cy) {
            showError("Graph not initialized. Please refresh the page.");
            return;
          }

          if (!data || !data.newNodes || !data.newEdges) {
            showError("Invalid expansion data received from API");
            return;
          }

          console.log(
            "📦 ADD NODES - Adding",
            data.newNodes.length,
            "nodes and",
            data.newEdges.length,
            "edges"
          );

          // Create a map of existing node labels to actual IDs for reference
          const existingNodeMap = {};
          cy.nodes().forEach((node) => {
            const label = node.data("label");
            const actualId = node.data("id");
            // Map both label and potential ID formats to the actual ID
            existingNodeMap[label] = actualId;
            existingNodeMap[label.toLowerCase().replace(/\s+/g, "_")] =
              actualId;
            existingNodeMap[actualId] = actualId;
          });

          // Validate new edges and resolve node references
          const newNodeIds = new Set(data.newNodes.map((node) => node.id));
          const allValidIds = new Set([
            ...Object.values(existingNodeMap),
            ...newNodeIds,
          ]);

          const validEdges = data.newEdges.filter((edge) => {
            // Try to resolve source and target IDs
            let sourceId = edge.source;
            let targetId = edge.target;

            // If source/target is a label or label-like ID, convert to actual node ID
            if (existingNodeMap[edge.source]) {
              sourceId = existingNodeMap[edge.source];
            }
            if (existingNodeMap[edge.target]) {
              targetId = existingNodeMap[edge.target];
            }

            const sourceValid = allValidIds.has(sourceId);
            const targetValid = allValidIds.has(targetId);

            // Update edge with resolved IDs
            edge.source = sourceId;
            edge.target = targetId;

            return sourceValid && targetValid;
          });

          // Add new nodes and valid edges
          const newElements = [
            ...data.newNodes.map((node) => ({
              data: {
                id: node.id,
                label: node.label,
                type: node.type || "action", // Default to action if type not specified
              },
            })),
            ...validEdges.map((edge) => ({
              data: {
                id: `${edge.source}-${edge.target}`,
                source: edge.source,
                target: edge.target,
                relationship: edge.relationship,
                description: edge.description,
              },
            })),
          ];

          cy.add(newElements);

          // Re-run COSE layout to accommodate new nodes
          const layoutOptions = getLayoutOptions(cy.nodes().length);

          const layout = cy.layout(layoutOptions);

          console.log(
            "📦 ADD NODES - Layout started for expandedNodeLabel:",
            JSON.stringify(expandedNodeLabel)
          );
          console.log(
            "📦 ADD NODES - Current lastRequestedExpansion at layout start:",
            JSON.stringify(lastRequestedExpansion)
          );
          console.log(
            "📦 ADD NODES - 🎯 REGISTERING LAYOUT COMPLETION CALLBACK for:",
            JSON.stringify(expandedNodeLabel)
          );

          // FAILSAFE: Set a timeout to ensure focus happens even if layout events get lost
          const failsafeTimeout = setTimeout(() => {
            console.log(
              "📦 ADD NODES - 🚨 FAILSAFE TIMEOUT - Checking if focus needed for:",
              JSON.stringify(expandedNodeLabel)
            );
            console.log(
              "📦 ADD NODES - 🚨 FAILSAFE - Current lastRequestedExpansion:",
              JSON.stringify(lastRequestedExpansion)
            );
            if (expandedNodeLabel === lastRequestedExpansion) {
              console.log(
                "📦 ADD NODES - 🚨 FAILSAFE - Layout event missed, forcing focus"
              );
              setTimeout(() => {
                panAndZoomToExpandedNode(expandedNodeLabel);
              }, 100);
            }
          }, 3000); // 3 second failsafe

          // CRITICAL: Attach the event listener BEFORE starting the layout to avoid race condition
          cy.one("layoutstop", () => {
            console.log(
              "📦 ADD NODES - 🎯 LAYOUT COMPLETION TRIGGERED for:",
              JSON.stringify(expandedNodeLabel)
            );

            // Clear the failsafe timeout since layout actually completed
            clearTimeout(failsafeTimeout);
            console.log(
              "📦 ADD NODES - ✅ Failsafe timeout cleared for:",
              JSON.stringify(expandedNodeLabel)
            );
            console.log(
              "📦 ADD NODES - Layout stopped, expandedNodeLabel:",
              JSON.stringify(expandedNodeLabel)
            );
            console.log(
              "📦 ADD NODES - Layout stopped, typeof expandedNodeLabel:",
              typeof expandedNodeLabel
            );
            console.log(
              "📦 ADD NODES - Layout stopped, expandedNodeLabel truthy:",
              !!expandedNodeLabel
            );
            console.log(
              "📦 ADD NODES - Current lastRequestedExpansion:",
              JSON.stringify(lastRequestedExpansion)
            );
            console.log(
              "📦 ADD NODES - Is this the most recent expansion?",
              expandedNodeLabel === lastRequestedExpansion
            );

            // Only focus if this layout completion is for the most recent expansion request
            console.log("📦 ADD NODES - Checking conditions for focus...");
            console.log(
              "📦 ADD NODES - expandedNodeLabel exists:",
              !!expandedNodeLabel
            );
            console.log(
              "📦 ADD NODES - expandedNodeLabel value:",
              JSON.stringify(expandedNodeLabel)
            );
            console.log(
              "📦 ADD NODES - lastRequestedExpansion value:",
              JSON.stringify(lastRequestedExpansion)
            );
            console.log(
              "📦 ADD NODES - Exact match:",
              expandedNodeLabel === lastRequestedExpansion
            );
            console.log(
              "📦 ADD NODES - String comparison result:",
              String(expandedNodeLabel) === String(lastRequestedExpansion)
            );

            if (
              expandedNodeLabel &&
              expandedNodeLabel === lastRequestedExpansion
            ) {
              const nodeToFocus = expandedNodeLabel; // Capture for closure
              console.log(
                "📦 ADD NODES - ✅ This is the most recent expansion, focusing on:",
                JSON.stringify(nodeToFocus)
              );
              console.log(
                "📦 ADD NODES - Local variable nodeToFocus:",
                JSON.stringify(nodeToFocus)
              );
              console.log(
                "📦 ADD NODES - Are they equal?",
                nodeToFocus === expandedNodeLabel
              );

              // Get all current nodes to verify the target exists
              const allCurrentNodes = cy.nodes().map((n) => n.data("label"));
              console.log(
                "📦 ADD NODES - All nodes after layout:",
                allCurrentNodes.map((l) => JSON.stringify(l))
              );

              setTimeout(() => {
                console.log(
                  "📦 ADD NODES - 🎯 CALLING panAndZoomToExpandedNode for most recent expansion:",
                  JSON.stringify(nodeToFocus)
                );
                console.log(
                  "📦 ADD NODES - Double-checking lastRequestedExpansion still matches:",
                  JSON.stringify(lastRequestedExpansion)
                );
                console.log(
                  "📦 ADD NODES - nodeToFocus === lastRequestedExpansion:",
                  nodeToFocus === lastRequestedExpansion
                );
                panAndZoomToExpandedNode(nodeToFocus);
                // Call the callback after pan/zoom animation
                if (typeof afterLayoutCallback === "function") {
                  setTimeout(afterLayoutCallback, 700); // Reduced timing for better flow
                }
              }, 100); // Slightly longer delay to ensure layout is fully complete
            } else if (expandedNodeLabel) {
              console.log(
                "📦 ADD NODES - ❌ Ignoring old expansion layout completion for:",
                JSON.stringify(expandedNodeLabel)
              );
              console.log(
                "📦 ADD NODES - Most recent expansion is:",
                JSON.stringify(lastRequestedExpansion)
              );
              console.log(
                "📦 ADD NODES - ❌ CONDITION FAILED - expandedNodeLabel:",
                JSON.stringify(expandedNodeLabel)
              );
              console.log(
                "📦 ADD NODES - ❌ CONDITION FAILED - lastRequestedExpansion:",
                JSON.stringify(lastRequestedExpansion)
              );
              console.log(
                "📦 ADD NODES - ❌ CONDITION FAILED - Are they equal?",
                expandedNodeLabel === lastRequestedExpansion
              );

              // EMERGENCY FALLBACK: If this is the most recent expansion but condition failed, still focus
              if (expandedNodeLabel === lastRequestedExpansion) {
                console.log(
                  "📦 ADD NODES - 🚨 EMERGENCY FALLBACK: Condition failed but strings match, forcing focus"
                );
                setTimeout(() => {
                  panAndZoomToExpandedNode(expandedNodeLabel);
                }, 100);
              }

              // Still call the callback but don't focus
              if (typeof afterLayoutCallback === "function") {
                setTimeout(afterLayoutCallback, 50);
              }
            } else {
              console.log(
                "📦 ADD NODES - No expandedNodeLabel provided, just fitting view"
              );
              // Just fit the view and call callback
              cy.fit();
              if (typeof afterLayoutCallback === "function") {
                setTimeout(afterLayoutCallback, 50);
              }
            }
          });

          // NOW start the layout after the event listener is attached
          console.log(
            "📦 ADD NODES - 🚀 Starting layout for:",
            JSON.stringify(expandedNodeLabel)
          );
          layout.run();
        } catch (error) {
          showError(`Failed to add new connections: ${error.message}`);
        }
      }

      // Global variable to prevent focus conflicts during rapid expansions
      let lastFocusTime = 0;
      let currentFocusOperation = null;
      let lastExpansionTimestamp = 0;
      let lastRequestedExpansion = null;

      // Pan and zoom to focus on expanded node and its connections
      function panAndZoomToExpandedNode(nodeLabel) {
        if (!cy) return;

        // Prevent multiple rapid focus operations
        const now = Date.now();
        if (now - lastFocusTime < 1000) {
          // Debounce for 1 second
          console.log(
            "⚠️ Skipping focus - too soon after last focus operation"
          );
          return;
        }

        // Cancel any ongoing focus operation
        if (currentFocusOperation) {
          console.log("⚠️ Cancelling previous focus operation");
          cy.stop(); // Stop any ongoing animations
          currentFocusOperation = null;
        }

        lastFocusTime = now;
        currentFocusOperation = nodeLabel;

        console.log("=== PAN AND ZOOM DEBUG (ENHANCED) ===");
        console.log(
          "Target node label to focus on:",
          JSON.stringify(nodeLabel)
        );
        console.log("Type of nodeLabel:", typeof nodeLabel);
        console.log("Focus operation timestamp:", now);

        // Get all nodes and their labels for debugging
        const allNodes = cy.nodes();
        const allLabels = allNodes.map((n) => n.data("label"));
        console.log(
          "All available node labels:",
          allLabels.map((label) => JSON.stringify(label))
        );

        // Find the expanded node with exact string matching
        const expandedNode = allNodes.filter((n) => {
          const currentLabel = n.data("label");
          const isMatch = currentLabel === nodeLabel;
          console.log(
            `Checking node "${currentLabel}" === "${nodeLabel}": ${isMatch}`
          );
          return isMatch;
        });

        if (!expandedNode || expandedNode.length === 0) {
          console.log(
            "❌ Could not find expanded node:",
            JSON.stringify(nodeLabel)
          );
          console.log("Trying case-insensitive search...");

          // Try case-insensitive fallback
          const expandedNodeFallback = allNodes.filter((n) => {
            return n.data("label").toLowerCase() === nodeLabel.toLowerCase();
          });

          if (expandedNodeFallback && expandedNodeFallback.length > 0) {
            console.log("✅ Found node with case-insensitive match");
            currentFocusOperation = null;
            return panAndZoomToExpandedNode(
              expandedNodeFallback.first().data("label")
            );
          }

          console.log("❌ No match found even with case-insensitive search");
          currentFocusOperation = null;
          return;
        }

        const targetNode = expandedNode.first(); // Get the first match
        console.log(
          "✅ Found expanded node:",
          JSON.stringify(targetNode.data("label"))
        );
        console.log("Node ID:", targetNode.data("id"));

        // Double-check this is still the node we want to focus on
        if (currentFocusOperation !== nodeLabel) {
          console.log("⚠️ Focus operation was superseded, aborting");
          return;
        }

        // Get the expanded node's neighbors
        const connectedNodes = targetNode.neighborhood().nodes();
        console.log("Connected nodes to expanded node:", connectedNodes.length);

        // Log the newly connected nodes (they should be the ones added during expansion)
        connectedNodes.forEach((node, idx) => {
          console.log(
            `  Connected node ${idx}: "${node.data("label")}" (ID: ${node.data(
              "id"
            )})`
          );
        });

        // Strategy: Focus on the expanded node plus its immediate connections
        let focusNodes = targetNode;

        if (connectedNodes.length > 0) {
          // Include all immediate neighbors since they represent the expansion context
          focusNodes = targetNode.union(connectedNodes.slice(0, 10)); // Slightly more neighbors for context
        }

        console.log("Focusing on", focusNodes.length, "nodes total");

        // Calculate tight padding for better focus
        const basePadding = 100; // Slightly more padding for clarity

        // Reset any existing highlights but preserve original node colors
        cy.nodes().style({
          "border-width": "2px",
          "border-color": "#2980b9",
        });

        // Restore original node colors based on type
        cy.nodes().forEach((node) => {
          const nodeType = node.data("type") || "action";
          let backgroundColor;
          switch (nodeType) {
            case "milestone":
              backgroundColor = "#9b59b6"; // Purple for milestones
              break;
            case "resource":
              backgroundColor = "#f39c12"; // Orange for resources
              break;
            case "action":
            default:
              backgroundColor = "#3498db"; // Blue for actions (default)
              break;
          }
          node.style("background-color", backgroundColor);
        });

        // Highlight the target expanded node with a distinctive border
        targetNode.style({
          "border-width": "4px",
          "border-color": "#f1c40f", // Gold border for the focused node
          "border-opacity": "1",
        });

        // Pan and zoom to the focus area with the exact target node
        cy.animate(
          {
            fit: {
              eles: focusNodes,
              padding: basePadding,
            },
          },
          {
            duration: 900, // Slightly slower for smoother movement
            easing: "ease-out",
            complete: () => {
              // Only highlight if this is still the current operation
              if (currentFocusOperation === nodeLabel) {
                console.log(
                  "🎯 Pan/zoom complete - highlighting target node:",
                  JSON.stringify(nodeLabel)
                );

                // Highlight ONLY the expanded node with a very distinct style
                targetNode.animate(
                  {
                    style: {
                      "border-width": 12,
                      "border-color": "#e74c3c", // Bright red for distinction
                      "background-color": "#f39c12", // Bright orange for distinction
                    },
                  },
                  {
                    duration: 600,
                    complete: () => {
                      // Return to normal style
                      if (currentFocusOperation === nodeLabel) {
                        targetNode.animate(
                          {
                            style: {
                              "border-width": 5,
                              "border-color": "#2c3e50", // Dark border to stand out
                              "background-color": "#3498db",
                            },
                          },
                          {
                            duration: 600,
                            complete: () => {
                              // Clear the operation flag when completely done
                              if (currentFocusOperation === nodeLabel) {
                                currentFocusOperation = null;
                                console.log(
                                  "✅ Focus operation complete for:",
                                  JSON.stringify(nodeLabel)
                                );
                              }
                            },
                          }
                        );
                      }
                    },
                  }
                );
              } else {
                console.log(
                  "⚠️ Focus operation was superseded during animation"
                );
              }
            },
          }
        );

        console.log("=== END PAN AND ZOOM DEBUG (ENHANCED) ===");
      }

      // Highlight a node by its label (temporary effect)
      function highlightNodeByLabel(nodeLabel) {
        if (!cy) return;
        // Find node by label
        const node = cy.nodes().filter((n) => n.data("label") === nodeLabel);
        if (node && node.length > 0) {
          // Save original style
          const origBg = node.style("background-color");
          const origBorder = node.style("border-color");
          const origBorderWidth = node.style("border-width");
          // Set highlight style
          node.style({
            "background-color": "#ffe066", // yellow
            "border-color": "#ffae00",
            "border-width": "6px",
            "transition-property":
              "background-color, border-color, border-width",
            "transition-duration": "0.3s",
          });
          // Revert after 1.2s
          setTimeout(() => {
            node.style({
              "background-color": origBg,
              "border-color": origBorder,
              "border-width": origBorderWidth,
            });
          }, 1200);
        }
      }

      // Handle node tap/touch events for double-tap detection
      function handleNodeTap(evt) {
        const node = evt.target;
        const currentTime = new Date().getTime();

        if (!isMobileDevice()) {
          // Desktop click handling - detect single vs double click
          if (
            lastClickTarget === node &&
            currentTime - lastClickTime < DOUBLE_CLICK_DELAY
          ) {
            // Double-click detected - expand node
            const nodeLabel = node.data("label");
            console.log(
              "🖱️ DESKTOP DOUBLE-CLICK - Node clicked:",
              JSON.stringify(nodeLabel)
            );
            console.log("🖱️ DESKTOP DOUBLE-CLICK - Node ID:", node.data("id"));
            console.log("🖱️ DESKTOP DOUBLE-CLICK - Timestamp:", currentTime);

            const startingPoint = document
              .getElementById("startingPoint")
              .value.trim();
            const destinations = getDestinations();
            const currentJourney =
              startingPoint && destinations.length > 0
                ? `${startingPoint} → ${destinations.join(" → ")}`
                : "current path";

            if (startingPoint && destinations.length > 0) {
              console.log(
                "🖱️ DESKTOP DOUBLE-CLICK - Calling expandNode with:",
                JSON.stringify(nodeLabel)
              );
              expandNode(nodeLabel, currentJourney);
            } else {
              showError("Please set your starting point and destination first");
            }

            // Reset to prevent triple-click
            lastClickTime = 0;
            lastClickTarget = null;
          } else {
            // Single click - could be start of double-click or just explanation
            lastClickTime = currentTime;
            lastClickTarget = node;

            // Show explanation after delay if no second click
            setTimeout(() => {
              if (
                lastClickTarget === node &&
                new Date().getTime() - lastClickTime >= DOUBLE_CLICK_DELAY
              ) {
                explainNode(node);
                lastClickTime = 0;
                lastClickTarget = null;
              }
            }, DOUBLE_CLICK_DELAY);
          }
          return;
        }

        // Mobile tap handling - detect single vs double tap
        // Check if this is a double-tap
        if (
          lastTapTarget === node &&
          currentTime - lastTapTime < DOUBLE_TAP_DELAY
        ) {
          // Double-tap detected - expand node
          const nodeLabel = node.data("label");
          console.log(
            "📱 MOBILE DOUBLE-TAP - Node tapped:",
            JSON.stringify(nodeLabel)
          );
          console.log("📱 MOBILE DOUBLE-TAP - Node ID:", node.data("id"));
          console.log("📱 MOBILE DOUBLE-TAP - Timestamp:", currentTime);

          const startingPoint = document
            .getElementById("startingPoint")
            .value.trim();
          const destinations = getDestinations();
          const currentJourney =
            startingPoint && destinations.length > 0
              ? `${startingPoint} → ${destinations.join(" → ")}`
              : "current path";

          if (startingPoint && destinations.length > 0) {
            console.log(
              "📱 MOBILE DOUBLE-TAP - Calling expandNode with:",
              JSON.stringify(nodeLabel)
            );
            expandNode(nodeLabel, currentJourney);
          } else {
            showError("Please set your starting point and destination first");
          }

          // Reset to prevent triple-tap
          lastTapTime = 0;
          lastTapTarget = null;
        } else {
          // Single tap - could be start of double-tap or just explanation
          lastTapTime = currentTime;
          lastTapTarget = node;

          // Show explanation after delay if no second tap
          setTimeout(() => {
            if (
              lastTapTarget === node &&
              new Date().getTime() - lastTapTime >= DOUBLE_TAP_DELAY
            ) {
              explainNode(node);
              lastTapTime = 0;
              lastTapTarget = null;
            }
          }, DOUBLE_TAP_DELAY);
        }
      }

      // Handle background tap/touch events for double-tap detection
      function handleBackgroundTap(evt) {
        // Only handle tap events on mobile devices
        if (!isMobileDevice()) return;

        const currentTime = new Date().getTime();

        // Check if this is a double-tap on background
        if (
          lastTapTarget === cy &&
          currentTime - lastTapTime < DOUBLE_TAP_DELAY
        ) {
          // Double-tap detected on background
          // Check if we have an existing diagram
          if (cy.nodes().length === 0) {
            showError("Please generate a diagram first before adding topics");
            return;
          }

          // Prompt for new topic
          promptForNewTopic();

          // Reset to prevent triple-tap
          lastTapTime = 0;
          lastTapTarget = null;
        } else {
          // Single tap - store for potential double-tap
          lastTapTime = currentTime;
          lastTapTarget = cy;
        }
      }

      // Explain current trends and developments for a node
      async function explainNode(node) {
        if (!(await ensureApiKey())) return;

        const nodeLabel = node.data("label");
        const startingPoint = document
          .getElementById("startingPoint")
          .value.trim();
        const destinations = getDestinations();
        const currentJourney =
          startingPoint && destinations.length > 0
            ? `journey from "${startingPoint}" to "${destinations.join(" → ")}"`
            : "your path";

        // Show loading state
        const loadingMessage = `Getting guidance for ${nodeLabel}...`;
        showInfo(loadingMessage);

        const newsPrompt =
          currentProvider === "grok" || currentProvider === "grok-fast"
            ? " Focus on recent developments and current events."
            : "";

        const prompt = `Provide practical guidance for "${nodeLabel}" in the context of ${currentJourney}.${newsPrompt}

        Keep your explanation:
        - Under 100 words
        - Focus on actionable advice and practical steps
        - Relevant to someone on this specific journey
        - Suitable for a mobile dialog

        Return only the guidance, no additional text.`;

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
              temperature: 0.5,
              max_tokens: 150,
            }),
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const data = await response.json();
          const explanation = data.choices[0].message.content.trim();

          hideInfo();

          // Show explanation in dialog
          showNodeDialog(nodeLabel, explanation);
        } catch (error) {
          hideInfo();
          showError(`Failed to get trends for ${nodeLabel}: ${error.message}`);
          setTimeout(hideError, 3000);
        }
      }

      // Explain the relationship between two connected nodes
      async function explainRelationship(edge) {
        if (!(await ensureApiKey())) return;

        const sourceNode = edge.source();
        const targetNode = edge.target();
        const sourceLabel = sourceNode.data("label");
        const targetLabel = targetNode.data("label");
        const edgeType = edge.data("type") || "leads_to";
        const startingPoint = document
          .getElementById("startingPoint")
          .value.trim();
        const destinations = getDestinations();
        const currentJourney =
          startingPoint && destinations.length > 0
            ? `journey from "${startingPoint}" to "${destinations.join(" → ")}"`
            : "your path";

        // Show loading state
        const loadingMessage = `Explaining ${sourceLabel} → ${targetLabel}...`;
        showInfo(loadingMessage);

        const prompt = `Explain how "${sourceLabel}" connects to "${targetLabel}" in the context of ${currentJourney}.

        Keep your explanation:
        - Under 100 words
        - Clear and simple
        - Focused on why this step or connection is important
        - Suitable for a mobile dialog

        Return only the explanation, no additional text.`;

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
              temperature: 0.5,
              max_tokens: 150,
            }),
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const data = await response.json();
          const explanation = data.choices[0].message.content.trim();

          hideInfo();

          // Get relationship info for display
          const relationship =
            edge.data("relationship") || edge.data("type") || "leads_to";
          const polarity = edge.data("polarity");

          // Choose appropriate symbol for path finder relationships
          let relationshipSymbol = "→";
          if (polarity === "+") {
            relationshipSymbol = "➕";
          } else if (polarity === "-") {
            relationshipSymbol = "➖";
          } else if (relationship === "requires") {
            relationshipSymbol = "🔗";
          } else if (relationship === "enables") {
            relationshipSymbol = "✨";
          }

          // Show explanation in dialog
          showRelationshipDialog(
            `${relationshipSymbol} ${sourceLabel} → ${targetLabel}`,
            explanation
          );
        } catch (error) {
          hideInfo();
          showError(`Failed to explain relationship: ${error.message}`);
          setTimeout(hideError, 3000);
        }
      }

