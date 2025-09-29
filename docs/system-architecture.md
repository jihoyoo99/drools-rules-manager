# System Architecture

## Overview

The Drools Decision Table Rules Manager follows a modern web application architecture with clear separation between frontend presentation, backend API services, and external integrations. The system enables business users to manage Drools decision table rules through a web interface while maintaining Git-based version control.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web Browser                              │
├─────────────────────────────────────────────────────────────────┤
│                    Angular Frontend                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Rule Editor   │ │  File Manager   │ │  Git Operations │   │
│  │   Component     │ │   Component     │ │   Component     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                ag-Grid Data Grid                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                NgRx State Management                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js Backend                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Excel API     │ │   Rules API     │ │    Git API      │   │
│  │   Controller    │ │   Controller    │ │   Controller    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Excel         │ │   Rules         │ │    Git          │   │
│  │   Service       │ │   Service       │ │   Service       │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              In-Memory Data Store                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    External Integrations                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Git Repository│ │   GitHub API    │ │   File System   │   │
│  │   (Clone/Pull)  │ │  (Pull Requests)│ │  (Excel Files)  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### 1. Rule Editor Component
**Purpose**: Main interface for editing Drools decision table rules

**Responsibilities**:
- Render ag-Grid with Excel-like interface
- Handle cell editing and validation
- Manage rule addition/deletion
- Integrate with NgRx for state management

**Key Features**:
- In-place cell editing
- Row/column operations
- Data validation
- Undo/redo functionality

#### 2. File Manager Component
**Purpose**: Manage Excel file operations and Git repository interaction

**Responsibilities**:
- Display available Excel files from Git repository
- Handle file selection and loading
- Manage file upload/download
- Show file modification status

**Key Features**:
- File browser interface
- Git status indicators
- File preview capabilities
- Conflict resolution UI

#### 3. Git Operations Component
**Purpose**: Handle version control operations

**Responsibilities**:
- Create and manage branches
- Commit changes with messages
- Create pull requests
- Display Git history and status

**Key Features**:
- Branch management UI
- Commit history visualization
- Pull request creation form
- Merge conflict resolution

### Backend Services

#### 1. Excel Service
**Purpose**: Handle Excel file processing and Drools format validation

**Responsibilities**:
- Parse Excel files using ExcelJS
- Validate Drools decision table format
- Convert between Excel and internal rule representation
- Preserve Excel formatting and structure

**Key Methods**:
```javascript
class ExcelService {
  async parseExcelFile(filePath)
  async validateDroolsFormat(workbook)
  async saveExcelFile(rules, filePath)
  async convertToRuleData(worksheet)
  async convertFromRuleData(rules, worksheet)
}
```

#### 2. Rules Service
**Purpose**: Manage rule data and business logic validation

**Responsibilities**:
- CRUD operations for rules
- Rule validation against business constraints
- Rule data transformation
- In-memory storage management

**Key Methods**:
```javascript
class RulesService {
  async getRules(fileId)
  async createRule(fileId, ruleData)
  async updateRule(fileId, ruleId, ruleData)
  async deleteRule(fileId, ruleId)
  async validateRule(ruleData)
}
```

#### 3. Git Service
**Purpose**: Handle Git operations and GitHub integration

**Responsibilities**:
- Clone and pull from Git repositories
- Create branches and commits
- Push changes to remote repository
- Create pull requests via GitHub API

**Key Methods**:
```javascript
class GitService {
  async cloneRepository(repoUrl, localPath)
  async pullLatest(localPath)
  async createBranch(localPath, branchName)
  async commitChanges(localPath, message, files)
  async pushBranch(localPath, branchName)
  async createPullRequest(repoOwner, repoName, branchName, title, description)
}
```

## API Endpoints

### Excel File Operations

#### GET /api/files
**Purpose**: List available Excel files from Git repository
```json
{
  "files": [
    {
      "id": "discount-rules",
      "name": "DroolsDiscount.xlsx",
      "path": "rules/DroolsDiscount.xlsx",
      "lastModified": "2024-01-15T10:30:00Z",
      "size": 43520,
      "gitStatus": "clean"
    }
  ]
}
```

