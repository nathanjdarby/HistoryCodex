export { PACKAGE_VERSION, SUPPORTED_RENDER_KINDS } from "./layout";
export type {
  CardLayoutV1,
  CardLayoutV1 as CardLayout,
  LayoutBox,
  LayoutDocument,
  LayoutDocumentV2,
  LayoutElementId,
  LayoutElementInstance,
  LayoutElementState,
  RenderKind,
} from "./layout";
export {
  DEFAULT_LAYOUT,
  DEFAULT_LAYOUT_V1,
  DEFAULT_LAYOUT_V2,
  LAYOUT_ELEMENT_IDS,
  LAYOUT_ELEMENT_LABELS,
  addInstance,
  cloneLayout,
  cloneLayoutDocument,
  cloneLayoutV1,
  defaultBoxForElementType,
  elementState,
  getInstanceState,
  isLayoutV2,
  layoutToStorage,
  migrateV1ToV2,
  newInstanceId,
  normalizeLayout,
  removeInstance,
  updateInstance,
} from "./layout";

export type { CardDesignData, CardType, Rarity, Archetype, EraDesign, ImageFrame } from "./types";
export { blankCard } from "./types";

export { formatAbilityBody } from "./abilityFormat";
export { RARITY_ORDER, RARITY_TOKENS, nameFontSize, withAlpha } from "./rarity";
export type { RarityToken } from "./rarity";

export {
  buildRegistry,
  elementAppliesToCard,
  evaluateVisibilityRule,
  getCardFieldValue,
  isRenderKindSupported,
  parseDataFieldRow,
  parseElementTypeRow,
} from "./registry";
export type { CardDataField, ElementRegistry, ElementType, ElementTypeConfig, RegistryRow, VisibilityRule } from "./registry";

export { resolveCardLayout, resolveLayoutId } from "./resolveLayout";
export type { LayoutAssignments, LayoutPresetRef, ResolveLayoutInput } from "./resolveLayout";

export { configInlineStyle, mergeInlineStyles } from "./inlineStyles";
export {
  characterCardToRow,
  characterRowExtras,
  characterRowToCard,
  mapCharacterToCard,
  characterRowFromCard,
} from "./characterRow";
export type { CharacterRow, CharacterRowToCardOptions, EraSource } from "./characterRow";
export { BUILTIN_REGISTRY, BUILTIN_ELEMENT_ROWS, BUILTIN_FIELD_ROWS } from "./builtinRegistry";
export { CardRenderer, CardPreview, registryFromRows } from "./CardRenderer";
export type { ArtFrameRenderContext } from "./CardRenderer";
export { DraggableBox } from "./DraggableBox";
