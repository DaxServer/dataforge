# Requirements Document

## Introduction

The Wikibase Schema Editor is a comprehensive visual interface that allows users to create and manage mappings between their tabular data and Wikibase item structures. This feature enables users to define how their data columns should be transformed into structured Wikibase format, similar to OpenRefine's Wikidata schema functionality.

The editor provides a complete workflow from schema selection to detailed configuration, including:

- Schema selection and management interface with metadata display
- Drag-and-drop column mapping with real-time validation
- Comprehensive terms configuration (Labels, Descriptions, Aliases) with multilingual support
- Advanced statement configuration with properties, values, ranks, qualifiers, and references
- Always-active validation system with detailed error reporting
- Automatic local saving with manual backend persistence
- Reusable components for consistent user experience across all mapping operations

The implementation uses Vue 3 with TypeScript, Pinia for state management, and integrates with a full-featured Elysia backend API for schema persistence and management.

## Requirements

### Requirement 1

**User Story:** As a data curator, I want to create a Wikibase item configuration with automatic saving, so that I can establish the foundation for structuring my tabular data as linked data entities without worrying about losing my work.

#### Acceptance Criteria

1. WHEN the user opens the schema editor THEN the system SHALL display a single item configuration interface
2. WHEN the user creates an item THEN the system SHALL assign it a unique identifier within the schema
3. WHEN the user makes any changes to the schema THEN the system SHALL automatically save changes to the Pinia store immediately
4. WHEN the user loads a project THEN the system SHALL retrieve any existing item configuration from storage
5. IF no item configuration exists THEN the system SHALL initialize with a default empty item structure
6. WHEN the user makes changes THEN the system SHALL NOT display save/cancel buttons for individual actions
7. WHEN the user wants to persist changes to the backend THEN the system SHALL provide a single persistence save button in the toolbar

### Requirement 2

**User Story:** As a developer, I want to show the data curator a horizontal list of column names, so that they can use them for mapping to schema elements.

#### Acceptance Criteria

1. WHEN the schema editor loads THEN the system SHALL display a horizontal list of all available column names from the current dataset
2. WHEN the dataset has columns THEN the system SHALL show each column name as a draggable element
3. WHEN the user drags a column name THEN the system SHALL provide visual feedback indicating valid drop targets
4. IF the dataset has no columns THEN the system SHALL display an appropriate message indicating no data is available
5. WHEN the column palette loads THEN the system SHALL hide sample data by default
6. WHEN the user clicks the sample data toggle button THEN the system SHALL show or hide sample data for all columns
7. WHEN sample data is visible THEN the system SHALL display up to 3 sample values per column below the column name

### Requirement 3

**User Story:** As a data curator, I want to configure item Terms (Labels, Descriptions, and Aliases) by mapping data columns with automatic saving, so that I can define multilingual metadata for my Wikibase items without manual save operations.

#### Acceptance Criteria

1. WHEN the user selects a data column THEN the system SHALL allow mapping it to Labels, Descriptions, or Aliases
2. WHEN the user configures Terms THEN the system SHALL support multilingual definitions for each Term type
3. WHEN the user maps a column to any Term type THEN the system SHALL allow specifying the language code and support multiple aliases per language for Aliases
4. WHEN Terms are displayed THEN the system SHALL provide drop targets where columns can be dropped to create mappings
5. WHEN Term mappings are configured THEN the system SHALL provide visual feedback showing the mapping relationships
6. WHEN the user creates or modifies Term mappings THEN the system SHALL automatically save changes to the Pinia store immediately
7. WHEN the user configures Terms THEN the system SHALL NOT display save/cancel buttons for individual Term operations

### Requirement 4

**User Story:** As a data curator, I want to add and configure Statements for my Wikibase item with automatic saving, so that I can define relationships and attributes using property-value pairs without manual save operations.

#### Acceptance Criteria

1. WHEN the user configures an item THEN the system SHALL provide options to add Statements
2. WHEN the user adds a Statement THEN the system SHALL require selection of a Wikibase property (P-ID)
3. WHEN a Statement is created THEN the system SHALL allow mapping data columns to the statement's main value
4. WHEN the user defines a Statement THEN the system SHALL support different value types (string, item reference, quantity, time, etc.)
5. WHEN the user maps columns to Statement values THEN the system SHALL validate data type compatibility
6. WHEN Statements are configured THEN the system SHALL display them in a hierarchical structure showing property-value relationships
7. WHEN the user creates, modifies, or deletes Statements THEN the system SHALL automatically save changes to the Pinia store immediately
8. WHEN the user configures Statements THEN the system SHALL NOT display save/cancel buttons for individual Statement operations

### Requirement 5

**User Story:** As a data curator, I want to configure ranks for my Statements with automatic saving, so that I can indicate the relative importance and reliability of different property values without manual save operations.

#### Acceptance Criteria