#### GET /api/files/:fileId
**Purpose**: Get Excel file content as rule data
```json
{
  "fileId": "discount-rules",
  "metadata": {
    "ruleSet": "net.cloudburo.drools",
    "imports": ["net.cloudburo.drools.model.Customer", "..."],
    "variables": ["net.cloudburo.drools.model.Offer offer"],
    "notes": "Product offering decision table"
  },
  "ruleTable": {
    "name": "Initial Product Offering",
    "columns": [
      {
        "id": "ruleName",
        "type": "NAME",
        "label": "Rule Name"
      },
      {
        "id": "customerType",
        "type": "CONDITION",
        "pattern": "$customer.getLifeStage() in ($param)",
        "label": "Customer type"
      },
      {
        "id": "discount",
        "type": "ACTION",
        "pattern": "offer.setDiscount($param);",
        "label": "Discount"
      }
    ],
    "rules": [
      {
        "id": "rule-1",
        "ruleName": "DiscountLevel1",
        "customerType": "CustomerLifeStage.CAREERFOCUSED",
        "discount": "5"
      }
    ]
  }
}
```

#### PUT /api/files/:fileId
**Purpose**: Update Excel file with modified rule data
```json
{
  "ruleTable": {
    "rules": [
      {
        "id": "rule-1",
        "ruleName": "DiscountLevel1",
        "customerType": "CustomerLifeStage.CAREERFOCUSED",
        "discount": "10"
      }
    ]
  }
}
```

### Rule Operations

#### POST /api/files/:fileId/rules
**Purpose**: Add new rule to decision table
```json
{
  "ruleName": "NewDiscountRule",
  "customerType": "CustomerLifeStage.FAMILY",
  "discount": "15"
}
```

#### PUT /api/files/:fileId/rules/:ruleId
**Purpose**: Update existing rule
```json
{
  "discount": "20"
}
```

#### DELETE /api/files/:fileId/rules/:ruleId
**Purpose**: Delete rule from decision table

### Git Operations

#### GET /api/git/status
**Purpose**: Get current Git repository status
```json
{
  "currentBranch": "main",
  "hasChanges": true,
  "modifiedFiles": ["rules/DroolsDiscount.xlsx"],
  "lastCommit": {
    "hash": "abc123",
    "message": "Update discount rules",
    "author": "user@example.com",
    "date": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/git/pull
**Purpose**: Pull latest changes from remote repository
```json
{
  "success": true,
  "updatedFiles": ["rules/DroolsDiscount.xlsx"],
  "conflicts": []
}
```

#### POST /api/git/commit
**Purpose**: Commit changes to local repository
```json
{
  "message": "Update discount rules for career-focused customers",
  "files": ["rules/DroolsDiscount.xlsx"]
}
```

#### POST /api/git/pull-request
**Purpose**: Create pull request on GitHub
```json
{
  "title": "Update discount rules",
  "description": "Modified discount percentages for career-focused customers",
  "baseBranch": "main",
  "headBranch": "feature/update-discounts"
}
```

## Data Flow

### 1. File Loading Flow
```
User selects file → Frontend calls GET /api/files/:fileId → 
Backend reads Excel file → ExcelJS parses file → 
Validates Drools format → Converts to rule data → 
Returns JSON to frontend → NgRx stores data → 
ag-Grid renders rules
```

### 2. Rule Editing Flow
```
User edits cell in ag-Grid → Frontend validates input → 
NgRx updates state → Frontend calls PUT /api/files/:fileId/rules/:ruleId → 
Backend validates rule data → Updates in-memory storage → 
Converts back to Excel format → Saves Excel file → 
Returns success response
```

### 3. Git Integration Flow
```
User clicks "Save to Git" → Frontend calls POST /api/git/commit → 
Backend creates Git branch → Commits Excel file changes → 
Calls POST /api/git/pull-request → GitHub API creates PR → 
Returns PR URL to frontend → User receives confirmation
```

## State Management (NgRx)

### State Structure
```typescript
interface AppState {
  files: {
    currentFileId: string | null;
    availableFiles: FileInfo[];
    loading: boolean;
    error: string | null;
  };
  rules: {
    metadata: RuleTableMetadata;
    columns: RuleColumn[];
    rules: Rule[];
    selectedRuleId: string | null;
    editingCellId: string | null;
    hasUnsavedChanges: boolean;
  };
  git: {
    currentBranch: string;
    hasChanges: boolean;
    modifiedFiles: string[];
    pullRequestUrl: string | null;
    operationInProgress: boolean;
  };
}
```

### Actions
```typescript
// File Actions
export const loadFiles = createAction('[Files] Load Files');
export const loadFileSuccess = createAction('[Files] Load File Success', props<{files: FileInfo[]}>());
export const selectFile = createAction('[Files] Select File', props<{fileId: string}>());

