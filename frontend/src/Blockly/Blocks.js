import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

// Vérifier que Blockly.Blocks existe
if (!Blockly.Blocks) {
  Blockly.Blocks = Object.create(null);
}


export function defineHttpRequestBlock() {
  // Bloc de requête HTTP principal
  Blockly.Blocks['http_request'] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Requête HTTP")
        .appendField(new Blockly.FieldDropdown([
          ["GET", "GET"],
          ["POST", "POST"],
          ["PUT", "PUT"],
          ["DELETE", "DELETE"]
        ]), "METHOD")
      this.appendValueInput("URL")
        .setCheck("String")
        .appendField("URL")
      this.appendValueInput("HEADERS")
        .setCheck("String")
        .appendField("Headers (JSON)")
      this.appendValueInput("BODY")
        .setCheck("String")
        .appendField("Corps")
      this.appendStatementInput("ASSERTIONS")
        .setCheck(null)
        .appendField("Assertions")
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour(230)
      this.setTooltip("Effectue une requête HTTP avec assertions")
    }
  }

  // Bloc d'assertion de statut
  Blockly.Blocks['assert_status'] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Vérifier statut")
        .appendField(new Blockly.FieldDropdown([
          ["200 - OK", "200"],
          ["201 - Created", "201"],
          ["400 - Bad Request", "400"],
          ["401 - Unauthorized", "401"],
          ["404 - Not Found", "404"],
          ["500 - Server Error", "500"]
        ]), "STATUS")
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour(120)
      this.setTooltip("Vérifie que le statut de la réponse correspond")
    }
  }

  // Bloc d'assertion de contenu
  Blockly.Blocks['assert_contains'] = {
    init: function () {
      this.appendValueInput("CONTENT")
        .setCheck("String")
        .appendField("Vérifier que la réponse contient")
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour(120)
      this.setTooltip("Vérifie que la réponse contient un texte spécifique")
    }
  }

  // Bloc d'assertion JSON
  Blockly.Blocks['assert_json_path'] = {
    init: function () {
      this.appendValueInput("PATH")
        .setCheck("String")
        .appendField("Vérifier JSON path")
      this.appendValueInput("VALUE")
        .setCheck("String")
        .appendField("égal à")
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour(120)
      this.setTooltip("Vérifie une valeur spécifique dans la réponse JSON")
    }
  }

  // Bloc de délai
  Blockly.Blocks['wait'] = {
    init: function () {
      this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("Attendre")
      this.appendDummyInput()
        .appendField("secondes")
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour(290)
      this.setTooltip("Attendre un certain nombre de secondes")
    }
  }

  // Bloc de log
  Blockly.Blocks['log_message'] = {
    init: function () {
      this.appendValueInput("MESSAGE")
        .setCheck("String")
        .appendField("Afficher")
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour(160)
      this.setTooltip("Affiche un message dans la console")
    }
  }

  // Bloc d'authentification
  Blockly.Blocks['auth_request'] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Authentification")
        .appendField(new Blockly.FieldDropdown([
          ["Bearer Token", "BEARER"],
          ["Basic Auth", "BASIC"]
        ]), "AUTH_TYPE")
      this.appendValueInput("TOKEN")
        .setCheck("String")
        .appendField("Token / Identifiant")
      this.appendValueInput("SECRET")
        .setCheck("String")
        .appendField("Secret (optionnel)")
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour(20)
      this.setTooltip("Ajoute une authentification à la requête")
    }
  }

  // Générateurs de code JavaScript
  javascriptGenerator.forBlock['http_request'] = function (block) {
    const method = block.getFieldValue('METHOD')
    const url = javascriptGenerator.valueToCode(block, 'URL', javascriptGenerator.ORDER_ATOMIC) || '""'
    const headers = javascriptGenerator.valueToCode(block, 'HEADERS', javascriptGenerator.ORDER_ATOMIC) || '"{}"'
    const body = javascriptGenerator.valueToCode(block, 'BODY', javascriptGenerator.ORDER_ATOMIC) || '""'
    const assertions = javascriptGenerator.statementToCode(block, 'ASSERTIONS')

    const code = `
// Requête ${method} vers ${url}
try {
  const response = await fetch(${url}, {
    method: '${method}',
    headers: Object.assign(
      { 'Content-Type': 'application/json' },
      JSON.parse(${headers})
    ),
    body: ${method === 'GET' || method === 'DELETE' ? 'null' : body}
  });
  
  const responseData = await response.text();
  let jsonData;
  try {
    jsonData = JSON.parse(responseData);
  } catch (e) {
    jsonData = null;
  }
  
  console.log('Response Status:', response.status);
  console.log('Response Data:', responseData);
  
  // Variables disponibles pour les assertions
  window.lastResponse = response;
  window.lastResponseData = responseData;
  window.lastResponseJson = jsonData;
  
  ${assertions}
  
} catch (error) {
  console.error('Erreur de requête:', error);
  throw error;
}
`;
    return code
  }

  javascriptGenerator.forBlock['assert_status'] = function (block) {
    const expectedStatus = block.getFieldValue('STATUS')
    const code = `
if (window.lastResponse.status !== ${expectedStatus}) {
  throw new Error(\`Status attendu: ${expectedStatus}, reçu: \${window.lastResponse.status}\`);
}
console.log('✅ Status ${expectedStatus} vérifié');
`;
    return code
  }

  javascriptGenerator.forBlock['assert_contains'] = function (block) {
    const content = javascriptGenerator.valueToCode(block, 'CONTENT', javascriptGenerator.ORDER_ATOMIC) || '""'
    const code = `
if (!window.lastResponseData.includes(${content})) {
  throw new Error(\`Contenu attendu non trouvé: \${${content}}\`);
}
console.log('✅ Contenu vérifié:', ${content});
`;
    return code
  }

  javascriptGenerator.forBlock['assert_json_path'] = function (block) {
    const path = javascriptGenerator.valueToCode(block, 'PATH', javascriptGenerator.ORDER_ATOMIC) || '""'
    const expectedValue = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '""'
    const code = `
if (!window.lastResponseJson) {
  throw new Error('Réponse JSON invalide pour la vérification de path');
}
const pathValue = window.lastResponseJson[${path}];
if (pathValue !== ${expectedValue}) {
  throw new Error(\`Valeur attendue pour \${${path}}: \${${expectedValue}}, reçu: \${pathValue}\`);
}
console.log('✅ JSON path vérifié:', ${path}, '=', ${expectedValue});
`;
    return code
  }

  javascriptGenerator.forBlock['wait'] = function (block) {
    const duration = javascriptGenerator.valueToCode(block, 'DURATION', javascriptGenerator.ORDER_ATOMIC) || '1'
    const code = `
console.log('⏱️ Attente de', ${duration}, 'secondes...');
await new Promise(resolve => setTimeout(resolve, ${duration} * 1000));
`;
    return code
  }

  javascriptGenerator.forBlock['log_message'] = function (block) {
    const message = javascriptGenerator.valueToCode(block, 'MESSAGE', javascriptGenerator.ORDER_ATOMIC) || '""'
    const code = `
console.log('📝', ${message});
`;
    return code
  }

  // Générateur de code pour le bloc d'authentification
  javascriptGenerator.forBlock['auth_request'] = function (block) {
    const authType = block.getFieldValue('AUTH_TYPE')
    const token = javascriptGenerator.valueToCode(block, 'TOKEN', javascriptGenerator.ORDER_ATOMIC) || '""'
    const secret = javascriptGenerator.valueToCode(block, 'SECRET', javascriptGenerator.ORDER_ATOMIC) || '""'
    let code = ''
    if (authType === 'BEARER') {
      code = `if (!window.headers) window.headers = {};\nwindow.headers['Authorization'] = 'Bearer ' + ${token};\n`;
    } else if (authType === 'BASIC') {
      code = `if (!window.headers) window.headers = {};\nwindow.headers['Authorization'] = 'Basic ' + btoa(${token} + ':' + ${secret});\n`;
    }
    return code
  }
}