export interface DroolsMetadata {
  ruleSet: string;
  imports: string[];
  variables: string[];
  notes: string;
}

export interface DroolsColumn {
  id: string;
  index: number;
  type: 'NAME' | 'CONDITION' | 'ACTION';
  objectBinding: string;
  patternTemplate: string;
  label: string;
}

export interface RuleCondition {
  label: string;
  patternTemplate: string;
  value: string;
}

export interface RuleAction {
  label: string;
  patternTemplate: string;
  value: string;
}

export interface DroolsRule {
  id: string;
  rowIndex?: number;
  ruleName: string;
  conditions: { [columnId: string]: RuleCondition };
  actions: { [columnId: string]: RuleAction };
}

export interface DroolsRuleTable {
  name: string;
  columns: DroolsColumn[];
  rules: DroolsRule[];
  startRow?: number;
  headerRows?: {
    columnTypes: number;
    objectBinding: number;
    patternTemplates: number;
    columnLabels: number;
  };
}

export interface DroolsTableData {
  metadata: DroolsMetadata;
  ruleTable: DroolsRuleTable;
  worksheetName: string;
  totalRows?: number;
  totalColumns?: number;
}

export interface ParseResponse {
  message: string;
  data: DroolsTableData;
  timestamp: string;
}

export interface UploadResponse {
  message: string;
  file: {
    originalName: string;
    filename: string;
    size: number;
    mimetype: string;
    path: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
  };
  timestamp: string;
}

export interface GenerateResponse {
  message: string;
  file: {
    filename: string;
    path: string;
    downloadUrl: string;
  };
  timestamp: string;
}