// Rule Actions
export const loadRules = createAction('[Rules] Load Rules', props<{fileId: string}>());
export const updateRule = createAction('[Rules] Update Rule', props<{ruleId: string, changes: Partial<Rule>}>());
export const addRule = createAction('[Rules] Add Rule', props<{rule: Rule}>());
export const deleteRule = createAction('[Rules] Delete Rule', props<{ruleId: string}>());

// Git Actions
export const commitChanges = createAction('[Git] Commit Changes', props<{message: string}>());
export const createPullRequest = createAction('[Git] Create Pull Request', props<{title: string, description: string}>());
```

## Security Architecture

### Authentication
- **Development**: Basic authentication or no authentication
- **Production**: GitHub OAuth integration
- **API Security**: JWT tokens for API access

### Authorization
- **Repository Access**: GitHub repository permissions
- **File Operations**: Read/write permissions based on Git access
- **Branch Protection**: Enforce pull request workflow

### Data Validation
- **Frontend**: Client-side validation for immediate feedback
- **Backend**: Server-side validation using Joi schemas
- **Business Rules**: Drools format validation and business constraint checking

## Error Handling

### Frontend Error Handling
```typescript
@Injectable()
export class ErrorHandlingService {
  handleApiError(error: HttpErrorResponse): Observable<never> {
    // Log error
    // Show user-friendly message
    // Dispatch error action to NgRx
  }
}
```

### Backend Error Handling
```javascript
class ErrorHandler {
  static handleExcelError(error) {
    // Excel parsing errors
    // Format validation errors
    // File system errors
  }
  
  static handleGitError(error) {
    // Git operation errors
    // Network connectivity errors
    // Authentication errors
  }
}
```

## Performance Considerations

### Frontend Performance
- **Virtual Scrolling**: Handle large rule sets in ag-Grid
- **Lazy Loading**: Load components and data on demand
- **Debounced Updates**: Batch rapid user input changes
- **Memoization**: Cache computed values in selectors

### Backend Performance
- **Streaming**: Process large Excel files without loading entirely into memory
- **Caching**: Cache parsed rule data and Git status
- **Async Operations**: Non-blocking I/O for file and Git operations
- **Connection Pooling**: Efficient resource management

## Scalability Considerations

### Current Architecture Limitations
- **Single User**: In-memory storage doesn't support concurrent users
- **File Locking**: No mechanism to prevent concurrent file editing
- **Memory Usage**: Large Excel files consume significant memory

### Future Scalability Enhancements
- **Database Storage**: Replace in-memory storage with MongoDB
- **Real-time Collaboration**: WebSocket integration for live editing
- **Microservices**: Split into separate services for different concerns
- **Load Balancing**: Horizontal scaling for high availability

## Deployment Architecture

### Development Environment
```
Developer Machine:
├── Angular Dev Server (http://localhost:4200)
├── Node.js Backend (http://localhost:3000)
├── Local Git Repository
└── File System Storage
```

### Production Environment (Future)
```
Cloud Infrastructure:
├── CDN (Static Angular Assets)
├── Load Balancer
├── Application Servers (Node.js Backend)
├── Database Cluster (MongoDB)
├── File Storage (AWS S3 or similar)
└── Git Integration (GitHub API)
```

## Monitoring and Logging

### Application Logging
- **Frontend**: Console logging with log levels
- **Backend**: Structured logging with Winston
- **Git Operations**: Detailed operation logging
- **Error Tracking**: Integration with error monitoring service

### Performance Monitoring
- **API Response Times**: Track endpoint performance
- **Excel Processing Time**: Monitor file parsing duration
- **Git Operation Duration**: Track Git command execution time
- **Memory Usage**: Monitor memory consumption patterns

This architecture provides a solid foundation for the Drools Decision Table Rules Manager while maintaining flexibility for future enhancements and scalability requirements.
