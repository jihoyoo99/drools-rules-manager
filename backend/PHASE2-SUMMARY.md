# Phase 2: Backend Foundation - Summary

## Overview

The Drools Rules Manager backend is a Node.js/Express API that provides Excel processing capabilities for Drools Decision Tables. It supports uploading, parsing, and generating Excel files while maintaining compatibility with the Drools Decision Table format.

## Quick Start Guide

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation & Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Verify server is running:**
   - Server starts on port 3000 (configurable via PORT env var)
   - Health check: `GET http://localhost:3000/api/health`
   - Uploads directory is created automatically on startup

### Production Deployment

```bash
npm start
```

## API Endpoints Documentation

### Base URL
```
http://localhost:3000/api
```

### 1. Health Check
**GET** `/health`

Returns server health status and basic information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-03T13:07:03.433Z",
  "uptime": 15.092049216,
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Upload Excel File
**POST** `/excel/upload`

Uploads an Excel file and validates its Drools Decision Table format.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `excelFile`
- File types: `.xlsx`, `.xls`
- Max size: 10MB

**Example:**
```bash
curl -X POST http://localhost:3000/api/excel/upload \
  -F "excelFile=@sample-drools-table.xlsx"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "originalName": "sample-drools-table.xlsx",
    "filename": "excelFile-1759160954018-766436828.xlsx",
    "size": 7122,
    "mimetype": "application/octet-stream",
    "path": "/path/to/uploaded/file.xlsx"
  },
  "validation": {
    "isValid": true,
    "errors": []
  },
  "timestamp": "2025-10-03T13:07:03.433Z"
}
```

### 3. Parse Excel File
**POST** `/excel/parse`

Parses an uploaded Excel file and extracts Drools Decision Table data.

**Request:**
```json
{
  "filePath": "/path/to/uploaded/file.xlsx"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/excel/parse \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/path/to/uploaded/file.xlsx"}'
```

