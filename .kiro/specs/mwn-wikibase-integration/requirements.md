# Requirements Document

## Introduction

This feature integrates the `nodemw` MediaWiki API client with the Wikibase Schema editor to provide a robust and comprehensive alternative to the REST API integration. The `nodemw` package offers excellent MediaWiki API coverage, built-in request queuing, error handling, and specific Wikidata/Wikibase support, making it the preferred integration method for fetching live Wikibase data, property information, constraints, and performing validation within the schema editor.

## Requirements

### Requirement 1

**User Story:** As a data analyst using the wikibase schema editor, I want to connect to Wikibase instances using the nodemw client, so that I can benefit from robust connection handling, automatic request queuing, and comprehensive MediaWiki API coverage when working with live Wikibase data.

#### Acceptance Criteria

1. WHEN a user selects a Wikibase instance THEN the system SHALL establish a connection using the nodemw client with proper configuration
2. WHEN the system connects to a Wikibase instance THEN it SHALL handle authentication, tokens, and session management automatically through nodemw
3. WHEN connection issues occur THEN the system SHALL leverage nodemw's built-in error handling and retry mechanisms
4. WHEN multiple Wikibase instances are configured THEN the system SHALL maintain separate nodemw client instances for each instance
5. IF a Wikibase instance becomes unavailable THEN the system SHALL use nodemw's error handling to provide appropriate feedback and fallback options

### Requirement 2

**User Story:** As a schema editor user, I want to search and retrieve property information using nodemw's comprehensive MediaWiki API methods, so that I can access detailed property data including labels, descriptions, data types, and usage statistics with reliable performance.

#### Acceptance Criteria

1. WHEN a user searches for properties THEN the system SHALL use nodemw's search methods to query property labels and descriptions
2. WHEN property information is retrieved THEN the system SHALL use nodemw's API methods to fetch comprehensive property data including multilingual labels, descriptions, data types, and aliases
3. WHEN displaying property suggestions THEN the system SHALL use nodemw's search capabilities to provide autocomplete functionality with property ranking
4. WHEN property data is requested THEN the system SHALL leverage nodemw's built-in request queuing for optimal performance
5. IF property searches return large result sets THEN the system SHALL use nodemw's pagination handling to manage large responses efficiently

### Requirement 3

**User Story:** As a schema editor user, I want to access property constraints and validation rules through nodemw's Wikibase-specific methods, so that I can ensure my schema mappings comply with target Wikibase requirements using comprehensive constraint data.

#### Acceptance Criteria

1. WHEN a user selects a property THEN the system SHALL use nodemw's Wikidata API to fetch associated constraint claims and their values
2. WHEN constraint data is retrieved THEN the system SHALL parse constraint types including format constraints, value type constraints, and allowed values using nodemw's claim parsing
3. WHEN building schema mappings THEN the system SHALL validate user input against comprehensive constraint data retrieved via nodemw
4. WHEN constraint violations are detected THEN the system SHALL provide detailed feedback using constraint information from nodemw queries
5. IF constraint data is complex THEN the system SHALL use nodemw's claim parsing capabilities to handle qualifiers and references in constraints

### Requirement 4

**User Story:** As a developer working with the schema editor, I want to leverage nodemw's TypeScript support and comprehensive API coverage, so that I can build a maintainable and type-safe integration with full MediaWiki and Wikibase functionality.

#### Acceptance Criteria

1. WHEN implementing nodemw integration THEN the system SHALL use nodemw's TypeScript configuration and type definitions where available
2. WHEN making API requests THEN the system SHALL use nodemw's comprehensive method coverage for MediaWiki and Wikibase operations
3. WHEN handling API responses THEN the system SHALL use nodemw's response parsing and error handling mechanisms
4. WHEN extending functionality THEN the system SHALL leverage nodemw's direct API call capabilities for custom operations
5. IF custom API calls are needed THEN the system SHALL use nodemw's api.call method while maintaining consistent error handling

### Requirement 5

**User Story:** As a system administrator, I want to configure multiple Wikibase instances using nodemw's multi-instance capabilities, so that users can work with different knowledge bases with isolated configurations and optimal resource management.

#### Acceptance Criteria

1. WHEN configuring Wikibase instances THEN the system SHALL create separate nodemw client instances for each configured Wikibase
2. WHEN instance configuration is saved THEN the system SHALL validate connectivity using nodemw's getSiteInfo and getMediaWikiVersion methods
3. WHEN switching between instances THEN the system SHALL maintain isolated configurations and session data for each nodemw instance
4. WHEN setting up instances THEN the system SHALL support both authenticated and anonymous access through nodemw configuration
5. IF instance configuration fails THEN the system SHALL use nodemw's error handling to provide detailed diagnostic information

### Requirement 6

**User Story:** As a schema editor user, I want real-time validation feedback using nodemw's comprehensive data retrieval capabilities, so that I can identify and fix schema issues with access to complete Wikibase metadata and constraint information.

#### Acceptance Criteria

1. WHEN editing schema mappings THEN the system SHALL continuously validate against live constraint and property data retrieved via nodemw
2. WHEN validation errors occur THEN the system SHALL highlight problematic mappings with specific error descriptions based on comprehensive nodemw data queries
3. WHEN constraints are satisfied THEN the system SHALL provide positive feedback using validation data from nodemw API calls
4. WHEN performing bulk validation THEN the system SHALL use nodemw's request queuing capabilities for efficient data retrieval
5. IF validation requires complex queries THEN the system SHALL leverage nodemw's advanced API methods and continuation features

### Requirement 7

**User Story:** As a data curator, I want to preview and validate my schema mappings against live Wikibase data using nodemw's Wikidata API capabilities, so that I can ensure my mappings will work correctly before processing large datasets.

#### Acceptance Criteria

1. WHEN previewing schema mappings THEN the system SHALL use nodemw's Wikidata API to create test entity structures based on the current schema configuration
2. WHEN validating mappings THEN the system SHALL simulate entity creation using nodemw's claim parsing and validation without actually saving to Wikibase
3. WHEN testing data transformations THEN the system SHALL use nodemw to validate that transformed data meets Wikibase format requirements
4. WHEN checking for conflicts THEN the system SHALL use nodemw's search and entity querying capabilities to identify potential duplicate or conflicting entities
5. IF preview validation fails THEN the system SHALL provide detailed feedback using nodemw's comprehensive error reporting and validation features

### Requirement 8

**User Story:** As a developer, I want to implement efficient caching and performance optimization using nodemw's built-in features, so that the schema editor provides responsive user experience while respecting API rate limits and server resources.

#### Acceptance Criteria

1. WHEN making repeated API requests THEN the system SHALL leverage nodemw's built-in request queuing to reduce server load and manage concurrency
2. WHEN API rate limits are approached THEN the system SHALL use nodemw's built-in throttling and queue management for automatic request pacing
3. WHEN caching property and constraint data THEN the system SHALL implement appropriate cache invalidation strategies on top of nodemw's request handling
4. WHEN handling large datasets THEN the system SHALL use nodemw's parallel processing capabilities with configurable concurrency limits
5. IF network issues occur THEN the system SHALL rely on nodemw's automatic error handling and retry mechanisms for resilient operation