1. WHEN a Statement is configured THEN the system SHALL provide options to set the statement rank
2. WHEN the user sets a rank THEN the system SHALL support the three Wikibase rank levels (preferred, normal, deprecated)
3. WHEN multiple statements exist for the same property THEN the system SHALL allow different ranks for each statement
4. WHEN ranks are configured THEN the system SHALL display visual indicators showing the rank level
5. IF no rank is specified THEN the system SHALL default to "normal" rank
6. WHEN the user changes a Statement rank THEN the system SHALL automatically save the change to the Pinia store immediately
7. WHEN the user configures ranks THEN the system SHALL NOT display save/cancel buttons for rank operations

### Requirement 6

**User Story:** As a data curator, I want to add qualifiers to my Statements with automatic saving, so that I can provide additional context and specificity to property-value relationships without manual save operations.

#### Acceptance Criteria

1. WHEN a Statement is configured THEN the system SHALL provide options to add qualifiers
2. WHEN the user adds a qualifier THEN the system SHALL require selection of a qualifier property (P-ID)
3. WHEN a qualifier is created THEN the system SHALL allow mapping data columns to the qualifier's value
4. WHEN the user defines a qualifier THEN the system SHALL support the same value types as main statements
5. WHEN qualifiers are configured THEN the system SHALL display them within their parent statement
6. WHEN the user creates, modifies, or deletes qualifiers THEN the system SHALL automatically save changes to the Pinia store immediately
7. WHEN the user configures qualifiers THEN the system SHALL NOT display save/cancel buttons for individual qualifier operations

### Requirement 7

**User Story:** As a data curator, I want to add references to my Statements with automatic saving, so that I can cite sources and provide provenance for my data claims without manual save operations.

#### Acceptance Criteria

1. WHEN a Statement is configured THEN the system SHALL provide options to add references
2. WHEN the user adds a reference THEN the system SHALL allow selection of reference properties (e.g., P248 for "stated in", P854 for "reference URL")
3. WHEN a reference is created THEN the system SHALL allow mapping data columns to reference values
4. WHEN references are configured THEN the system SHALL display them as citations under their parent statement
5. WHEN the user defines reference values THEN the system SHALL support appropriate value types for citation data
6. WHEN the user creates, modifies, or deletes references THEN the system SHALL automatically save changes to the Pinia store immediately
7. WHEN the user configures references THEN the system SHALL NOT display save/cancel buttons for individual reference operations

### Requirement 8

**User Story:** As a data curator, I want visual feedback and validation during drag-and-drop operations, so that I can create correct schema mappings efficiently.

#### Acceptance Criteria

1. WHEN the user starts dragging a column THEN the system SHALL immediately validate compatibility with all available drop targets
2. WHEN the user hovers over a drop target during drag THEN the system SHALL provide immediate visual feedback indicating validity
3. WHEN the user creates invalid mappings THEN the system SHALL display clear error messages with specific reasons
4. WHEN the schema is incomplete THEN the system SHALL highlight required fields that need attention
5. WHEN the user maps columns THEN the system SHALL provide autocomplete suggestions for property names
6. IF there are data type mismatches THEN the system SHALL warn the user and suggest corrections
7. WHEN the editor loads THEN validation SHALL be automatically active without requiring manual activation

### Requirement 9

**User Story:** As a data curator, I want to select from existing schemas or create new ones or delete an existing schema when I open the schema editor with automatic saving, so that I can reuse previous work and maintain consistency across similar datasets without worrying about losing changes.

#### Acceptance Criteria

1. WHEN the schema editor loads THEN the system SHALL display a schema selection interface before showing the main editor
2. WHEN existing schemas are found THEN the system SHALL display a list of available schemas with their names, creation dates, completion status and deletion button
3. WHEN the user views the schema list THEN the system SHALL provide a prominent "Create New Schema" button alongside the existing schemas
4. WHEN the user selects an existing schema THEN the system SHALL load that schema configuration into the main editor interface with autosave enabled
5. WHEN the user clicks "Create New Schema" THEN the system SHALL initialize an empty schema editor using the existing initialization code with autosave enabled
6. WHEN no existing schemas are found THEN the system SHALL show an empty state with only the "Create New Schema" option
7. WHEN the user deletes a schema THEN the system SHALL provide a confirmation dialog to delete the schema
8. WHEN the user works with any schema THEN the system SHALL automatically save all changes to the Pinia store without requiring manual save actions

### Requirement 10

**User Story:** As a data curator, I want all my schema changes to be automatically saved to the local store with a single persistence button for backend saving, so that I never lose my work and can control when changes are persisted to the server.

#### Acceptance Criteria

