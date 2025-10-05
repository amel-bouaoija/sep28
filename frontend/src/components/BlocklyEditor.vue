<template>
    <div class="blockly-container">
      <!-- Header avec contrôles -->
      <div class="header">
        <h2>Éditeur de Tests API</h2>
        <div class="controls">
          <button @click="generateCode" class="btn btn-primary">
            <span class="icon">⚡</span>
            Générer Code
          </button>
          <button @click="executeTest" class="btn btn-success">
            <span class="icon">▶️</span>
            Exécuter Test
          </button>
          <button @click="saveScenario" class="btn btn-info">
            <span class="icon">💾</span>
            Sauvegarder
          </button>
          <button @click="loadScenario" class="btn btn-secondary">
            <span class="icon">📂</span>
            Charger
          </button>
        </div>
      </div>
  
      <!-- Zone principale avec Blockly et panneau latéral -->
      <div class="main-content">
        <!-- Éditeur Blockly -->
        <div class="blockly-workspace">
          <div ref="blocklyDiv" class="blockly-editor"></div>
          <xml ref="toolbox" style="display: none">
            <category name="HTTP" colour="230">
              <block type="http_request"></block>
              <block type="text"></block>
              <block type="variables_set"></block>
            </category>
            <category name="Authentification" colour="20">
              <block type="auth_request"></block>
            </category>
            <category name="Logique" colour="210">
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
            </category>
            <category name="Variables" colour="330">
              <block type="variables_get"></block>
              <block type="variables_set"></block>
            </category>
          </xml>
        </div>
  
        <!-- Panneau latéral -->
        <div class="side-panel">
          <!-- Onglets -->
          <div class="tabs">
            <button 
              @click="activeTab = 'code'" 
              :class="{ active: activeTab === 'code' }"
              class="tab"
            >
              Code Généré
            </button>
            <button 
              @click="activeTab = 'results'" 
              :class="{ active: activeTab === 'results' }"
              class="tab"
            >
              Résultats
            </button>
            <button 
              @click="activeTab = 'scenarios'" 
              :class="{ active: activeTab === 'scenarios' }"
              class="tab"
            >
              Scénarios
            </button>
          </div>
  
          <!-- Contenu des onglets -->
          <div class="tab-content">
            <!-- Code généré -->
            <div v-if="activeTab === 'code'" class="code-panel">
              <h3>Code JavaScript généré</h3>
              <pre class="code-block"><code>{{ generatedCode || 'Aucun code généré' }}</code></pre>
            </div>
  
            <!-- Résultats des tests -->
            <div v-if="activeTab === 'results'" class="results-panel">
              <h3>Résultats des Tests</h3>
              <div v-if="testResults.length === 0" class="no-results">
                Aucun test exécuté
              </div>
              <div v-else class="results-list">
                <div 
                  v-for="(result, index) in testResults" 
                  :key="index"
                  :class="['result-item', result.success ? 'success' : 'error']"
                >
                  <div class="result-header">
                    <span class="status">{{ result.success ? '✅' : '❌' }}</span>
                    <span class="method">{{ result.method }}</span>
                    <span class="url">{{ result.url }}</span>
                  </div>
                  <div class="result-details">
                    <div>Status: {{ result.status }}</div>
                    <div>Temps: {{ result.time }}ms</div>
                    <div v-if="result.error" class="error-msg">{{ result.error }}</div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Gestionnaire de scénarios -->
            <div v-if="activeTab === 'scenarios'" class="scenarios-panel">
              <h3>Scénarios de Test</h3>
              
              <!-- Nouveau scénario -->
              <div class="scenario-form">
                <input 
                  v-model="newScenarioName" 
                  placeholder="Nom du scénario"
                  class="input"
                />
                <button @click="saveCurrentScenario" class="btn btn-sm btn-primary">
                  Sauvegarder Actuel
                </button>
              </div>
  
              <!-- Liste des scénarios -->
              <div class="scenarios-list">
                <div 
                  v-for="scenario in scenarios" 
                  :key="scenario.id"
                  class="scenario-item"
                >
                  <div class="scenario-info">
                    <h4>{{ scenario.name }}</h4>
                    <p>{{ scenario.description }}</p>
                    <small>{{ scenario.blocks }} bloc(s) • {{ formatDate(scenario.created) }}</small>
                  </div>
                  <div class="scenario-actions">
                    <button @click="loadScenarioById(scenario.id)" class="btn btn-sm btn-secondary">
                      Charger
                    </button>
                    <button @click="deleteScenario(scenario.id)" class="btn btn-sm btn-danger">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, nextTick } from 'vue'
  import * as Blockly from 'blockly'
  import { javascriptGenerator } from 'blockly/javascript'
  import { defineHttpRequestBlock } from '../Blockly/Blocks.js'
  
  // Références
  const blocklyDiv = ref(null)
  const toolbox = ref(null)
  const activeTab = ref('code')
  const generatedCode = ref('')
  const testResults = ref([])
  const scenarios = ref([])
  const newScenarioName = ref('')
  
  // Workspace Blockly
  let workspace = null
  
  // Lifecycle
  onMounted(() => {
    defineHttpRequestBlock()
    
    workspace = Blockly.inject(blocklyDiv.value, {
      toolbox: toolbox.value,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true,
      theme: 'modern'
    })
  
    // Auto-génération du code quand les blocs changent
    workspace.addChangeListener(() => {
      generateCode()
    })
  
    // Charger les scénarios sauvegardés
    loadSavedScenarios()
  })
  
  // Fonctions
  const generateCode = () => {
    if (!workspace) return
    generatedCode.value = javascriptGenerator.workspaceToCode(workspace)
  }
  
  const executeTest = async () => {
    if (!generatedCode.value.trim()) {
      alert('Aucun code à exécuter. Créez d\'abord des blocs.')
      return
    }
  
    try {
      const startTime = Date.now()
      
      // Créer une fonction pour exécuter le code généré
      const testFunction = new Function(`return (async () => { ${generatedCode.value} })()`)
      
      // Exécuter le test
      await testFunction()
      
      const endTime = Date.now()
      
      // Ajouter le résultat
      testResults.value.unshift({
        success: true,
        method: 'TEST',
        url: 'Generated Code',
        status: 'Success',
        time: endTime - startTime,
        timestamp: new Date()
      })
      
      activeTab.value = 'results'
      
    } catch (error) {
      testResults.value.unshift({
        success: false,
        method: 'TEST',
        url: 'Generated Code',
        status: 'Error',
        time: 0,
        error: error.message,
        timestamp: new Date()
      })
      
      activeTab.value = 'results'
    }
  }
  
  const saveCurrentScenario = () => {
    if (!newScenarioName.value.trim()) {
      alert('Veuillez entrer un nom pour le scénario')
      return
    }
  
    const xml = Blockly.Xml.workspaceToDom(workspace)
    const xmlText = Blockly.Xml.domToText(xml)
    
    const scenario = {
      id: Date.now().toString(),
      name: newScenarioName.value,
      description: `Scénario créé le ${new Date().toLocaleDateString()}`,
      blocks: workspace.getAllBlocks().length,
      xml: xmlText,
      created: new Date().toISOString()
    }
    
    scenarios.value.push(scenario)
    saveScenariosToStorage()
    newScenarioName.value = ''
    
    alert('Scénario sauvegardé avec succès !')
  }
  
  const loadScenarioById = (id) => {
    const scenario = scenarios.value.find(s => s.id === id)
    if (!scenario) return
    
    try {
      workspace.clear()
      const xml = Blockly.Xml.textToDom(scenario.xml)
      Blockly.Xml.domToWorkspace(xml, workspace)
      alert(`Scénario "${scenario.name}" chargé avec succès !`)
    } catch (error) {
      alert('Erreur lors du chargement du scénario')
    }
  }
  
  const deleteScenario = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce scénario ?')) {
      scenarios.value = scenarios.value.filter(s => s.id !== id)
      saveScenariosToStorage()
    }
  }
  
  const saveScenariosToStorage = () => {
    // En production, vous utiliseriez une vraie base de données
    // Ici on simule avec une variable en mémoire
    console.log('Scénarios sauvegardés:', scenarios.value)
  }
  
  const loadSavedScenarios = () => {
    // Charger des scénarios d'exemple
    scenarios.value = [
      {
        id: 'example1',
        name: 'Test API Utilisateur',
        description: 'Test de récupération des données utilisateur',
        blocks: 2,
        xml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="http_request" id="test1"><field name="METHOD">GET</field></block></xml>',
        created: new Date().toISOString()
      }
    ]
  }
  
  const saveScenario = () => {
    activeTab.value = 'scenarios'
  }
  
  const loadScenario = () => {
    activeTab.value = 'scenarios'
  }
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }
  </script>
  
  <style scoped>
  .blockly-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .header h2 {
    margin: 0;
    font-weight: 600;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-primary { background: #4f46e5; color: white; }
  .btn-success { background: #10b981; color: white; }
  .btn-info { background: #06b6d4; color: white; }
  .btn-secondary { background: #6b7280; color: white; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
  
  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    width: 100%;
    min-width: 0;
    min-height: 0;
  }
  
  .blockly-workspace {
    flex: 1;
    position: relative;
  }
  
  .blockly-editor {
    width: 100%;
    height: 100%;
  }
  
  .side-panel {
    width: 400px;
    background: #f8fafc;
    border-left: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
  }
  
  .tabs {
    display: flex;
    background: white;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .tab {
    flex: 1;
    padding: 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 500;
    color: #64748b;
    transition: all 0.2s;
  }
  
  .tab.active {
    color: #4f46e5;
    background: #f8fafc;
    border-bottom: 2px solid #4f46e5;
  }
  
  .tab:hover {
    background: #f1f5f9;
  }
  
  .tab-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }
  
  .code-panel h3,
  .results-panel h3,
  .scenarios-panel h3 {
    margin: 0 0 1rem 0;
    color: #1e293b;
    font-size: 1.1rem;
  }
  
  .code-block {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  
  .no-results {
    text-align: center;
    color: #64748b;
    padding: 2rem;
  }
  
  .result-item {
    background: white;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-left: 4px solid transparent;
  }
  
  .result-item.success {
    border-left-color: #10b981;
  }
  
  .result-item.error {
    border-left-color: #ef4444;
  }
  
  .result-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .method {
    background: #e2e8f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .url {
    color: #64748b;
    font-size: 0.875rem;
  }
  
  .result-details {
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .error-msg {
    color: #ef4444;
    font-weight: 500;
  }
  
  .scenario-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .scenarios-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .scenario-item {
    background: white;
    border-radius: 6px;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .scenario-info h4 {
    margin: 0 0 0.25rem 0;
    color: #1e293b;
  }
  
  .scenario-info p {
    margin: 0 0 0.5rem 0;
    color: #64748b;
    font-size: 0.875rem;
  }
  
  .scenario-info small {
    color: #9ca3af;
    font-size: 0.75rem;
  }
  
  .scenario-actions {
    display: flex;
    gap: 0.25rem;
  }
  
  .icon {
    font-size: 1rem;
  }
  </style>