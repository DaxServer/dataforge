# Requirements Document

## Introduction

The Wikibase Schema Editor is a visual interface that allows users to create and manage mappings between their tabular data and a single Wikibase item with its properties and statements. This feature enables users to define how their data columns should be transformed into structured Wikibase format, similar to OpenRefine's Wikidata schema functionality. The editor provides an intuitive interface for configuring the item, adding properties, and defining relationships between data elements.

## Requirements

### Requirement 1

**User Story:** As a data curator, I want to create a Wikibase item configuration, so that I can establish the foundation for structuring my tabular data as linked data entities.

#### Acceptance Criteria

1. WHEN the user opens the schema editor THEN the system SHALL display a single item configuration interface
2. WHEN the user creates an item THEN the system SHALL assign it a unique identifier within the schema
3. WHEN the user saves the schema THEN the system SHALL store the item configuration in the project's DuckDB table
4. WHEN the user loads a project THEN the system SHALL retrieve any existing item configuration from storage
5. IF no item configuration exists THEN the system SHALL initialize with a default empty item structure

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

**User Story:** As a data curator, I want to configure item Terms (Labels, Descriptions, and Aliases) by mapping data columns, so that I can define multilingual metadata for my Wikibase items.

#### Acceptance Criteria

1. WHEN the user selects a data column THEN the system SHALL allow mapping it to Labels, Descriptions, or Aliases
2. WHEN the user configures Terms THEN the system SHALL support multilingual definitions for each Term type
3. WHEN the user maps a column to any Term type THEN the system SHALL allow specifying the language code and support multiple aliases per language for Aliases
4. WHEN Terms are displayed THEN the system SHALL provide drop targets where columns can be dropped to create mappings
5. WHEN Term mappings are configured THEN the system SHALL provide visual feedback showing the mapping relationships

### Requirement 4

**User Story:** As a data curator, I want to add and configure Statements for my Wikibase item, so that I can define relationships and attributes using property-value pairs.

#### Acceptance Criteria

1. WHEN the user configures an item THEN the system SHALL provide options to add Statements
2. WHEN the user adds a Statement THEN the system SHALL require selection of a Wikibase property (P-ID)
3. WHEN a Statement is created THEN the system SHALL allow mapping data columns to the statement's main value
4. WHEN the user defines a Statement THEN the system SHALL support different value types (string, item reference, quantity, time, etc.)
5. WHEN the user maps columns to Statement values THEN the system SHALL validate data type compatibility
6. WHEN Statements are configured THEN the system SHALL display them in a hierarchical structure showing property-value relationships

### Requirement 5

**User Story:** As a data curator, I want to configure ranks for my Statements, so that I can indicate the relative importance and reliability of different property values.

#### Acceptance Criteria

1. WHEN a Statement is configured THEN the system SHALL provide options to set the statement rank
2. WHEN the user sets a rank THEN the system SHALL support the three Wikibase rank levels (preferred, normal, deprecated)
3. WHEN multiple statements exist for the same property THEN the system SHALL allow different ranks for each statement
4. WHEN ranks are configured THEN the system SHALL display visual indicators showing the rank level
5. IF no rank is specified THEN the system SHALL default to "normal" rank

### Requirement 6

**User Story:** As a data curator, I want to add qualifiers to my Statements, so that I can provide additional context and specificity to property-value relationships.

#### Acceptance Criteria

1. WHEN a Statement is configured THEN the system SHALL provide options to add qualifiers
2. WHEN the user adds a qualifier THEN the system SHALL require selection of a qualifier property (P-ID)
3. WHEN a qualifier is created THEN the system SHALL allow mapping data columns to the qualifier's value
4. WHEN the user defines a qualifier THEN the system SHALL support the same value types as main statements
5. WHEN qualifiers are configured THEN the system SHALL display them within their parent statement

### Requirement 7

**User Story:** As a data curator, I want to add references to my Statements, so that I can cite sources and provide provenance for my data claims.

#### Acceptance Criteria

1. WHEN a Statement is configured THEN the system SHALL provide options to add references
2. WHEN the user adds a reference THEN the system SHALL allow selection of reference properties (e.g., P248 for "stated in", P854 for "reference URL")
3. WHEN a reference is created THEN the system SHALL allow mapping data columns to reference values
4. WHEN references are configured THEN the system SHALL display them as citations under their parent statement
5. WHEN the user defines reference values THEN the system SHALL support appropriate value types for citation data

### Requirement 8

**User Story:** As a data curator, I want visual feedback and validation, so that I can create correct schema mappings efficiently.

#### Acceptance Criteria

1. WHEN the user creates invalid mappings THEN the system SHALL display clear error messages
2. WHEN the schema is incomplete THEN the system SHALL highlight required fields that need attention
3. WHEN the user maps columns THEN the system SHALL provide autocomplete suggestions for property names
4. IF there are data type mismatches THEN the system SHALL warn the user and suggest corrections

### Requirement 9

**User Story:** As a data curator, I want to select from existing schemas or create new ones or delete an existing schema when I open the schema editor, so that I can reuse previous work and maintain consistency across similar datasets.

#### Acceptance Criteria

1. WHEN the schema editor loads THEN the system SHALL display a schema selection interface before showing the main editor
2. WHEN existing schemas are found THEN the system SHALL display a list of available schemas with their names, creation dates, completion status and deletion button
3. WHEN the user views the schema list THEN the system SHALL provide a prominent "Create New Schema" button alongside the existing schemas
4. WHEN the user selects an existing schema THEN the system SHALL load that schema configuration into the main editor interface
5. WHEN the user clicks "Create New Schema" THEN the system SHALL initialize an empty schema editor using the existing initialization code
6. WHEN no existing schemas are found THEN the system SHALL show an empty state with only the "Create New Schema" option
7. WHEN the user deletes a schema THEN the system SHALL provide a confirmation dialog to delete the schema
