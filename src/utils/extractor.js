/**
 * Backward compatibility shim
 * Re-exports TamilDhool stream extractor from modular provider location: src/providers/tamildhool/extractor.js
 */
export * from '../providers/tamildhool/extractor.js';
import { extractStreamsFromHtml } from '../providers/tamildhool/extractor.js';
export default extractStreamsFromHtml;
