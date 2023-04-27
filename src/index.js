import * as vis from './libs/vis-network.min.js';
import html2canvas from "./node_modules/html2canvas/dist/html2canvas.min.js";
import { jsPDF } from "jspdf";

network.on("afterDrawing", function (ctx) {
  console.log("network drawn");
});


/**
 * Global Variables
 */
let selectedNodeId = null;

/**
 * Nodes and Edges Data
 */
const nodes = new vis.DataSet([
  // Add initial nodes data
  { id: 1, label: "what the problem" },
  { id: 2, label: "Ui Problem" },
  { id: 3, label: "Login Problem" },
  { id: 4, label: "Node 4" },
  { id: 5, label: "Node 5" },
  { id: 6, label: "what angular version is used?" },
  { id: 7, label: "Angular1/JS" },
  { id: 8, label: "Angular 2+" },
]);

const edges = new vis.DataSet([
  // Add initial edges data
  { from: 1, to: 3 },
  { from: 1, to: 2 },
  { from: 1, to: 4 },
  { from: 1, to: 5 },
  { from: 2, to: 6 },
  { from: 6, to: 7 },
  { from: 6, to: 8 },
]);

/**
 * Network Configuration
 */
const options = {
  nodes: {
    font: {
      size: 18, // Adjust the font size
    },
    shapeProperties: {
      borderRadius: 8, // Set the border radius of the node
    },
    borderWidth: 2, // Set the border width of the node
    color: {
      border: "#2B7CE9",
      background: "#97C2FC",
      highlight: {
        border: "black",
        background: "#D2E5FF",
      },
      hover: {
        border: "black",
        background: "black",
      },
    },
    scaling: {
      min: 50, // Minimum size of the node
      max: 300, // Maximum size of the node
      label: {
        enabled: true,
        min: 18, // Minimum font size
        max: 18, // Maximum font size
      },
      customScalingFunction: (min, max, total, value) => {
        return value + 20; // Add 20px padding to the node
      },
    },
  },
  edges: {
    smooth: {
      enabled: true,
      type: "cubicBezier",
      forceDirection: "vertical",
      roundness: 0.4,
    },
    color: {
      color: "black", 
      hover: "black"
    }
  },
  layout: {
    hierarchical: {
      direction: "UD",
      sortMethod: "directed",
      levelSeparation: 100,
      nodeSpacing: 200,
    },
  },
  interaction: {
    hover: true,
  },
  physics: false,
};

const container = document.getElementById("mynetwork");
const data = { nodes, edges };
const network = new vis.Network(container, data, options);
loadGraph();

/**
 * Event Handlers
 */
network.on("selectNode", (params) => {
  selectedNodeId = params.nodes[0];
  const node = nodes.get(selectedNodeId);
  const nodeComment = node.comment ? node.comment : "No comment available.";
  document.getElementById("node-comment").innerText = nodeComment;
});

document.getElementById("export-json").addEventListener("click", exportToJson);
document.getElementById("add-node").addEventListener("click", addNode);
document.getElementById("save-graph").addEventListener("click", saveGraph);
document.getElementById("load-graph").addEventListener("click", loadGraph);
document.getElementById("delete-node").addEventListener("click", deleteNode);
document.getElementById("edit-node").addEventListener("click", editNode);

/**
 * Functions
 */
function exportToJson() {
  const nodesArray = nodes.get();
  const edgesArray = edges.get();
  const graphJson = JSON.stringify(
    { nodes: nodesArray, edges: edgesArray },
    null,
    2
  );
  downloadJson(graphJson, "tree_graph.json");
  console.log(graphJson);
}

function addNode() {
  const newNodeLabel = document.getElementById("new-node-label").value;
  const newNodeComment = document.getElementById("new-node-comment").value;
  if (!newNodeLabel) {
    alert("Please enter a label for the new node.");
    return;
  }

  if (selectedNodeId === null) {
    alert("Please select a parent node before adding a new node.");
    return;
  }

  const newNodeId = Math.max(...nodes.getIds()) + 1;
  nodes.add({ id: newNodeId, label: newNodeLabel, comment: newNodeComment });
  edges.add({ from: selectedNodeId, to: newNodeId });

  // Reset the input field and selected node
  document.getElementById("new-node-label").value = "";
  document.getElementById("new-node-comment").value = "";

  selectedNodeId = null;
  network.unselectAll();

  // Save the graph to local storage after adding a node
  saveGraph();
}

