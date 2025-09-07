# Implementation Plan

- [x] 1. Set up nodemw package and core infrastructure
  - Install nodemw package and configure TypeScript types
  - Create basic NodemwWikibaseService class structure
  - Set up client management for multiple Wikibase instances
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Replace existing WikibaseApiService with NodemwWikibaseService
  - [x] 2.1 Implement core client management methods
    - Create createClient, getClient, and removeClient methods
    - Implement instance configuration management
    - _Requirements: 1.1, 1.2, 5.1, 5.2_

  - [x] 2.2 Implement property search functionality using nodemw
    - Replace searchProperties method to use nodemw search capabilities
    - Add support for autocomplete and advanced search options
    - Implement property ranking and relevance scoring
    - _Requirements: 2.1, 2.3, 2.5_

  - [x] 2.3 Implement property details retrieval using nodemw
    - Replace getProperty method to use nodemw entity retrieval
    - Add support for multilingual labels, descriptions, and aliases
    - Implement property data type detection and validation
    - _Requirements: 2.2, 4.2, 4.3_

  - [x] 2.4 Implement item search and retrieval using nodemw
    - Replace searchItems and getItem methods to use nodemw
    - Add support for item autocomplete and search filtering
    - _Requirements: 2.1, 2.2, 7.4_

- [x] 3. Implement constraint validation service using nodemw Wikidata API
  - [x] 3.1 Create ConstraintValidationService class
    - Set up service structure with nodemw Wikidata client integration
    - Implement constraint fetching using nodemw getArticleClaims method
    - Create constraint parsing logic for different constraint types
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 3.2 Implement constraint type parsers
    - Create parsers for format constraints, allowed values, value types
    - Implement range constraints, single value, and qualifier constraints
    - Add constraint parameter extraction from qualifiers and references
    - _Requirements: 3.2, 3.4, 6.1_

  - [x] 3.3 Add real-time constraint validation
    - Implement validateProperty method for individual property validation
    - Create validateSchema method for complete schema validation
    - Add constraint violation detection and error message generation
    - _Requirements: 3.3, 6.2, 6.3_

- [x] 4. Update API endpoints to use NodemwWikibaseService
  - [x] 4.1 Update property search endpoints
    - Modify /api/wikibase/:instanceId/properties/search to use nodemw
    - Add support for enhanced search parameters and filtering
    - Implement response formatting for frontend compatibility
    - _Requirements: 2.1, 2.3, 2.5_

  - [x] 4.2 Update property details endpoints
    - Modify /api/wikibase/:instanceId/properties/:propertyId to use nodemw
    - Add constraint information to property details response
    - Implement error handling for property not found scenarios
    - _Requirements: 2.2, 3.1, 3.2_

  - [x] 4.3 Add new constraint validation endpoints
    - Create /api/wikibase/:instanceId/properties/:propertyId/constraints endpoint
    - Add /api/wikibase/:instanceId/validate/property endpoint for real-time validation
    - Implement /api/wikibase/:instanceId/validate/schema endpoint for schema validation
    - _Requirements: 3.1, 3.3, 6.1, 6.2_

  - [x] 4.4 Update instance management endpoints
    - Modify instance configuration endpoints to support nodemw configuration
    - Add connectivity testing using nodemw client validation
    - Implement health check endpoints for instance monitoring
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 5. Enhance frontend property selector with nodemw integration
  - [ ] 5.1 Update PropertySelector component
    - Enhance autocomplete functionality with improved search results
    - Add property constraint display in selector dropdown
    - Implement property usage statistics and relevance indicators
    - _Requirements: 2.3, 6.1, 6.3_

  - [ ] 5.2 Add real-time validation to property selection
    - Implement constraint checking when properties are selected
    - Add visual indicators for constraint compliance
    - Create validation feedback messages for property selection
    - _Requirements: 6.2, 6.3, 6.4_

- [ ] 6. Implement real-time validation display components
  - [ ] 6.1 Create ValidationDisplay component
    - Build component to show validation results and constraint violations
    - Add support for different violation severity levels
    - Implement validation suggestions and fix recommendations
    - _Requirements: 6.2, 6.3, 6.5_

  - [ ] 6.2 Add constraint violation indicators
    - Create visual indicators for different constraint types
    - Implement hover tooltips with detailed constraint information
    - Add click-to-fix functionality for common constraint violations
    - _Requirements: 6.2, 6.4, 6.5_

- [ ] 7. Update schema store with validation integration
  - [ ] 7.1 Add validation state management
    - Add validation results storage to schema store
    - Implement validation status tracking and updates
    - Create validation history for debugging and analysis
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ] 7.2 Implement auto-validation on schema changes
    - Add watchers for schema changes to trigger validation
    - Implement debounced validation to prevent excessive API calls
    - Create validation queuing for complex schema validations
    - _Requirements: 6.1, 6.2, 8.2_

- [ ] 8. Add schema preview and testing functionality
  - [ ] 8.1 Implement schema preview service
    - Create preview generation using nodemw entity simulation
    - Add test entity creation without saving to Wikibase
    - Implement data transformation validation using nodemw
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 8.2 Add conflict detection and resolution
    - Implement duplicate entity detection using nodemw search
    - Add conflict resolution suggestions and recommendations
    - Create preview validation with detailed feedback
    - _Requirements: 7.4, 7.5_

- [ ] 9. Update type definitions and interfaces for nodemw integration
  - [ ] 9.1 Update backend type definitions
    - Modify WikibaseInstanceConfig to include nodemw configuration
    - Update PropertyDetails to include constraint and usage information
    - Create new constraint and validation result type definitions
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 9.2 Update frontend type definitions
    - Enhance property search result types with constraint information
    - Add validation result types for frontend validation display
    - Update schema store types to include validation state
    - _Requirements: 4.3, 6.1, 6.2_

- [ ] 10. Implement comprehensive error handling for nodemw integration
  - [ ] 10.1 Create WikibaseErrorHandler service
    - Map nodemw errors to application-specific error types
    - Implement retry strategies for different error scenarios
    - Add graceful degradation for service failures
    - _Requirements: 1.3, 5.5, 8.5_

  - [ ] 10.2 Add fallback mechanisms
    - Implement cache fallback when nodemw services are unavailable
    - Create basic property information fallback for critical failures
    - Add user-friendly error messages and recovery suggestions
    - _Requirements: 1.5, 8.5_

- [ ] 11. Add comprehensive testing for nodemw integration
  - [ ] 11.1 Create unit tests for NodemwWikibaseService
    - Test client management and configuration methods
    - Test property search and retrieval with mocked nodemw clients
    - Test constraint validation and error handling scenarios
    - _Requirements: All requirements - testing coverage_

  - [ ] 11.2 Create integration tests with real Wikibase instances
    - Test connectivity and data retrieval from Wikidata
    - Test constraint validation with real constraint data
    - Test performance and caching behavior under load
    - _Requirements: All requirements - integration testing_
