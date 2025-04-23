/**
 * Recursive text chunker
 * Splits text hierarchically based on different separators
 */

/**
 * Split text recursively using a list of separators
 * @param {string} text - Text to split into chunks
 * @param {Array<string>} separators - List of separators to use for splitting (in order)
 * @param {number} chunkSize - Target size of each chunk in characters
 * @param {number} chunkOverlap - Number of characters to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
export function splitRecursively(text, separators = ['\n\n', '\n', '. ', ' '], chunkSize = 1000, chunkOverlap = 200) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Base case: if text is smaller than chunk size or we've run out of separators
  if (text.length <= chunkSize || separators.length === 0) {
    return [text];
  }
  
  const chunks = [];
  const currentSeparator = separators[0];
  const remainingSeparators = separators.slice(1);
  
  // Split text by current separator
  const segments = text.split(currentSeparator);
  
  let currentChunk = '';
  
  for (const segment of segments) {
    // If adding this segment would exceed chunk size
    if ((currentChunk + segment).length > chunkSize && currentChunk.length > 0) {
      // Add current chunk to chunks array
      chunks.push(currentChunk.trim());
      
      // Start a new chunk with overlap
      const overlapSize = Math.min(chunkOverlap, currentChunk.length);
      currentChunk = currentChunk.substring(currentChunk.length - overlapSize) + currentSeparator + segment;
    } else {
      // Add segment to current chunk
      if (currentChunk.length > 0) {
        currentChunk += currentSeparator;
      }
      currentChunk += segment;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // If chunks are still too large, recursively split them using the next separator
  if (remainingSeparators.length > 0) {
    return chunks.flatMap(chunk => 
      chunk.length > chunkSize 
        ? splitRecursively(chunk, remainingSeparators, chunkSize, chunkOverlap)
        : [chunk]
    );
  }
  
  return chunks;
}

/**
 * Split text by headings (useful for markdown documents)
 * @param {string} text - Text to split into chunks
 * @param {number} minHeadingLevel - Minimum heading level to split on (1 for #, 2 for ##, etc.)
 * @returns {Array<Object>} Array of chunks with heading and content
 */
export function splitByHeadings(text, minHeadingLevel = 1) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Create regex to match headings of specified level or higher
  const headingRegex = new RegExp(`^#{${minHeadingLevel},6}\\s+(.+)$`, 'gm');
  
  // Find all heading positions
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(text)) !== null) {
    headings.push({
      index: match.index,
      title: match[0].trim(),
      level: match[0].indexOf(' ')  // Number of # characters
    });
  }
  
  if (headings.length === 0) {
    return [{
      title: 'Text',
      content: text,
      level: 0
    }];
  }
  
  // Create chunks based on headings
  const chunks = [];
  
  // Add text before first heading if it exists
  if (headings[0].index > 0) {
    chunks.push({
      title: 'Introduction',
      content: text.substring(0, headings[0].index).trim(),
      level: 0
    });
  }
  
  // Add chunks for each heading
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextIndex = (i < headings.length - 1) ? headings[i + 1].index : text.length;
    
    chunks.push({
      title: heading.title.replace(/^#+\s+/, ''),  // Remove # symbols
      content: text.substring(heading.index, nextIndex).trim(),
      level: heading.level
    });
  }
  
  return chunks;
}