function saveGraph() {
  const graphData = {
    nodes: nodes.get(),
    edges: edges.get(),
  };
  localStorage.setItem("treeGraphData", JSON.stringify(graphData));
}

function loadGraph() {
  const storedGraphData = localStorage.getItem("treeGraphData");

  if (!storedGraphData) {
    alert("No saved graph data found in local storage.");
    return;
  }

  const graphData = JSON.parse(storedGraphData);
  updateGraph(graphData);
}

function deleteNode() {
  if (selectedNodeId === null) {
    alert("Please select a node to delete.");
    return;
  }

  deleteConnectedNodes(selectedNodeId);

  // Reset the selected node
  selectedNodeId = null;
  network.unselectAll();

  // Save the graph to local storage after deleting a node
  saveGraph();
}

function downloadJson(json, filename) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(json);
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function editNode() {
  const editNodeLabel = document.getElementById("edit-node-label").value;
  const editNodeComment = document.getElementById("edit-node-comment").value;

  if (selectedNodeId === null) {
    alert("Please select a node to edit.");
    return;
  }

  if (!editNodeLabel && !editNodeComment) {
    alert("Please enter a new label or comment for the selected node.");
    return;
  }

  const updatedNodeData = {};

  if (editNodeLabel) {
    updatedNodeData.label = editNodeLabel;
  }

  if (editNodeComment) {
    updatedNodeData.comment = editNodeComment;
  }

  nodes.update({ id: selectedNodeId, ...updatedNodeData });

  // Reset the input fields and selected node
  document.getElementById("edit-node-label").value = "";
  document.getElementById("edit-node-comment").value = "";
  selectedNodeId = null;
  network.unselectAll();

  // Save the graph to local storage after editing a node
  saveGraph();
}

 
function deleteConnectedNodes(nodeId) {
  const childEdges = edges.get({
    filter: (edge) => edge.from === nodeId,
  });

  for (const childEdge of childEdges) {
    const childNodeId = childEdge.to;
    deleteConnectedNodes(childNodeId);
  }

  const connectedEdges = edges.get({
    filter: (edge) => edge.from === nodeId || edge.to === nodeId,
  });
  

  edges.remove(connectedEdges.map((edge) => edge.id));
  nodes.remove(nodeId);
}

// Event listeners
document.getElementById("upload-json").addEventListener("change", handleJsonUpload);

// Function to handle JSON file upload
function handleJsonUpload(event) {
  const file = event.target.files[0];
  if (!validateFile(file)) return;

  readJsonFile(file)
    .then((jsonData) => {
      const graphData = parseJsonData(jsonData);
      if (!validateGraphData(graphData)) return;
      updateGraph(graphData);
      network.redraw()
    })
    .catch(() => {
      alert("Error parsing JSON.");
    });
}

// Validates the uploaded file
function validateFile(file) {
  if (!file) {
    alert("No file selected.");
    return false;
  }
  return true;
}

// Reads the JSON file and returns its content as a Promise
function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => resolve(e.target.result);
    fileReader.onerror = () => reject();
    fileReader.readAsText(file);
  });
}

// Parses the JSON data
function parseJsonData(jsonData) {
  return JSON.parse(jsonData);
}

// Validates the graph data
function validateGraphData(graphData) {
  if (!graphData.nodes) {
    alert("Invalid JSON format: missing 'nodes'.");
    return false;
  }
  return true;
}


// Updates the graph with new data
function updateGraph(graphData) {
  nodes.clear();
  edges.clear();
  nodes.add(graphData.nodes);

  // Add edges based on the connections property in each node
  graphData.nodes.forEach((node) => {
    if (node.connections) {
      node.connections.forEach((connection) => {
        edges.add({ from: node.id, to: connection });
      });
    }
  });
}

function exportToPdf() {
  const container = document.getElementById("mynetwork");
  html2canvas(container, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("l", "px", [canvas.width, canvas.height]);

    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save("graph.pdf");
  });
}

document.getElementById("export-pdf").addEventListener("click", exportToPdf);

document.getElementById("change-shape").addEventListener("click", changeNodeShape);

function changeNodeShape() {
  if (selectedNodeId === null) {
    alert("Please select a node to change its shape.");
    return;
  }

  const selectedShape = document.getElementById("node-shape").value;
  nodes.update({ id: selectedNodeId, shape: selectedShape });

  // Save the graph to local storage after changing the node shape
  saveGraph();
}
