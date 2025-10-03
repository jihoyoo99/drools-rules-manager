# Drools Rules Manager Backend API

## Overview

The Drools Rules Manager Backend provides REST API endpoints for managing Excel-based Drools Decision Tables. The API supports uploading, parsing, and generating Excel files while maintaining compatibility with the Drools Decision Table format.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for API endpoints (development phase).

## Endpoints

### Health Check

**GET** `/health`

Returns the health status of the API server.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-29T15:49:13.858Z",
  "uptime": 15.092049216,
  "environment": "development",
  "version": "1.0.0"
}
```

### Upload Excel File

**POST** `/excel/upload`

Uploads an Excel file and validates its Drools Decision Table format.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `excelFile` field containing the Excel file

**Example:**
```bash
curl -X POST http://localhost:3000/api/excel/upload \
  -F "excelFile=@path/to/your/file.xlsx"
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
    "path": "/home/ubuntu/repos/drools-rules-manager/backend/uploads/excelFile-1759160954018-766436828.xlsx"
  },
  "validation": {
    "isValid": true,
    "errors": []
  },
  "timestamp": "2025-09-29T15:49:14.052Z"
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded or invalid file format
- `413 Payload Too Large`: File exceeds 10MB limit

### Parse Excel File

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
  -d '{"filePath": "/home/ubuntu/repos/drools-rules-manager/backend/uploads/excelFile-1759160954018-766436828.xlsx"}'
```

**Response:**
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
      "notes": "Sample decision table for product offering"
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
          "id": "col_5",
          "index": 5,
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
            "col_5": {
              "label": "Product Package",
              "patternTemplate": "offer.setProductPackage($param);",
              "value": "ProductPackage.CAREERFOCUSED_PACKAGE"
            }
          }
        }
      ]
    },
    "worksheetName": "ProductOffering",
    "totalRows": 14,
    "totalColumns": 6
  },
  "timestamp": "2025-09-29T15:49:22.784Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing file path or invalid Excel format
- `404 Not Found`: File not found at specified path

### Generate Excel File

**POST** `/excel/generate`

Generates an Excel file from Drools Decision Table JSON data.

**Request:**
```json
{
  "metadata": {
    "ruleSet": "com.test.rules",
    "imports": ["com.test.model.Customer"],
    "variables": ["com.test.model.Offer offer"],
    "notes": "Test generated rules"
  },
  "ruleTable": {
    "name": "Test Rules",
    "columns": [
      {
        "id": "col_1",
        "index": 1,
        "type": "NAME",
        "label": "Rule Name"
      },
      {
        "id": "col_2",
        "index": 2,
        "type": "CONDITION",
        "objectBinding": "$customer:Customer",
        "patternTemplate": "$customer.getAge() > ($param)",
        "label": "Age"
      },
      {
        "id": "col_3",
        "index": 3,
        "type": "ACTION",
        "patternTemplate": "offer.setDiscount($param);",
        "label": "Discount"
      }
    ],
    "rules": [
      {
        "id": "rule_1",
        "ruleName": "SeniorDiscount",
        "conditions": {
          "col_2": {
            "value": "65"
          }
        },
        "actions": {
          "col_3": {
            "value": "10"
          }
        }
      }
    ]
  },
  "worksheetName": "TestRules"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/excel/generate \
  -H "Content-Type: application/json" \
  -d @request-data.json
```

**Response:**
```json
{
  "message": "Excel file generated successfully",
  "file": {
    "filename": "generated-rules-1759160954018-766436828.xlsx",
    "path": "/home/ubuntu/repos/drools-rules-manager/backend/uploads/generated-rules-1759160954018-766436828.xlsx",
    "downloadUrl": "/uploads/generated-rules-1759160954018-766436828.xlsx"
  },
  "timestamp": "2025-09-29T15:49:30.123Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid JSON data or missing required fields

## Data Models

### Metadata Object
```json
{
  "ruleSet": "string (required) - Java package name",
  "imports": ["string"] - Array of Java class imports",
  "variables": ["string"] - Array of global variable declarations",
  "notes": "string - Description of the decision table"
}
```

### Column Object
```json
{
  "id": "string (required) - Unique column identifier",
  "index": "number (required) - Column position (1-based)",
  "type": "string (required) - NAME|CONDITION|ACTION",
  "objectBinding": "string - Object binding pattern (e.g., $customer:Customer)",
  "patternTemplate": "string - Pattern with $param placeholder",
  "label": "string (required) - Human-readable column name"
}
```

### Rule Object
```json
{
  "id": "string (required) - Unique rule identifier",
  "ruleName": "string (required) - Rule name",
  "conditions": {
    "col_id": {
      "label": "string",
      "patternTemplate": "string",
      "value": "string - Parameter value"
    }
  },
  "actions": {
    "col_id": {
      "label": "string", 
      "patternTemplate": "string",
      "value": "string - Parameter value"
    }
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2025-09-29T15:49:30.123Z",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:
- `200 OK`: Successful operation
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Server error

## File Limits

- Maximum file size: 10MB
- Supported formats: .xlsx, .xls
- Upload directory: `/uploads`

## Development Setup

1. Install dependencies: `npm install`
2. Copy environment file: `cp .env.example .env`
3. Start development server: `npm run dev`
4. Server runs on: `http://localhost:3000`

## Testing

Use the provided sample Excel file for testing:
```bash
# Upload and parse sample file
curl -X POST http://localhost:3000/api/excel/upload -F "excelFile=@test-data/sample-drools-table.xlsx"
```

The sample file contains a complete Drools Decision Table with:
- Metadata (RuleSet, Import, Variables, Notes)
- 4 sample rules with conditions and actions
- Proper Drools format structure
