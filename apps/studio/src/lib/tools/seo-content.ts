import { calculatorToolReferences } from "./reference-content/calculators";
import { codeDevToolReferences } from "./reference-content/code-dev-tools";
import { converterToolReferences } from "./reference-content/converters";
import { formatterToolReferences } from "./reference-content/formatters";
import { generatorToolReferences } from "./reference-content/generators";
import { hashEncryptionToolReferences } from "./reference-content/hash-encryption";
import { mediaQrToolReferences } from "./reference-content/media-qr";
import { networkToolReferences } from "./reference-content/network-tools";
import { otherToolReferences } from "./reference-content/other";
import { parserValidatorToolReferences } from "./reference-content/parsers-validators";
import { textToolReferences } from "./reference-content/text-tools";

import type { ToolReferenceRegistry } from "./reference-content/types";

export const toolSeoContentByPath: ToolReferenceRegistry = {
  ...generatorToolReferences,
  ...hashEncryptionToolReferences,
  ...converterToolReferences,
  ...textToolReferences,
  ...parserValidatorToolReferences,
  ...formatterToolReferences,
  ...codeDevToolReferences,
  ...networkToolReferences,
  ...mediaQrToolReferences,
  ...calculatorToolReferences,
  ...otherToolReferences,
};