**Response:** See [JSON Data Structure Reference](#json-data-structure-reference) below.

### 4. Generate Excel File
**POST** `/excel/generate`

Generates an Excel file from Drools Decision Table JSON data.

**Request:** JSON data structure (see reference below)

**Response:**
```json
{
  "message": "Excel file generated successfully",
  "file": {
    "filename": "generated-rules-1759160954018-766436828.xlsx",
    "path": "/path/to/generated/file.xlsx",
    "downloadUrl": "/uploads/generated-rules-1759160954018-766436828.xlsx"
  },
  "timestamp": "2025-10-03T13:07:03.433Z"
}
```

## Integration Guide for Phase 3 Frontend

### Angular Service Integration

1. **Create Excel Service:**
   ```typescript
   @Injectable()
   export class ExcelService {
     private apiUrl = 'http://localhost:3000/api/excel';
     
     uploadFile(file: File): Observable<UploadResponse> {
       const formData = new FormData();
       formData.append('excelFile', file);
       return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
     }
     
     parseFile(filePath: string): Observable<ParseResponse> {
       return this.http.post<ParseResponse>(`${this.apiUrl}/parse`, { filePath });
     }
     
     generateFile(data: DroolsTableData): Observable<GenerateResponse> {
       return this.http.post<GenerateResponse>(`${this.apiUrl}/generate`, data);
     }
   }
   ```

2. **File Upload Component:**
   ```typescript
   onFileSelect(event: any) {
     const file = event.target.files[0];
     this.excelService.uploadFile(file).subscribe(response => {
       // Handle upload response
       this.parseFile(response.file.path);
     });
   }
   ```

3. **Error Handling:**
   ```typescript
   .pipe(
     catchError(error => {
       console.error('API Error:', error.error);
       return throwError(error);
     })
   )
   ```

### CORS Configuration
The backend is configured to accept requests from `http://localhost:4200` (Angular default). Update `CORS_ORIGIN` environment variable for different frontend URLs.

### File Management
- Uploaded files are stored in `backend/uploads/`
- Files are accessible via `/uploads/{filename}` static route
- Generated files include download URLs for frontend access

## JSON Data Structure Reference

### Parse Response Format

The `/excel/parse` endpoint returns a comprehensive JSON structure representing the Drools Decision Table:

```json
{
  "message": "Excel file parsed successfully",
  "data": {
    "metadata": {
      "ruleSet": "com.example.drools.rules",
      "imports": [
        "com.example.model.Customer",
        "com.example.model.Customer.CustomerLifeStage",
        "com.example.model.Offer"
      ],
      "variables": ["com.example.model.Offer offer"],
      "notes": "Sample decision table description"
    },
    "ruleTable": {
      "name": "Product Offering Rules",
      "columns": [
        {
          "id": "col_1",
          "index": 1,
          "type": "NAME",
          "objectBinding": "",
          "patternTemplate": "",
          "label": "Rule Name"
        },
        {
          "id": "col_2",
          "index": 2,
          "type": "CONDITION",
          "objectBinding": "$customer:Customer",
          "patternTemplate": "$customer.getLifeStage() == ($param)",
          "label": "Life Stage"
        },
        {
          "id": "col_3",
          "index": 3,
          "type": "ACTION",
          "objectBinding": "",
          "patternTemplate": "offer.setProductPackage($param);",
          "label": "Product Package"
        }
      ],
      "rules": [
        {
          "id": "rule_11",
          "rowIndex": 11,
          "ruleName": "CareerFocusedPackage",
          "conditions": {
            "col_2": {
              "label": "Life Stage",
              "patternTemplate": "$customer.getLifeStage() == ($param)",
              "value": "CustomerLifeStage.CAREERFOCUSED"
            }
          },
          "actions": {
            "col_3": {
              "label": "Product Package",
              "patternTemplate": "offer.setProductPackage($param);",
              "value": "ProductPackage.CAREERFOCUSED_PACKAGE"
            }
          }
        }
      ],
      "startRow": 6,
      "headerRows": {
        "columnTypes": 7,
        "objectBinding": 8,
        "patternTemplates": 9,
        "columnLabels": 10
      }
    },
    "worksheetName": "ProductOffering",
    "totalRows": 14,
    "totalColumns": 6
  },
  "timestamp": "2025-10-03T13:07:03.433Z"
}
```

### Key Data Structure Components

#### Metadata Object
- **ruleSet**: Java package name for the rule set
- **imports**: Array of Java class imports required by the rules
- **variables**: Array of global variable declarations
- **notes**: Description or comments about the decision table

#### Column Object
- **id**: Unique identifier for the column
- **index**: Column position (1-based)
- **type**: Column type (`NAME`, `CONDITION`, or `ACTION`)
- **objectBinding**: Object binding pattern (e.g., `$customer:Customer`)
- **patternTemplate**: Pattern template with `$param` placeholder
- **label**: Human-readable column name

#### Rule Object
- **id**: Unique identifier for the rule
- **rowIndex**: Excel row number where the rule is defined
- **ruleName**: Name of the rule
- **conditions**: Object mapping column IDs to condition values
- **actions**: Object mapping column IDs to action values

## Important Notes for Phase 3

### Excel Processing Capabilities

1. **Format Validation:**
   - Validates Drools Decision Table structure
   - Checks for required metadata rows (RuleSet, Import, Variables)
   - Validates rule table headers and structure

2. **Data Extraction:**
   - Preserves Excel formatting and structure
   - Maintains column relationships and dependencies
   - Extracts rule logic with parameter substitution

3. **File Generation:**
   - Creates Excel files compatible with Drools engine
   - Maintains proper cell formatting and merged cells
   - Preserves metadata and rule table structure

### Frontend Development Considerations

1. **Rule Editing:**
   - Use the column structure to build dynamic forms
   - Validate rule values against column types
   - Handle condition/action parameter substitution

2. **Table Display:**
   - Use ag-Grid or similar for spreadsheet-like interface
   - Map JSON structure to grid columns and rows
   - Implement inline editing with validation

3. **File Management:**
   - Handle file upload progress and validation
   - Provide download links for generated files
   - Implement error handling for file operations

4. **State Management:**
   - Use Angular services to manage rule data
   - Implement undo/redo functionality
   - Handle concurrent editing scenarios

### Testing Data

Sample Excel file available at: `backend/test-data/sample-drools-table.xlsx`

This file contains:
- Complete Drools metadata (RuleSet, Import, Variables, Notes)
- 4 sample rules with various conditions and actions
- Proper Excel formatting and structure

Use this file for frontend development and testing.

## Dependencies

### Core Dependencies
- **express**: Web framework
- **exceljs**: Excel file processing
- **multer**: File upload handling
- **joi**: Data validation
- **winston**: Logging
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware

### Development Dependencies
- **nodemon**: Development server with auto-restart
- **dotenv**: Environment variable management

## Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Next Steps for Phase 3

1. **Angular Project Setup:**
   - Initialize Angular project in `frontend/` directory
   - Install ag-Grid, Angular Material, or preferred UI library
   - Set up routing and basic project structure

2. **Core Components:**
   - File upload component
   - Rule table display/editor component
   - Rule form component for adding/editing rules
   - Navigation and layout components

3. **Services:**
   - Excel service for API communication
   - Rule management service for state handling
   - Validation service for rule data

4. **Integration:**
   - Connect frontend to backend APIs
   - Implement file upload and parsing workflow
   - Build rule editing and generation features

The backend foundation is complete and ready to support the Angular frontend development in Phase 3.
