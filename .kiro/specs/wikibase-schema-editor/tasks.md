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

- [x] 26. Implement drag validation system
  - Write tests for drag-triggered validation on dragstart events
  - Write tests for invalid mapping detection during drag operations
  - Implement validation system that is always active
  - _Requirements: 8.1, 8.8_

- [x] 27. Create schema completeness validation
  - Write tests for schema completeness checking
  - Write tests for required field highlighting
  - Implement schema completeness validation
  - _Requirements: 8.2_

- [x] 28. Integrate schema persistence
  - Write tests for auto-save functionality
  - Write tests for optimistic updates and rollback
  - Implement schema persistence integration
  - _Requirements: 1.3_

- [x] 29. Build SchemaSelector component
  - Write tests for displaying existing schemas list with metadata
  - Write tests for empty state when no schemas exist
  - Write tests for "Create New Schema" button functionality
  - Implement SchemaSelector component with schema list display
  - _Requirements: 9.2, 9.3, 9.5, 9.6_

- [x] 30. Add schema metadata display
  - Write tests for schema creation date and modification time display
  - Write tests for schema completion status indicators
  - Implement schema metadata display functionality in schema list items
  - _Requirements: 9.2_

- [x] 31. Implement schema selection workflow
  - Write tests for loading selected schema into editor
  - Write tests for transitioning from selector to main editor
  - Implement schema selection and loading functionality
  - _Requirements: 9.4_

- [x] 32. Integrate schema deletion into schema selection workflow
  - Write tests for schema deletion confirmation dialog
  - Write tests for schema deletion success feedback
  - Implement schema deletion functionality in SchemaSelector
  - _Requirements: 9.7_

- [x] 33. Refactor validation terminology and workflow
  - Remove "real-time" terminology from validation composables and components
  - Remove start/stop validation workflow methods as validation is always active
  - Update validation to trigger on dragstart events
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 34. Implement autosave functionality in schema store
  - Write tests for immediate Pinia store updates on all schema changes
  - Write tests for isDirty flag management and lastSyncedAt tracking
  - Write tests for automatic store persistence without manual save operations
  - Implement autosave mutations in schema store for all schema operations
  - _Requirements: 10.1, 10.2, 10.8_

- [ ] 35. Remove save/cancel buttons from TermsEditor component
  - Write tests for immediate term mapping updates without save buttons
  - Write tests for automatic language selection persistence
  - Remove save/cancel buttons from TermsEditor interface
  - Update TermsEditor to use autosave store mutations
  - _Requirements: 3.6, 3.7, 10.5_

- [ ] 36. Remove save/cancel buttons from StatementEditor component
  - Write tests for immediate statement configuration updates without save buttons
  - Write tests for automatic property selection and rank changes persistence
  - Remove save/cancel buttons from StatementEditor interface
  - Update StatementEditor to use autosave store mutations
  - _Requirements: 4.7, 4.8, 5.6, 5.7, 10.5_

- [ ] 37. Remove save/cancel buttons from QualifiersEditor component
  - Write tests for immediate qualifier updates without save buttons
  - Write tests for automatic qualifier property and value mapping persistence
  - Remove save/cancel buttons from QualifiersEditor interface
  - Update QualifiersEditor to use autosave store mutations
  - _Requirements: 6.6, 6.7, 10.5_

- [ ] 38. Remove save/cancel buttons from ReferencesEditor component
  - Write tests for immediate reference updates without save buttons
  - Write tests for automatic reference property and value mapping persistence
  - Remove save/cancel buttons from ReferencesEditor interface
  - Update ReferencesEditor to use autosave store mutations
  - _Requirements: 7.6, 7.7, 10.5_

- [ ] 39. Ensure existing manual backend sync works with autosave store state
  - Write tests to verify existing backend sync functionality works with autosave-enabled store
  - Write tests to confirm manual "Save to Server" button continues to work as currently implemented
  - Verify existing persistence layer correctly reads from autosave-updated Pinia store state
  - Ensure no changes to existing manual backend synchronization behavior
  - _Requirements: 10.3, 10.4_

- [ ] 40. Update drag-and-drop operations to use autosave
  - Write tests for immediate store updates on column drop operations
  - Write tests for automatic mapping persistence without confirmation dialogs
  - Update all drop zone handlers to use autosave store mutations
  - Remove any remaining save/cancel patterns from drag-and-drop workflows
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 41. Update schema selection workflow for autosave
  - Write tests for autosave enablement when loading existing schemas
  - Write tests for autosave enablement when creating new schemas
  - Update SchemaSelector to initialize autosave behavior on schema selection
  - Ensure seamless transition from selection to autosave-enabled editor
  - _Requirements: 9.4, 9.5, 9.8_

- [ ] 42. Update all existing test cases for autosave behavior
  - Update TermsEditor tests to expect immediate store updates instead of save button interactions
  - Update StatementEditor tests to expect automatic persistence instead of manual save operations
  - Update QualifiersEditor and ReferencesEditor tests for autosave behavior
  - Update drag-and-drop tests to expect immediate store persistence
  - Update schema store tests to validate autosave mutations and dirty flag management
  - _Requirements: 10.1, 10.2, 10.5, 10.8_