1. WHEN the user makes any change to the schema THEN the system SHALL immediately update the Pinia store without user intervention
2. WHEN the user modifies Terms, Statements, qualifiers, or references THEN the system SHALL automatically save these changes to the local store
3. WHEN the user wants to persist changes to the backend THEN the system SHALL use the existing manual "Save to Server" functionality in the main toolbar
4. WHEN the user clicks the existing persistence save button THEN the system SHALL save the current Pinia store state to the backend API using existing implementation
5. WHEN changes are automatically saved to the store THEN the system SHALL NOT display individual save/cancel buttons for schema operations
6. WHEN the existing persistence save is successful THEN the system SHALL provide visual feedback using current implementation
7. WHEN the existing persistence save fails THEN the system SHALL display an error message using current implementation without losing local changes
8. WHEN the user navigates away from the editor THEN the system SHALL retain all locally saved changes in the Pinia store
9. WHEN implementing autosave THEN the system SHALL NOT modify the existing manual backend synchronization behavior

### Requirement 11

**User Story:** As a data curator, I want a unified interface for configuring each type of term (Labels, Descriptions, Aliases) with language selection and drop zones, so that I can efficiently map my data columns to multilingual metadata.

#### Acceptance Criteria

1. WHEN the user views the terms editor THEN the system SHALL display three TermSection components for Labels, Descriptions, and Aliases
2. WHEN the user configures any term type THEN the system SHALL provide a language selector with accepted language codes
3. WHEN the user selects a language THEN the system SHALL enable the drop zone for that language and term type combination
4. WHEN the user drops a column onto a term drop zone THEN the system SHALL validate data type compatibility and create the mapping immediately
5. WHEN existing mappings exist for a term type THEN the system SHALL display them with language codes and column information
6. WHEN the user wants to remove a mapping THEN the system SHALL provide remove buttons for each mapping
7. WHEN validation errors exist for a term section THEN the system SHALL display visual indicators and error counts

### Requirement 12

**User Story:** As a developer, I want a reusable DropZone component that handles drag-and-drop operations with validation, so that I can provide consistent drop targets throughout the schema editor.

#### Acceptance Criteria

1. WHEN a DropZone component is rendered THEN the system SHALL display an appropriate placeholder message and icon
2. WHEN the user drags a column over a DropZone THEN the system SHALL provide immediate visual feedback based on validation results
3. WHEN the user drops a valid column onto a DropZone THEN the system SHALL emit a column-dropped event with the column information
4. WHEN the user drops an invalid column onto a DropZone THEN the system SHALL prevent the drop and show validation feedback
5. WHEN a DropZone has accepted data types specified THEN the system SHALL only accept columns with compatible data types
6. WHEN a DropZone has a custom validator function THEN the system SHALL use it for additional validation logic
7. WHEN drag operations occur THEN the system SHALL use native HTML5 drag and drop events for data transfer

### Requirement 13

**User Story:** As a data curator, I want a property selector that provides search and autocomplete functionality for Wikibase properties, so that I can easily find and select the correct properties for my statements.

#### Acceptance Criteria

1. WHEN the user opens a property selector THEN the system SHALL display a search input with placeholder text
2. WHEN the user types in the property selector THEN the system SHALL provide autocomplete suggestions for property IDs and labels
3. WHEN the user selects a property THEN the system SHALL display the property ID, label, and data type
4. WHEN a property is selected THEN the system SHALL emit an update event with the property information
5. WHEN the property selector is cleared THEN the system SHALL reset to the placeholder state
6. WHEN the selected property has a data type THEN the system SHALL display the data type information below the selector
7. WHEN the property selector is disabled THEN the system SHALL prevent user interaction and show disabled styling

### Requirement 14

**User Story:** As a data curator, I want a comprehensive claim editor that handles statement values, ranks, qualifiers, and references in a unified interface, so that I can configure all aspects of a statement efficiently.

#### Acceptance Criteria

1. WHEN the user configures a statement THEN the system SHALL provide a ClaimEditor component for value configuration
2. WHEN the user sets a statement value THEN the system SHALL provide drop zones for column mapping with data type validation
3. WHEN the user configures statement rank THEN the system SHALL provide a dropdown with preferred, normal, and deprecated options
4. WHEN the user adds qualifiers THEN the system SHALL provide a QualifiersEditor with property selection and value mapping
5. WHEN the user adds references THEN the system SHALL provide a ReferencesEditor with snak configuration
6. WHEN the claim editor is disabled THEN the system SHALL prevent interaction until a property is selected
7. WHEN the user makes changes in the claim editor THEN the system SHALL immediately update the schema store

### Requirement 15

**User Story:** As a data curator, I want a validation display component that shows the current validation status and errors, so that I can understand and fix issues with my schema configuration.

#### Acceptance Criteria

1. WHEN validation errors exist THEN the system SHALL display a ValidationDisplay component with error and warning counts
2. WHEN the user views validation status THEN the system SHALL show detailed error messages with specific paths and suggestions
3. WHEN the user wants to clear validation errors THEN the system SHALL provide a "Clear All" button
4. WHEN validation status changes THEN the system SHALL update the display immediately with current error and warning counts
5. WHEN no validation issues exist THEN the system SHALL hide the validation display or show a success state
6. WHEN validation errors are path-specific THEN the system SHALL highlight the relevant sections in the editor
7. WHEN the user hovers over validation indicators THEN the system SHALL show detailed error information in tooltips
