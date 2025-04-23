/**
 * Simple text chunker
 * Splits text into chunks based on character count
 */

/**
 * Split text into chunks of approximately the specified size
 * @param {string} text - Text to split into chunks
 * @param {number} chunkSize - Target size of each chunk in characters
 * @param {number} chunkOverlap - Number of characters to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
export function splitByCharacterCount(text, chunkSize = 1000, chunkOverlap = 200) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  if (text.length <= chunkSize) {
    return [text];
  }
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + chunkSize;
    
    // If we're not at the end of the text, try to find a good break point
    if (endIndex < text.length) {
      // Look for a period, question mark, or exclamation mark followed by a space
      const periodIndex = text.indexOf('. ', endIndex - 100);
      const questionIndex = text.indexOf('? ', endIndex - 100);
      const exclamationIndex = text.indexOf('! ', endIndex - 100);
      
      // Find the closest sentence boundary after endIndex - 100
      const sentenceEndIndices = [periodIndex, questionIndex, exclamationIndex]
        .filter(index => index !== -1 && index < endIndex)
        .sort((a, b) => Math.abs(a - endIndex) - Math.abs(b - endIndex));
      
      if (sentenceEndIndices.length > 0) {
        // Use the closest sentence boundary
        endIndex = sentenceEndIndices[0] + 2; // +2 to include the punctuation and space
      } else {
        // If no sentence boundary found, look for a space
        const spaceIndex = text.lastIndexOf(' ', endIndex);
        if (spaceIndex !== -1 && spaceIndex > startIndex) {
          endIndex = spaceIndex + 1; // +1 to include the space
        }
      }
    }
    
    // Extract the chunk
    chunks.push(text.substring(startIndex, endIndex).trim());
    
    // Move to the next chunk, accounting for overlap
    startIndex = endIndex - chunkOverlap;
  }
  
  return chunks;
}

/**
 * Split text into chunks based on paragraphs
 * @param {string} text - Text to split into chunks
 * @param {number} maxParagraphsPerChunk - Maximum number of paragraphs per chunk
 * @param {number} paragraphOverlap - Number of paragraphs to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
export function splitByParagraphs(text, maxParagraphsPerChunk = 5, paragraphOverlap = 1) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Split text into paragraphs (double newlines or more)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // If we have fewer paragraphs than the max, just return the whole text
  if (paragraphs.length <= maxParagraphsPerChunk) {
    return [text];
  }
  
  // Validate parameters
  const validMaxParagraphs = Math.max(1, maxParagraphsPerChunk);
  const validOverlap = Math.min(Math.max(0, paragraphOverlap), validMaxParagraphs - 1);
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < paragraphs.length) {
    // Calculate end index for this chunk
    const endIndex = Math.min(startIndex + validMaxParagraphs, paragraphs.length);
    
    // Extract the paragraphs for this chunk
    const chunkParagraphs = paragraphs.slice(startIndex, endIndex);
    
    // Join paragraphs and add to chunks
    chunks.push(chunkParagraphs.join('\n\n'));
    
    // Move to the next chunk, accounting for overlap
    startIndex = Math.max(startIndex + 1, endIndex - validOverlap);
    
    // Ensure we're making progress
    if (startIndex >= paragraphs.length) break;
  }
  
  return chunks;
}
