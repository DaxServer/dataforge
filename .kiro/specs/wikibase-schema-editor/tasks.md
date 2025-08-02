# Implementation Plan

- [x] 1. Set up core TypeScript interfaces and types
  - Write tests for schema mapping data structure validation
  - Write tests for column mapping and transformation types
  - Implement TypeScript interfaces for schema mapping
  - _Requirements: 1.2_

- [x] 2. Create drag-and-drop context types and utilities
  - Write tests for drag-and-drop context state management
  - Write tests for drop target validation logic
  - Implement drag-and-drop context types and utilities
  - _Requirements: 2.3_

- [x] 3. Build validation error handling system
  - Write tests for validation error types and error messages
  - Write tests for error display and user feedback
  - Implement validation error handling system
  - _Requirements: 8.1_

- [x] 4. Create basic schema store with TDD
  - Write tests for Pinia store initialization and state management
  - Write tests for schema state updates and reactivity
  - Implement basic schema store structure
  - _Requirements: 1.3, 1.5_

- [x] 5. Build API integration composable with TDD
  - Write tests for schema CRUD operations with API
  - Write tests for schema loading and saving functionality
  - Implement API integration composable for schema operations
  - _Requirements: 1.3, 1.4_

- [x] 6. Create drag-and-drop composable
  - Write tests for drag-and-drop state management
  - Write tests for drag validation and drop handling
  - Implement drag-and-drop composable functionality
  - _Requirements: 2.3_

- [x] 7. Build ColumnPalette component with TDD
  - Write tests for displaying available data columns
  - Write tests for draggable column elements
  - Write tests for empty dataset state handling
  - Write tests for sample data toggle functionality
  - Write tests for sample data visibility state management
  - Implement ColumnPalette component
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 8. Create column data type indicators
  - Write tests for column data type display and tooltips
  - Write tests for sample value display functionality
  - Implement column data type indicators and tooltips
  - _Requirements: 8.2, 2.7_

- [x] 9. Build basic WikibaseSchemaEditor container
  - Write tests for main container component initialization
  - Write tests for toolbar functionality
  - Implement WikibaseSchemaEditor container structure
  - _Requirements: 1.1_

- [x] 10. Create ItemEditor component foundation
  - Write tests for item configuration interface
  - Write tests for item creation and unique identifier assignment
  - Implement basic ItemEditor component structure
  - _Requirements: 1.1, 1.2_

- [x] 11. Build TermsEditor component with TDD
  - Write tests for Labels, Descriptions, and Aliases drop zones
  - Write tests for multilingual configuration interface
  - Implement TermsEditor component with drop zone functionality
  - _Requirements: 3.2, 3.4_

- [x] 12. Add language selection for Terms
  - Write tests for language code selection and validation
  - Write tests for multiple aliases per language support
  - Implement language selection functionality for Terms
  - _Requirements: 3.2, 3.3_

- [x] 13. Create column mapping for Terms
  - Write tests for column mapping to term types
  - Write tests for term mapping visual feedback
  - Implement column mapping functionality for Terms
  - _Requirements: 3.1, 3.5_

- [x] 14. Build StatementsEditor container
  - Write tests for adding and removing statements
  - Write tests for statement ordering and management
  - Implement StatementsEditor container component
  - _Requirements: 4.1_

- [x] 15. Create statement hierarchical display
  - Write tests for hierarchical structure rendering
  - Write tests for property-value relationship display
  - Implement hierarchical display for statements
  - _Requirements: 4.6_

- [x] 16. Build property selection interface
  - Write tests for property selection with P-ID validation
  - Write tests for property autocomplete functionality
  - Implement property selection interface
  - _Requirements: 4.2, 8.3_

- [x] 17. Create StatementEditor value mapping
  - Write tests for value mapping configuration
  - Write tests for different value types support
  - Implement value mapping functionality for statements
  - _Requirements: 4.3, 4.4_

- [x] 18. Add data type validation for statements
  - Write tests for data type compatibility checking
  - Write tests for validation error display
  - Implement data type validation for statement values
  - _Requirements: 4.5, 8.4_

- [x] 19. Build statement rank selection
  - Write tests for rank selection interface
  - Write tests for rank visual indicators
  - Write tests for default rank assignment
  - Implement statement rank selection functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 20. Create QualifiersEditor component
  - Write tests for adding and removing qualifiers
  - Write tests for qualifier property selection
  - Implement QualifiersEditor component structure
  - _Requirements: 6.1, 6.2_

- [x] 21. Build qualifier value mapping
  - Write tests for qualifier value mapping with columns
  - Write tests for qualifier value type support
  - Implement qualifier value mapping functionality
  - _Requirements: 6.3, 6.4_

- [x] 22. Add qualifier display
  - Write tests for qualifier display within statements
  - Implement qualifier display functionality
  - _Requirements: 6.5_

- [x] 23. Create ReferencesEditor component
  - Write tests for adding and removing references
  - Write tests for reference property selection
  - Implement ReferencesEditor component structure
  - _Requirements: 7.1, 7.2_

- [x] 24. Build reference value mapping
  - Write tests for reference value mapping with appropriate data types
  - Write tests for citation data support
  - Implement reference value mapping functionality
  - _Requirements: 7.3, 7.5_

- [x] 25. Integrate reference display
  - Integrate reference display functionality with other components
  - _Requirements: 7.4_

- [x] 26. Implement real-time validation
  - Write tests for real-time drag-and-drop validation
  - Write tests for invalid mapping detection
  - Implement real-time validation system
  - _Requirements: 8.1_

- [ ] 27. Create schema completeness validation
  - Write tests for schema completeness checking
  - Write tests for required field highlighting
  - Implement schema completeness validation
  - _Requirements: 8.2_

- [ ] 28. Integrate schema persistence
  - Write tests for auto-save functionality
  - Write tests for optimistic updates and rollback
  - Implement schema persistence integration
  - _Requirements: 1.3_

- [ ] 29. Create end-to-end workflow tests
  - Write integration tests for complete schema creation workflow
  - Write tests for drag-and-drop across all components
  - Write tests for validation across multiple components
  - Ensure all integration scenarios work correctly
  - _Requirements: 2.3, 3.5, 4.5_
