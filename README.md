# Drools Decision Table Rules Manager

A comprehensive web application that enables business users to manage Drools decision table rules through an intuitive spreadsheet-like interface, with integrated Git version control for collaborative rule development.

## 🎯 Project Overview

This application bridges the gap between business users and technical rule management by providing:

- **User-friendly Interface**: Excel-like editing experience for Drools decision tables
- **Git Integration**: Version control with pull request workflows for rule changes
- **Format Preservation**: Maintains compatibility with existing Drools decision table Excel files
- **Collaborative Workflow**: Multi-user editing with conflict resolution and change tracking

## 📋 Phase 1 Deliverables

This repository contains the complete Phase 1 research and planning deliverables:

### 📚 Documentation
- **[Drools Decision Table Format Specification](docs/drools-decision-table-format.md)**: Comprehensive analysis of the Excel format with concrete examples
- **[Technology Stack Recommendations](docs/technology-stack.md)**: Angular + Node.js architecture with library recommendations
- **[System Architecture](docs/system-architecture.md)**: Component diagrams, API endpoints, and data flow design
- **[Implementation Plan](docs/implementation-plan.md)**: Detailed 9-week development roadmap with phases and milestones

### 🏗️ Project Structure
```
drools-rules-manager/
├── docs/                           # Phase 1 documentation
│   ├── drools-decision-table-format.md
│   ├── technology-stack.md
│   ├── system-architecture.md
│   └── implementation-plan.md
├── frontend/                       # Angular application (Phase 2)
│   └── package.json               # Frontend dependencies
├── backend/                        # Node.js API server (Phase 1-2)
│   ├── package.json               # Backend dependencies
│   └── .env.example               # Environment configuration template
├── README.md                      # This file
├── LICENSE                        # MIT License
└── .gitignore                     # Git exclusion rules
```

## 🔍 Key Research Findings

### Drools Decision Table Format
- **Structure**: Metadata rows (RuleSet, Import, Variables, Notes) followed by rule table with NAME, CONDITION, and ACTION columns
- **Parameter Substitution**: Uses `$param` placeholders in patterns for dynamic rule values
- **Excel Requirements**: Specific cell merging, data types, and formatting must be preserved
- **Real Example**: Analyzed actual DroolsDiscount.xlsx with 19 rules and complex business logic

### Technology Stack
- **Frontend**: Angular 17+ with ag-Grid for spreadsheet interface, NgRx for state management
- **Backend**: Node.js with Express.js, ExcelJS for Excel processing, simple-git + Octokit for Git operations
- **Development**: In-memory storage for proof-of-concept, comprehensive testing with Jest/Jasmine

### Architecture Highlights
- **RESTful API**: Clean separation between frontend and backend
- **Modular Components**: Rule Editor, File Manager, and Git Operations components
- **State Management**: NgRx for predictable state updates and time-travel debugging
- **Git Workflow**: Automatic branch creation, pull request generation, and conflict resolution

## 🚀 Quick Start (Development Setup)

### Prerequisites
- Node.js 18+ LTS
- npm 9+
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install -g @angular/cli
ng new drools-rules-manager-frontend --routing --style=scss
cd drools-rules-manager-frontend
npm install
ng serve
```

## 📈 Implementation Roadmap

| Phase | Duration | Key Features | Status |
|-------|----------|--------------|--------|
| **Phase 1** | 2 weeks | Research, Architecture, Project Setup | ✅ **Complete** |
| **Phase 2** | 3 weeks | Angular Frontend, Rule Editing Interface | 📋 **Planned** |
| **Phase 3** | 2 weeks | Git Integration, Pull Request Workflow | 📋 **Planned** |
| **Phase 4** | 2 weeks | Testing, Optimization, Deployment | 📋 **Planned** |

**Total Timeline**: 9 weeks to production-ready application

## 🎯 Success Criteria

### Phase 1 (Current)
- ✅ Comprehensive Drools format research with real examples
- ✅ Technology stack recommendations with justification
- ✅ Complete system architecture design
- ✅ Detailed implementation plan with risk management
- ✅ Initial project structure and dependency configuration

### Future Phases
- **Phase 2**: Working Angular frontend with Excel-like rule editing
- **Phase 3**: Complete Git integration with pull request creation
- **Phase 4**: Production deployment with comprehensive testing

## 🤝 Contributing

This project follows a structured development approach:

1. **Current Phase**: Phase 1 (Research & Planning) - **Complete**
2. **Next Phase**: Phase 2 (Frontend Development) - Ready to begin
3. **Development Workflow**: Feature branches → Pull requests → Code review → Merge

See the [Implementation Plan](docs/implementation-plan.md) for detailed development guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: [jihoyoo99/drools-rules-manager](https://github.com/jihoyoo99/drools-rules-manager)
- **Documentation**: [docs/](docs/) directory
- **Issues**: [GitHub Issues](https://github.com/jihoyoo99/drools-rules-manager/issues)
- **Pull Requests**: [GitHub PRs](https://github.com/jihoyoo99/drools-rules-manager/pulls)

---

**Phase 1 Status**: ✅ **Complete** - Ready for Phase 2 implementation

For questions or support, please create an issue in the GitHub repository.
