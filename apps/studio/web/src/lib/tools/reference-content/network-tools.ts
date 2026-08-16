import { createToolReference } from "./create-tool-reference";
import type { ToolReferenceRegistry } from "./types";

export const networkToolReferences = {
  "/tools/network-tools/ipv4-subnet-calculator": createToolReference(
    "/tools/network-tools/ipv4-subnet-calculator",
    {
      summary:
        "Parse an IPv4 CIDR block and calculate its network, broadcast, mask, address range, host capacity, and related subnet details.",
      useCases: [
        "Plan a development or private-network subnet.",
        "Check CIDR calculations while reviewing firewall and routing rules.",
      ],
      examples: [
        "Inspect the usable range for 192.168.1.0/24.",
        "Compare host capacity across two prefix lengths.",
      ],
      considerations:
        "Usable-host conventions vary for special prefixes and point-to-point links. Confirm reserved ranges, routing, and provider-specific rules.",
    },
  ),
  "/tools/network-tools/ipv4-address-converter": createToolReference(
    "/tools/network-tools/ipv4-address-converter",
    {
      summary:
        "Convert an IPv4 address into binary, decimal, hexadecimal, and supported IPv6-compatible representations for debugging and education.",
      useCases: [
        "Inspect address bytes and bit patterns.",
        "Translate an address into a format required by another tool or document.",
      ],
      examples: [
        "Convert 192.168.1.1 into binary octets.",
        "Inspect the integer representation of a test address.",
      ],
      considerations:
        "A numeric conversion does not validate reachability, ownership, routing, or safety. Preserve octet order and confirm the expected IPv6 mapping convention.",
    },
  ),
  "/tools/network-tools/ipv4-range-expander": createToolReference(
    "/tools/network-tools/ipv4-range-expander",
    {
      summary:
        "Analyze a start and end IPv4 address and derive a covering subnet or CIDR representation for planning and rule review.",
      useCases: [
        "Summarize a development address range.",
        "Check whether two endpoints fit inside a proposed subnet.",
      ],
      examples: [
        "Calculate a CIDR candidate for a small private range.",
        "Compare a copied firewall range with its covering network.",
      ],
      considerations:
        "One covering CIDR can include addresses outside the original range. Use multiple CIDRs when exact coverage matters and review reserved networks.",
    },
  ),
  "/tools/network-tools/mac-address-lookup": createToolReference(
    "/tools/network-tools/mac-address-lookup",
    {
      summary:
        "Look up the organization associated with the vendor prefix of a MAC address for inventory review and network troubleshooting.",
      useCases: [
        "Identify the likely manufacturer of a device fixture.",
        "Add vendor context while reviewing a local network inventory.",
      ],
      examples: [
        "Look up the first three bytes of a copied MAC address.",
        "Compare vendor results for several device addresses.",
      ],
      considerations:
        "Vendor databases can be incomplete or outdated, and randomized or locally administered addresses may not identify a manufacturer or device owner.",
    },
  ),
} satisfies ToolReferenceRegistry;
