import type { Ref } from 'vue'
import type { ColumnInfo, WikibaseDataType } from '@frontend/types/wikibase-schema'

// Schema editor specific drag and drop context (from design document)
// This represents what the composable provides, not the store state
export interface SchemaDragDropContext {
  // Local drop zone state managed by the composable
  isOverDropZone: Ref<boolean>
  dropFeedback: Ref<DropFeedback | null>
}

// Native HTML5 drag and drop integration for drop targets
export interface DropZoneConfig {
  onDrop: (event: DragEvent) => void
  onDragEnter?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
  acceptedDataTypes: string[]
  validateDrop?: (data: string) => boolean
}

export interface DropFeedback {
  type: 'success' | 'error' | 'warning'
  message: string
}

// Legacy drag and drop context (keeping for backward compatibility)
export interface DragDropContext {
  draggedColumn: ColumnInfo | null
  dropTarget: DropTarget | null
  isValidDrop: boolean
  dragStartPosition?: { x: number; y: number }
}

export interface DropTarget {
  type: DropTargetType
  path: string // JSON path to the target location
  acceptedTypes: WikibaseDataType[]
  language?: string
  propertyId?: string
  isRequired?: boolean
}

export type DropTargetType =
  | 'label'
  | 'description'
  | 'alias'
  | 'statement'
  | 'qualifier'
  | 'reference'

// Drag operation states
export type DragState = 'idle' | 'dragging' | 'dropping' | 'invalid'

// Drop zone validation result
export interface DropValidation {
  isValid: boolean
  reason?: string
}

// Drag event data
export interface DragEventData {
  column: ColumnInfo
  sourceElement: HTMLElement
  timestamp: number
}

// Drop event data
export interface DropEventData {
  column: ColumnInfo
  target: DropTarget
  position: { x: number; y: number }
  timestamp: number
}

// Visual feedback states
export interface DragVisualState {
  isDragging: boolean
  draggedColumn: ColumnInfo | null
  validDropTargets: string[] // Array of target paths
  invalidDropTargets: string[] // Array of target paths
  hoveredTarget: string | null // Target path
}

// Drag and drop configuration
export interface DragDropConfig {
  enableVisualFeedback: boolean
  highlightValidTargets: boolean
  showInvalidTargetWarnings: boolean
  animationDuration: number
  snapToTarget: boolean
}
