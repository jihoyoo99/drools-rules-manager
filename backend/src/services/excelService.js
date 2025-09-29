const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class ExcelService {
  constructor() {
    this.workbook = null;
  }

  async parseExcelFile(filePath) {
    try {
      logger.info(`Parsing Excel file: ${filePath}`);
      
      this.workbook = new ExcelJS.Workbook();
      await this.workbook.xlsx.readFile(filePath);
      
      const worksheet = this.workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }

      const droolsData = await this.parseDroolsDecisionTable(worksheet);
      
      logger.info('Excel file parsed successfully');
      return droolsData;
    } catch (error) {
      logger.error('Error parsing Excel file:', error);
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  async parseDroolsDecisionTable(worksheet) {
    try {
      const metadata = this.extractMetadata(worksheet);
      const ruleTable = this.extractRuleTable(worksheet);
      
      return {
        metadata,
        ruleTable,
        worksheetName: worksheet.name,
        totalRows: worksheet.rowCount,
        totalColumns: worksheet.columnCount
      };
    } catch (error) {
      logger.error('Error parsing Drools decision table:', error);
      throw new Error(`Drools format parsing failed: ${error.message}`);
    }
  }

  extractMetadata(worksheet) {
    const metadata = {};
    
    try {
      const ruleSetCell = worksheet.getCell('A1');
      if (ruleSetCell.value && ruleSetCell.value.toString().startsWith('RuleSet')) {
        const ruleSetValue = worksheet.getCell('B1').value;
        metadata.ruleSet = ruleSetValue ? ruleSetValue.toString() : '';
      }

      const importCell = worksheet.getCell('A2');
      if (importCell.value && importCell.value.toString().startsWith('Import')) {
        const importValue = worksheet.getCell('B2').value;
        metadata.imports = importValue ? importValue.toString().split(',').map(imp => imp.trim()) : [];
      }

      const variablesCell = worksheet.getCell('A3');
      if (variablesCell.value && variablesCell.value.toString().startsWith('Variables')) {
        const variablesValue = worksheet.getCell('B3').value;
        metadata.variables = variablesValue ? variablesValue.toString().split(',').map(variable => variable.trim()) : [];
      }

      const notesCell = worksheet.getCell('A4');
      if (notesCell.value && notesCell.value.toString().startsWith('Notes')) {
        const notesValue = worksheet.getCell('B4').value;
        metadata.notes = notesValue ? notesValue.toString() : '';
      }

      logger.info('Metadata extracted successfully');
      return metadata;
    } catch (error) {
      logger.error('Error extracting metadata:', error);
      throw new Error(`Metadata extraction failed: ${error.message}`);
    }
  }

  extractRuleTable(worksheet) {
    try {
      let ruleTableRow = 6;
      const ruleTableCell = worksheet.getCell(`A${ruleTableRow}`);
      
      if (!ruleTableCell.value || !ruleTableCell.value.toString().startsWith('RuleTable')) {
        for (let row = 5; row <= 10; row++) {
          const cell = worksheet.getCell(`A${row}`);
          if (cell.value && cell.value.toString().startsWith('RuleTable')) {
            ruleTableRow = row;
            break;
          }
        }
      }

      const ruleTableName = ruleTableCell.value ? ruleTableCell.value.toString().replace('RuleTable ', '') : 'Unknown';

      const columnTypesRow = ruleTableRow + 1;
      const objectBindingRow = ruleTableRow + 2;
      const patternTemplatesRow = ruleTableRow + 3;
      const columnLabelsRow = ruleTableRow + 4;
      const firstRuleRow = ruleTableRow + 5;

      const columns = this.extractColumns(worksheet, columnTypesRow, objectBindingRow, patternTemplatesRow, columnLabelsRow);
      const rules = this.extractRules(worksheet, firstRuleRow, columns);

      return {
        name: ruleTableName,
        columns,
        rules,
        startRow: ruleTableRow,
        headerRows: {
          columnTypes: columnTypesRow,
          objectBinding: objectBindingRow,
          patternTemplates: patternTemplatesRow,
          columnLabels: columnLabelsRow
        }
      };
    } catch (error) {
      logger.error('Error extracting rule table:', error);
      throw new Error(`Rule table extraction failed: ${error.message}`);
    }
  }

  extractColumns(worksheet, columnTypesRow, objectBindingRow, patternTemplatesRow, columnLabelsRow) {
    const columns = [];
    let columnIndex = 1;

    while (columnIndex <= worksheet.columnCount) {
      const columnTypeCell = worksheet.getCell(columnTypesRow, columnIndex);
      const columnType = columnTypeCell.value ? columnTypeCell.value.toString().trim() : '';

      if (!columnType || columnType === '') {
        columnIndex++;
        continue;
      }

      const objectBindingCell = worksheet.getCell(objectBindingRow, columnIndex);
      const patternTemplateCell = worksheet.getCell(patternTemplatesRow, columnIndex);
      const columnLabelCell = worksheet.getCell(columnLabelsRow, columnIndex);

      const column = {
        id: `col_${columnIndex}`,
        index: columnIndex,
        type: columnType,
        objectBinding: objectBindingCell.value ? objectBindingCell.value.toString().trim() : '',
        patternTemplate: patternTemplateCell.value ? patternTemplateCell.value.toString().trim() : '',
        label: columnLabelCell.value ? columnLabelCell.value.toString().trim() : `Column ${columnIndex}`
      };

      columns.push(column);
      columnIndex++;
    }

    logger.info(`Extracted ${columns.length} columns`);
    return columns;
  }

  extractRules(worksheet, firstRuleRow, columns) {
    const rules = [];
    let ruleRow = firstRuleRow;

    while (ruleRow <= worksheet.rowCount) {
      const ruleNameCell = worksheet.getCell(ruleRow, 1);
      const ruleName = ruleNameCell.value ? ruleNameCell.value.toString().trim() : '';

      if (!ruleName || ruleName === '') {
        ruleRow++;
        continue;
      }

      const rule = {
        id: `rule_${ruleRow}`,
        rowIndex: ruleRow,
        ruleName,
        conditions: {},
        actions: {}
      };

      columns.forEach(column => {
        if (column.index === 1) return;

        const cellValue = worksheet.getCell(ruleRow, column.index).value;
        const value = cellValue ? cellValue.toString().trim() : '';

        if (column.type === 'CONDITION') {
          rule.conditions[column.id] = {
            label: column.label,
            patternTemplate: column.patternTemplate,
            value
          };
        } else if (column.type === 'ACTION') {
          rule.actions[column.id] = {
            label: column.label,
            patternTemplate: column.patternTemplate,
            value
          };
        }
      });

      rules.push(rule);
      ruleRow++;
    }

    logger.info(`Extracted ${rules.length} rules`);
    return rules;
  }

  async generateExcelFile(droolsData, outputPath) {
    try {
      logger.info(`Generating Excel file: ${outputPath}`);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(droolsData.worksheetName || 'Rules');

      this.writeMetadata(worksheet, droolsData.metadata);
      this.writeRuleTable(worksheet, droolsData.ruleTable);

      await workbook.xlsx.writeFile(outputPath);
      
      logger.info('Excel file generated successfully');
      return outputPath;
    } catch (error) {
      logger.error('Error generating Excel file:', error);
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  writeMetadata(worksheet, metadata) {
    if (metadata.ruleSet) {
      worksheet.getCell('A1').value = 'RuleSet';
      worksheet.getCell('B1').value = metadata.ruleSet;
    }

    if (metadata.imports && metadata.imports.length > 0) {
      worksheet.getCell('A2').value = 'Import';
      worksheet.getCell('B2').value = metadata.imports.join(', ');
    }

    if (metadata.variables && metadata.variables.length > 0) {
      worksheet.getCell('A3').value = 'Variables';
      worksheet.getCell('B3').value = metadata.variables.join(', ');
    }

    if (metadata.notes) {
      worksheet.getCell('A4').value = 'Notes';
      worksheet.getCell('B4').value = metadata.notes;
    }
  }

  writeRuleTable(worksheet, ruleTable) {
    const startRow = 6;
    
    worksheet.getCell(`A${startRow}`).value = `RuleTable ${ruleTable.name}`;

    const columnTypesRow = startRow + 1;
    const objectBindingRow = startRow + 2;
    const patternTemplatesRow = startRow + 3;
    const columnLabelsRow = startRow + 4;
    const firstRuleRow = startRow + 5;

    worksheet.getCell(columnTypesRow, 1).value = 'NAME';
    worksheet.getCell(objectBindingRow, 1).value = '';
    worksheet.getCell(patternTemplatesRow, 1).value = '';
    worksheet.getCell(columnLabelsRow, 1).value = 'Rule Name';

    ruleTable.columns.forEach(column => {
      if (column.index === 1) return;
      
      worksheet.getCell(columnTypesRow, column.index).value = column.type;
      worksheet.getCell(objectBindingRow, column.index).value = column.objectBinding;
      worksheet.getCell(patternTemplatesRow, column.index).value = column.patternTemplate;
      worksheet.getCell(columnLabelsRow, column.index).value = column.label;
    });

    ruleTable.rules.forEach((rule, index) => {
      const ruleRow = firstRuleRow + index;
      worksheet.getCell(ruleRow, 1).value = rule.ruleName;

      ruleTable.columns.forEach(column => {
        if (column.index === 1) return;

        let value = '';
        if (column.type === 'CONDITION' && rule.conditions[column.id]) {
          value = rule.conditions[column.id].value;
        } else if (column.type === 'ACTION' && rule.actions[column.id]) {
          value = rule.actions[column.id].value;
        }

        worksheet.getCell(ruleRow, column.index).value = value;
      });
    });
  }

  async validateDroolsFormat(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No worksheet found');
      }

      const validationErrors = [];

      const ruleSetCell = worksheet.getCell('A1');
      if (!ruleSetCell.value || !ruleSetCell.value.toString().startsWith('RuleSet')) {
        validationErrors.push('Missing or invalid RuleSet declaration in A1');
      }

      let ruleTableFound = false;
      for (let row = 5; row <= 10; row++) {
        const cell = worksheet.getCell(`A${row}`);
        if (cell.value && cell.value.toString().startsWith('RuleTable')) {
          ruleTableFound = true;
          break;
        }
      }

      if (!ruleTableFound) {
        validationErrors.push('RuleTable declaration not found in expected rows (5-10)');
      }

      return {
        isValid: validationErrors.length === 0,
        errors: validationErrors
      };
    } catch (error) {
      logger.error('Error validating Drools format:', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`]
      };
    }
  }
}

module.exports = new ExcelService();
